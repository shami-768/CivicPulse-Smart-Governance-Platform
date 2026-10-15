package com.civicpulse.backend.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.civicpulse.backend.dto.MlPredictionRequest;
import com.civicpulse.backend.dto.MlPredictionResponse;
import com.civicpulse.backend.dto.PriorityCalculationResult;
import com.civicpulse.backend.entity.Complaint;
import com.civicpulse.backend.entity.Priority;

/**
 * ComplaintPriorityService
 * ─────────────────────────────────────────────────────────────────────────────
 * PRIMARY PATH  : Calls the Python FastAPI ML microservice (Random Forest model)
 *                 to predict priority via POST http://localhost:8000/predict
 *
 * FALLBACK PATH : If the ML service is unreachable or returns an error,
 *                 automatically falls back to the local rule-based keyword
 *                 scoring algorithm — ensuring complaints are never blocked.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Service
public class ComplaintPriorityService {

    private static final Logger log = LoggerFactory.getLogger(ComplaintPriorityService.class);

    // ── ML Service Configuration ──────────────────────────────────────────────
    @Value("${ml.service.url:http://localhost:8000}")
    private String mlServiceUrl = "http://localhost:8000";

    private final RestTemplate restTemplate;

    public ComplaintPriorityService() {
        this.restTemplate = null;
    }

    @Autowired
    public ComplaintPriorityService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // ── Rule-Based Keyword Definitions (used as fallback) ─────────────────────
    private static final String[] CRITICAL_KEYWORDS = {
        "fire", "burning", "explosion", "accident", "electrocution", "live wire",
        "exposed wire", "gas leak", "major flooding", "severe flooding",
        "life threatening", "emergency", "trapped", "building collapse",
        "collapse", "dangerous", "immediate danger"
    };

    private static final String[] HIGH_KEYWORDS = {
        "hospital", "school", "main road", "blocked road", "major leak",
        "burst pipe", "burst", "sewage overflow", "contaminated water",
        "unsafe", "hazardous", "severe", "urgent", "heavily damaged",
        "large garbage accumulation", "traffic blockage", "street completely dark", "flooding"
    };

    private static final String[] MEDIUM_KEYWORDS = {
        "damaged", "broken", "leakage", "overflowing", "pothole",
        "drainage issue", "garbage", "water problem", "street light not working",
        "road issue", "frequent", "repeated"
    };

    private static final String[] MINOR_KEYWORDS = {
        "minor", "small", "flicker", "flickering", "peeling", "faded",
        "routine", "cleaning", "seepage", "bench", "paint", "grass", "litter",
        "hairline", "slow drip", "dripping", "cosmetic", "sweeping"
    };

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    public PriorityCalculationResult calculatePriority(Complaint complaint) {
        return calculatePriority(complaint, 0);
    }

    /**
     * Main entry point. Tries the ML service first; falls back to rule-based.
     */
    public PriorityCalculationResult calculatePriority(Complaint complaint, long repeatedCount) {
        if (complaint == null) {
            return new PriorityCalculationResult(10, Priority.LOW,
                    "Default low priority assigned for empty complaint.",
                    "Low priority assigned by default.");
        }

        // ── 1. Try ML Service ─────────────────────────────────────────────────
        try {
            PriorityCalculationResult mlResult = callMlService(complaint, repeatedCount);
            if (mlResult != null) {
                log.info("✅ ML priority assigned: {} (score={}) for complaint title='{}'",
                        mlResult.getPriority(), mlResult.getScore(), complaint.getTitle());
                return mlResult;
            }
        } catch (Exception e) {
            log.warn("⚠️  ML service unavailable ({}). Falling back to rule-based scoring.", e.getMessage());
        }

        // ── 2. Fallback: Rule-Based Scoring ───────────────────────────────────
        log.info("📋 Using rule-based priority scoring for complaint title='{}'", complaint.getTitle());
        return calculateRuleBasedPriority(complaint, repeatedCount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ML SERVICE CALL
    // ─────────────────────────────────────────────────────────────────────────

    private PriorityCalculationResult callMlService(Complaint complaint, long repeatedCount) {
        if (restTemplate == null || mlServiceUrl == null) {
            return null;
        }
        String endpoint = mlServiceUrl + "/predict";

        // Build request body with smart inference when frontend leaves fields empty
        String resolvedSeverity = resolveSeverity(complaint);
        String resolvedAffected = resolveAffectedPeople(complaint);
        boolean resolvedSafetyRisk = resolveSafetyRisk(complaint);
        boolean resolvedIsPublic = resolveIsPublicLocation(complaint);

        MlPredictionRequest requestBody = new MlPredictionRequest(
                complaint.getTitle() != null ? complaint.getTitle() : "",
                complaint.getDescription() != null ? complaint.getDescription() : "",
                complaint.getLocation() != null ? complaint.getLocation() : "",
                complaint.getCategory() != null ? complaint.getCategory() : "Other",
                resolvedSeverity,
                resolvedAffected,
                resolvedSafetyRisk,
                resolvedIsPublic,
                (int) Math.min(repeatedCount, Integer.MAX_VALUE)
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<MlPredictionRequest> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<MlPredictionResponse> response =
                restTemplate.postForEntity(endpoint, entity, MlPredictionResponse.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("ML service returned non-OK status: " + response.getStatusCode());
        }

        MlPredictionResponse mlResp = response.getBody();

        // Map ML response → PriorityCalculationResult
        Priority priority = mapToPriority(mlResp.getPriority());
        int score = mlResp.getScore();

        String breakdown = String.format(
                "[ML] %s | Model: %s | Confidence: %.1f%%",
                mlResp.getBreakdown() != null ? mlResp.getBreakdown() : "Random Forest prediction",
                mlResp.getModel() != null ? mlResp.getModel() : "random-forest-v1",
                mlResp.getConfidence() * 100
        );

        String reason = buildMlReason(priority, score, mlResp, complaint.getCategory());

        return new PriorityCalculationResult(score, priority, breakdown, reason);
    }

    private Priority mapToPriority(String label) {
        if (label == null) return Priority.LOW;
        return switch (label.toUpperCase().trim()) {
            case "HIGH", "CRITICAL" -> Priority.HIGH;
            case "MEDIUM"           -> Priority.MEDIUM;
            default                 -> Priority.LOW;
        };
    }

    private String buildMlReason(Priority priority, int score, MlPredictionResponse mlResp, String category) {
        double highProb   = mlResp.getProbabilities() != null ? mlResp.getProbabilities().getOrDefault("HIGH", 0.0)   : 0.0;
        double mediumProb = mlResp.getProbabilities() != null ? mlResp.getProbabilities().getOrDefault("MEDIUM", 0.0) : 0.0;
        double lowProb    = mlResp.getProbabilities() != null ? mlResp.getProbabilities().getOrDefault("LOW", 0.0)    : 0.0;

        return String.format(
                "ML Model (Random Forest) predicted %s priority for '%s' complaint. " +
                "Confidence: %.1f%% | HIGH=%.1f%% MEDIUM=%.1f%% LOW=%.1f%% (Score: %d)",
                priority.name(),
                category != null ? category : "Civic",
                mlResp.getConfidence() * 100,
                highProb * 100, mediumProb * 100, lowProb * 100,
                score
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FALLBACK: RULE-BASED KEYWORD SCORING
    // ─────────────────────────────────────────────────────────────────────────

    private PriorityCalculationResult calculateRuleBasedPriority(Complaint complaint, long repeatedCount) {
        int score = 0;
        List<String> breakdownPoints = new ArrayList<>();
        Set<String> matchedCritical = new LinkedHashSet<>();
        Set<String> matchedHigh     = new LinkedHashSet<>();
        Set<String> matchedMedium   = new LinkedHashSet<>();

        // 1. Category Base Score
        int categoryScore = getCategoryBaseScore(complaint.getCategory());
        score += categoryScore;
        breakdownPoints.add(String.format("[Rule] Category (%s): +%d",
                complaint.getCategory() != null ? complaint.getCategory() : "Other", categoryScore));

        // Normalize full text
        String titleText = complaint.getTitle()       != null ? complaint.getTitle().toLowerCase()       : "";
        String descText  = complaint.getDescription() != null ? complaint.getDescription().toLowerCase() : "";
        String locText   = complaint.getLocation()    != null ? complaint.getLocation().toLowerCase()    : "";
        String fullText  = (titleText + " " + descText + " " + locText).replaceAll("[^a-z0-9\\s]", " ");

        // 2. Critical Keywords (+50 each)
        for (String kw : CRITICAL_KEYWORDS) {
            if (fullText.contains(kw)) matchedCritical.add(kw);
        }
        int criticalScore = matchedCritical.size() * 50;
        if (criticalScore > 0) {
            score += criticalScore;
            breakdownPoints.add(String.format("Critical Keywords (%s): +%d",
                    String.join(", ", matchedCritical), criticalScore));
        }

        // 3. High Keywords (+25 each)
        for (String kw : HIGH_KEYWORDS) {
            if (fullText.contains(kw) && !matchedCritical.contains(kw)) matchedHigh.add(kw);
        }
        int highScore = matchedHigh.size() * 25;
        if (highScore > 0) {
            score += highScore;
            breakdownPoints.add(String.format("High Keywords (%s): +%d",
                    String.join(", ", matchedHigh), highScore));
        }

        // 4. Medium Keywords (+15 each so two medium indicators trigger MEDIUM priority)
        for (String kw : MEDIUM_KEYWORDS) {
            if (fullText.contains(kw) && !matchedCritical.contains(kw) && !matchedHigh.contains(kw)) {
                matchedMedium.add(kw);
            }
        }
        int mediumScore = matchedMedium.size() * 15;
        if (mediumScore > 0) {
            score += mediumScore;
            breakdownPoints.add(String.format("Medium Keywords (%s): +%d",
                    String.join(", ", matchedMedium), mediumScore));
        }

        // 5. Repeated complaints (+15)
        if (repeatedCount > 0) {
            score += 15;
            breakdownPoints.add(String.format("Repeated Reports (%d): +15", repeatedCount));
        }

        Priority priority = Priority.fromScore(score);
        String breakdownText = String.join(" | ", breakdownPoints)
                + String.format(" => Total Score: %d (%s)", score, priority.name());

        String reason = generateRuleReason(priority, score, matchedCritical, matchedHigh, matchedMedium,
                complaint.getCategory());

        return new PriorityCalculationResult(score, priority, breakdownText, reason);
    }

    private int getCategoryBaseScore(String category) {
        if (category == null || category.isBlank()) return 10;
        String cat = category.toLowerCase();
        if (cat.contains("fire")        || cat.contains("emergency"))  return 40;
        if (cat.contains("electricity") || cat.contains("power"))      return 20;
        if (cat.contains("water")       || cat.contains("leak"))       return 15;
        if (cat.contains("road")        || cat.contains("street light"))return 15;
        if (cat.contains("drainage")    || cat.contains("sewer"))      return 15;
        if (cat.contains("sanitation")  || cat.contains("garbage")
                                        || cat.contains("waste"))      return 15;
        return 10;
    }

    private String generateRuleReason(Priority priority, int score,
                                       Set<String> critical, Set<String> high, Set<String> medium,
                                       String category) {
        List<String> kws = new ArrayList<>();
        kws.addAll(critical);
        kws.addAll(high);
        kws.addAll(medium);

        if (!critical.isEmpty() || !high.isEmpty()) {
            return String.format("(Fallback) High-risk indicators detected: %s. (Score: %d)",
                    String.join(", ", kws), score);
        } else if (!medium.isEmpty()) {
            return String.format("(Fallback) %s issue with moderate urgency: %s. (Score: %d)",
                    category != null ? category : "Civic", String.join(", ", medium), score);
        } else if (priority == Priority.HIGH) {
            return String.format("(Fallback) High priority via emergency category (%s). (Score: %d)",
                    category != null ? category : "Emergency", score);
        } else if (priority == Priority.MEDIUM) {
            return String.format("(Fallback) Medium priority from category context. (Score: %d)", score);
        } else {
            return String.format("(Fallback) Routine civic complaint with low urgency. (Score: %d)", score);
        }
    }

    private String resolveSeverity(Complaint complaint) {
        if (complaint.getSeverity() != null && !complaint.getSeverity().isBlank()) {
            return complaint.getSeverity();
        }
        String title = complaint.getTitle() != null ? complaint.getTitle().toLowerCase() : "";
        String desc = complaint.getDescription() != null ? complaint.getDescription().toLowerCase() : "";
        String text = title + " " + desc;

        for (String kw : CRITICAL_KEYWORDS) {
            if (text.contains(kw)) return "Critical";
        }
        for (String kw : HIGH_KEYWORDS) {
            if (text.contains(kw)) return "Severe";
        }
        for (String kw : MINOR_KEYWORDS) {
            if (text.contains(kw)) return "Minor";
        }
        for (String kw : MEDIUM_KEYWORDS) {
            if (text.contains(kw)) return "Moderate";
        }

        String cat = complaint.getCategory() != null ? complaint.getCategory().toLowerCase() : "";
        if (cat.contains("fire") || cat.contains("emergency")) return "Critical";
        if (cat.contains("road") || cat.contains("water") || cat.contains("drainage")
                || cat.contains("garbage") || cat.contains("sanitation") || cat.contains("electricity")) {
            return "Moderate";
        }
        return "Minor";
    }

    private String resolveAffectedPeople(Complaint complaint) {
        if (complaint.getAffectedPeople() != null && !complaint.getAffectedPeople().isBlank()) {
            return complaint.getAffectedPeople();
        }
        String title = complaint.getTitle() != null ? complaint.getTitle().toLowerCase() : "";
        String desc = complaint.getDescription() != null ? complaint.getDescription().toLowerCase() : "";
        String text = title + " " + desc;

        for (String kw : CRITICAL_KEYWORDS) {
            if (text.contains(kw)) return "100+";
        }
        for (String kw : HIGH_KEYWORDS) {
            if (text.contains(kw)) return "50-100";
        }
        for (String kw : MINOR_KEYWORDS) {
            if (text.contains(kw)) return "1-10";
        }
        String cat = complaint.getCategory() != null ? complaint.getCategory().toLowerCase() : "";
        if (cat.contains("road") || cat.contains("water") || cat.contains("drainage")
                || cat.contains("garbage") || cat.contains("electricity")) {
            return "10-50";
        }
        return "1-10";
    }

    private boolean resolveSafetyRisk(Complaint complaint) {
        if (complaint.getSafetyRisk() != null) {
            return complaint.getSafetyRisk();
        }
        String title = complaint.getTitle() != null ? complaint.getTitle().toLowerCase() : "";
        String desc = complaint.getDescription() != null ? complaint.getDescription().toLowerCase() : "";
        String text = title + " " + desc;

        for (String kw : CRITICAL_KEYWORDS) {
            if (text.contains(kw)) return true;
        }
        String cat = complaint.getCategory() != null ? complaint.getCategory().toLowerCase() : "";
        return cat.contains("fire") || cat.contains("emergency");
    }

    private boolean resolveIsPublicLocation(Complaint complaint) {
        if (complaint.getIsPublicLocation() != null) {
            return complaint.getIsPublicLocation();
        }
        return true;
    }
}
