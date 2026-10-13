package com.civicpulse.backend.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.civicpulse.backend.dto.PriorityCalculationResult;
import com.civicpulse.backend.entity.Complaint;
import com.civicpulse.backend.entity.Priority;

@Service
public class ComplaintPriorityService {

    // Keyword definitions
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

    public PriorityCalculationResult calculatePriority(Complaint complaint) {
        return calculatePriority(complaint, 0);
    }

    public PriorityCalculationResult calculatePriority(Complaint complaint, long repeatedCount) {
        if (complaint == null) {
            return new PriorityCalculationResult(10, Priority.LOW, 
                    "Default low priority assigned for empty complaint.", 
                    "Low priority assigned by default.");
        }

        int score = 0;
        List<String> breakdownPoints = new ArrayList<>();
        Set<String> matchedCritical = new LinkedHashSet<>();
        Set<String> matchedHigh = new LinkedHashSet<>();
        Set<String> matchedMedium = new LinkedHashSet<>();

        // 1. Category Base Score
        int categoryScore = getCategoryBaseScore(complaint.getCategory());
        score += categoryScore;
        breakdownPoints.add(String.format("Category (%s): +%d", 
                complaint.getCategory() != null ? complaint.getCategory() : "Other", categoryScore));

        // Normalize text from title, description, and location
        String titleText = complaint.getTitle() != null ? complaint.getTitle().toLowerCase() : "";
        String descText = complaint.getDescription() != null ? complaint.getDescription().toLowerCase() : "";
        String locText = complaint.getLocation() != null ? complaint.getLocation().toLowerCase() : "";
        String fullText = (titleText + " " + descText + " " + locText).replaceAll("[^a-z0-9\\s]", " ");

        // 2. Critical Keywords (+50 per unique keyword)
        for (String kw : CRITICAL_KEYWORDS) {
            if (fullText.contains(kw)) {
                matchedCritical.add(kw);
            }
        }
        int criticalScore = matchedCritical.size() * 50;
        if (criticalScore > 0) {
            score += criticalScore;
            breakdownPoints.add(String.format("Critical Keywords (%s): +%d", String.join(", ", matchedCritical), criticalScore));
        }

        // 3. High Keywords (+25 per unique keyword)
        for (String kw : HIGH_KEYWORDS) {
            if (fullText.contains(kw) && !matchedCritical.contains(kw)) {
                matchedHigh.add(kw);
            }
        }
        int highScore = matchedHigh.size() * 25;
        if (highScore > 0) {
            score += highScore;
            breakdownPoints.add(String.format("High Keywords (%s): +%d", String.join(", ", matchedHigh), highScore));
        }

        // 4. Medium Keywords (+10 per unique keyword)
        for (String kw : MEDIUM_KEYWORDS) {
            if (fullText.contains(kw) && !matchedCritical.contains(kw) && !matchedHigh.contains(kw)) {
                matchedMedium.add(kw);
            }
        }
        int mediumScore = matchedMedium.size() * 10;
        if (mediumScore > 0) {
            score += mediumScore;
            breakdownPoints.add(String.format("Medium Keywords (%s): +%d", String.join(", ", matchedMedium), mediumScore));
        }

        // 5. Repeated complaints factor
        if (repeatedCount > 0) {
            score += 15;
            breakdownPoints.add(String.format("Repeated Reports (%d): +15", repeatedCount));
        }

        // Final Priority Classification: 80+ => HIGH, 50-79 => MEDIUM, <50 => LOW
        Priority priority = Priority.fromScore(score);
        String breakdownText = String.join(" | ", breakdownPoints) + String.format(" => Total Score: %d (%s)", score, priority.name());

        // Generate automated priority reason
        String reason = generatePriorityReason(priority, score, matchedCritical, matchedHigh, matchedMedium, complaint.getCategory());

        return new PriorityCalculationResult(score, priority, breakdownText, reason);
    }

    private int getCategoryBaseScore(String category) {
        if (category == null || category.isBlank()) {
            return 5;
        }

        String cat = category.toLowerCase();
        if (cat.contains("fire") || cat.contains("emergency")) {
            return 40;
        }
        if (cat.contains("electricity") || cat.contains("power")) {
            return 20;
        }
        if (cat.contains("water") || cat.contains("leak")) {
            return 15;
        }
        if (cat.contains("road") || cat.contains("street light")) {
            return 15;
        }
        if (cat.contains("drainage") || cat.contains("sewer")) {
            return 15;
        }
        if (cat.contains("sanitation") || cat.contains("garbage") || cat.contains("waste")) {
            return 10;
        }
        return 5;
    }

    private String generatePriorityReason(Priority priority, int score, 
                                           Set<String> critical, Set<String> high, Set<String> medium, 
                                           String category) {
        List<String> keywords = new ArrayList<>();
        keywords.addAll(critical);
        keywords.addAll(high);
        keywords.addAll(medium);

        if (!critical.isEmpty() || !high.isEmpty()) {
            return String.format("High-risk indicators detected in complaint: %s. (Calculated Score: %d)", 
                    String.join(", ", keywords), score);
        } else if (!medium.isEmpty()) {
            return String.format("%s issue detected with moderate urgency indicators: %s. (Calculated Score: %d)", 
                    category != null ? category : "Civic", String.join(", ", medium), score);
        } else if (priority == Priority.HIGH) {
            return String.format("High priority automatically assigned based on emergency category (%s). (Score: %d)", 
                    category != null ? category : "Emergency", score);
        } else if (priority == Priority.MEDIUM) {
            return String.format("Medium priority assigned based on category and complaint context. (Score: %d)", score);
        } else {
            return String.format("Routine civic complaint registered with low urgency indicators. (Score: %d)", score);
        }
    }
}
