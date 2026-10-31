package com.civicpulse.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.civicpulse.backend.dto.DepartmentPriorityDistributionDTO;
import com.civicpulse.backend.dto.PriorityCalculationResult;
import com.civicpulse.backend.dto.PriorityDistributionResponseDTO;
import com.civicpulse.backend.entity.Complaint;
import com.civicpulse.backend.repository.ComplaintRepository;

@Service
public class ComplaintService {

    private static final Logger log = LoggerFactory.getLogger(ComplaintService.class);

    private final ComplaintRepository complaintRepository;
    private final NotificationService notificationService;
    private final ComplaintPriorityService complaintPriorityService;
    private final ComplaintDepartmentService complaintDepartmentService;

    public ComplaintService(
            ComplaintRepository complaintRepository,
            NotificationService notificationService,
            ComplaintPriorityService complaintPriorityService,
            ComplaintDepartmentService complaintDepartmentService) {

        this.complaintRepository = complaintRepository;
        this.notificationService = notificationService;
        this.complaintPriorityService = complaintPriorityService;
        this.complaintDepartmentService = complaintDepartmentService;
    }

    // =========================================================
    // CREATE COMPLAINT
    // =========================================================
    public Complaint createComplaint(Complaint complaint) {

        if (complaint.getCategory() == null || complaint.getCategory().trim().isEmpty()) {
            throw new IllegalArgumentException("Complaint category is required.");
        }

        complaint.setStatus(normalizeStatus(complaint.getStatus()));

        // Automatically map Category -> Department (ignore any client-supplied departmentId)
        var department = complaintDepartmentService.getDepartmentForCategory(complaint.getCategory());
        complaint.setDepartmentId(department.getId());
        complaint.setDepartmentCode(department.getDepartmentCode());
        complaint.setDepartmentName(department.getDepartmentName());

        // =========================================================
// DUPLICATE COMPLAINT DETECTION
// =========================================================
        if (complaint.getLocation() != null
                && complaint.getTitle() != null
                && complaint.getDescription() != null) {

            List<Complaint> existingComplaints
                    = complaintRepository.findByCategoryIgnoreCaseAndLocationIgnoreCase(
                            complaint.getCategory(),
                            complaint.getLocation());

            for (Complaint existing : existingComplaints) {

                double titleSimilarity
                        = calculateSimilarity(
                                complaint.getTitle(),
                                existing.getTitle());

                double descriptionSimilarity
                        = calculateSimilarity(
                                complaint.getDescription(),
                                existing.getDescription());

                // Weighted similarity
                double similarityScore
                        = (titleSimilarity * 0.4)
                        + (descriptionSimilarity * 0.6);

                if (similarityScore >= 0.70) {

                    throw new IllegalArgumentException(
                            "Possible duplicate complaint detected. "
                            + "Existing complaint ID: "
                            + existing.getId()
                            + ". Similarity: "
                            + Math.round(similarityScore * 100)
                            + "%"
                    );
                }
            }
        }

// Count existing complaints for repeated complaint factor
        long repeatedCount = 0;

        if (complaint.getLocation() != null) {
            repeatedCount
                    = complaintRepository.countByCategoryIgnoreCaseAndLocationIgnoreCase(
                            complaint.getCategory(),
                            complaint.getLocation());
        }

        // Automatically calculate priority and score (ignore any user-submitted priority)
        PriorityCalculationResult result = complaintPriorityService.calculatePriority(complaint, repeatedCount);
        complaint.setPriority(result.getPriority().name());
        complaint.setPriorityScore(result.getScore());
        complaint.setPriorityBreakdown(result.getBreakdown());
        complaint.setPriorityReason(result.getReason());

        // Assign SLA hours & deadline based on priority (Municipal Smart City Research Benchmark)
        int slaHours = Complaint.calculateSlaHours(result.getPriority().name());
        complaint.setSlaHours(slaHours);
        if (complaint.getCreatedAt() == null) {
            complaint.setCreatedAt(LocalDateTime.now());
        }
        complaint.setSlaDeadline(complaint.getCreatedAt().plusHours(slaHours));
        complaint.setIsEscalated(false);
        complaint.setEscalationLevel("LEVEL_1");
        complaint.setEscalatedTo("Higher Municipal Authority");

        Complaint savedComplaint = complaintRepository.save(complaint);

        // Create real notification after successful complaint creation
        if (savedComplaint.getCitizenId() != null) {

            notificationService.createNotification(
                    savedComplaint.getCitizenId(),
                    savedComplaint.getId(),
                    savedComplaint.getTitle(),
                    "Complaint Received",
                    "Your complaint \"" + savedComplaint.getTitle()
                    + "\" has been registered with " + savedComplaint.getPriority()
                    + " priority (Resolution SLA: " + slaHours + " hours).",
                    "received"
            );
        }

        return savedComplaint;
    }

    // =========================================================
    // GET ALL COMPLAINTS
    // =========================================================
    public List<Complaint> getAllComplaints() {
        checkAndAutoEscalateComplaints();
        return complaintRepository.findAllSortedByPriority();
    }

    public List<Complaint> getAllComplaintsSortedByPriority() {
        checkAndAutoEscalateComplaints();
        return complaintRepository.findAllSortedByPriority();
    }

    // =========================================================
    // DYNAMIC DEPARTMENT PRIORITY DISTRIBUTION API
    // =========================================================
    public PriorityDistributionResponseDTO getPriorityDistribution() {
        List<Complaint> complaints = complaintRepository.findAll();

        Map<String, DepartmentPriorityDistributionDTO> deptMap = new LinkedHashMap<>();
        for (com.civicpulse.backend.entity.CanonicalDepartment cd : com.civicpulse.backend.entity.CanonicalDepartment.values()) {
            deptMap.put(cd.getCode(), new DepartmentPriorityDistributionDTO(cd.getCode(), cd.getName(), 0, 0, 0));
        }

        for (Complaint c : complaints) {
            String deptCode = c.getDepartmentCode();
            if (deptCode == null || deptCode.isBlank()) {
                var cd = com.civicpulse.backend.entity.CanonicalDepartment.fromCategory(c.getCategory());
                deptCode = cd.getCode();
            }

            String finalCode = deptCode;
            DepartmentPriorityDistributionDTO dto = deptMap.computeIfAbsent(deptCode,
                    code -> new DepartmentPriorityDistributionDTO(code, c.getDepartmentName() != null ? c.getDepartmentName() : "Department " + code, 0, 0, 0));

            String priority = c.getPriority() != null ? c.getPriority().toUpperCase() : "LOW";
            if ("HIGH".equals(priority) || "CRITICAL".equals(priority)) {
                dto.setHigh(dto.getHigh() + 1);
            } else if ("MEDIUM".equals(priority)) {
                dto.setMedium(dto.getMedium() + 1);
            } else {
                dto.setLow(dto.getLow() + 1);
            }
            dto.setTotal(dto.getHigh() + dto.getMedium() + dto.getLow());
        }

        List<DepartmentPriorityDistributionDTO> resultList = new ArrayList<>(deptMap.values());
        return new PriorityDistributionResponseDTO(resultList, complaints.size());
    }

    private String mapCategoryToDepartmentCode(String category, String title) {
        String text = ((category != null ? category : "") + " " + (title != null ? title : "")).toLowerCase();
        if (text.contains("sanitation") || text.contains("garbage") || text.contains("waste") || text.contains("drainage")) {
            return "SWM";
        }
        if (text.contains("road") || text.contains("infrastructure") || text.contains("pothole") || text.contains("bridge")) {
            return "PWI";
        }
        if (text.contains("water") || text.contains("sewerage") || text.contains("pipeline") || text.contains("leakage")) {
            return "WSS";
        }
        if (text.contains("electricity") || text.contains("street light") || text.contains("light") || text.contains("power")) {
            return "ESL";
        }
        if (text.contains("health") || text.contains("hygiene") || text.contains("hospital")) {
            return "PHH";
        }
        if (text.contains("environment") || text.contains("park") || text.contains("tree") || text.contains("green")) {
            return "PE";
        }
        if (text.contains("traffic") || text.contains("transport") || text.contains("signal")) {
            return "TT";
        }
        return "SWM";
    }

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void initDatabaseComplaintsPass() {
        try {
            recalculateAllPriorities();
            checkAndAutoEscalateComplaints();
        } catch (Exception e) {
            System.err.println("Database complaints recalculation pass error: " + e.getMessage());
        }
    }

    // =========================================================
    // RECALCULATE PRIORITY & CANONICAL DEPARTMENT
    // =========================================================
    public Complaint recalculatePriority(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (complaint.getCategory() != null && !complaint.getCategory().isBlank()) {
            var department = complaintDepartmentService.getDepartmentForCategory(complaint.getCategory());
            complaint.setDepartmentId(department.getId());
            complaint.setDepartmentCode(department.getDepartmentCode());
            complaint.setDepartmentName(department.getDepartmentName());
        }

        long repeatedCount = complaintRepository.countByCategoryIgnoreCaseAndLocationIgnoreCase(
                complaint.getCategory(), complaint.getLocation());
        if (repeatedCount > 0) {
            repeatedCount -= 1; // Exclude current complaint itself
        }

        PriorityCalculationResult result = complaintPriorityService.calculatePriority(complaint, repeatedCount);
        complaint.setPriority(result.getPriority().name());
        complaint.setPriorityScore(result.getScore());
        complaint.setPriorityBreakdown(result.getBreakdown());
        complaint.setPriorityReason(result.getReason());

        int slaHours = Complaint.calculateSlaHours(result.getPriority().name());
        if (complaint.getSlaHours() == null) {
            complaint.setSlaHours(slaHours);
        }
        if (complaint.getCreatedAt() == null) {
            complaint.setCreatedAt(LocalDateTime.now());
        }
        if (complaint.getSlaDeadline() == null) {
            complaint.setSlaDeadline(complaint.getCreatedAt().plusHours(complaint.getSlaHours()));
        }

        return complaintRepository.save(complaint);
    }

    public List<Complaint> recalculateAllPriorities() {
        List<Complaint> complaints = complaintRepository.findAll();
        for (Complaint c : complaints) {
            if (c.getCategory() != null && !c.getCategory().isBlank()) {
                var department = complaintDepartmentService.getDepartmentForCategory(c.getCategory());
                c.setDepartmentId(department.getId());
                c.setDepartmentCode(department.getDepartmentCode());
                c.setDepartmentName(department.getDepartmentName());
            }

            long repeatedCount = complaintRepository.countByCategoryIgnoreCaseAndLocationIgnoreCase(
                    c.getCategory(), c.getLocation());
            if (repeatedCount > 0) {
                repeatedCount -= 1;
            }
            PriorityCalculationResult result = complaintPriorityService.calculatePriority(c, repeatedCount);
            c.setPriority(result.getPriority().name());
            c.setPriorityScore(result.getScore());
            c.setPriorityBreakdown(result.getBreakdown());
            c.setPriorityReason(result.getReason());

            int slaHours = Complaint.calculateSlaHours(result.getPriority().name());
            if (c.getSlaHours() == null) {
                c.setSlaHours(slaHours);
            }
            if (c.getCreatedAt() == null) {
                c.setCreatedAt(LocalDateTime.now());
            }
            if (c.getSlaDeadline() == null) {
                c.setSlaDeadline(c.getCreatedAt().plusHours(c.getSlaHours()));
            }
            if (c.getIsEscalated() == null) {
                c.setIsEscalated(false);
            }
            if (c.getEscalationLevel() == null) {
                c.setEscalationLevel("LEVEL_1");
            }
            if (c.getEscalatedTo() == null) {
                c.setEscalatedTo("Higher Municipal Authority");
            }
        }
        return complaintRepository.saveAll(complaints);
    }

    // =========================================================
    // GET COMPLAINTS BY CITIZEN
    // =========================================================
    public List<Complaint> getComplaintsByCitizenId(Long citizenId) {
        checkAndAutoEscalateComplaints();
        return complaintRepository.findByCitizenId(citizenId);
    }

    // =========================================================
    // GET COMPLAINTS BY DEPARTMENT
    // =========================================================
    public List<Complaint> getComplaintsByDepartmentId(Long departmentId) {
        checkAndAutoEscalateComplaints();
        return complaintRepository.findByDepartmentId(departmentId);
    }

    // =========================================================
    // GET COMPLAINTS BY STATUS
    // =========================================================
    public List<Complaint> getComplaintsByStatus(String status) {
        return complaintRepository.findByStatus(status);
    }

    // =========================================================
    // GET COMPLAINTS BY PRIORITY
    // =========================================================
    public List<Complaint> getComplaintsByPriority(String priority) {
        return complaintRepository.findByPriority(priority);
    }

    // =========================================================
    // GET COMPLAINT BY ID
    // =========================================================
    public Optional<Complaint> getComplaintById(Long id) {
        return complaintRepository.findById(id);
    }

    // =========================================================
    // UPDATE COMPLAINT
    // =========================================================
    public Complaint updateComplaint(Long id, Complaint updatedComplaint) {

        Complaint existingComplaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        String oldStatus = existingComplaint.getStatus();

        existingComplaint.setTitle(updatedComplaint.getTitle());
        existingComplaint.setDescription(updatedComplaint.getDescription());
        existingComplaint.setCategory(updatedComplaint.getCategory());
        // If already resolved, do not allow changing status away from RESOLVED
        if ("RESOLVED".equalsIgnoreCase(oldStatus)) {
            existingComplaint.setStatus("RESOLVED");
        } else if (updatedComplaint.getStatus() != null && !updatedComplaint.getStatus().isBlank()) {
            existingComplaint.setStatus(normalizeStatus(updatedComplaint.getStatus()));
        }

        if (existingComplaint.getCategory() != null && !existingComplaint.getCategory().isBlank()) {
            var department = complaintDepartmentService.getDepartmentForCategory(existingComplaint.getCategory());
            existingComplaint.setDepartmentId(department.getId());
            existingComplaint.setDepartmentCode(department.getDepartmentCode());
            existingComplaint.setDepartmentName(department.getDepartmentName());
        }

        if (updatedComplaint.getSeverity() != null) {
            existingComplaint.setSeverity(updatedComplaint.getSeverity());
        }
        if (updatedComplaint.getAffectedPeople() != null) {
            existingComplaint.setAffectedPeople(updatedComplaint.getAffectedPeople());
        }
        if (updatedComplaint.getSafetyRisk() != null) {
            existingComplaint.setSafetyRisk(updatedComplaint.getSafetyRisk());
        }
        if (updatedComplaint.getIsPublicLocation() != null) {
            existingComplaint.setIsPublicLocation(updatedComplaint.getIsPublicLocation());
        }
        if (updatedComplaint.getLatitude() != null) {
            existingComplaint.setLatitude(updatedComplaint.getLatitude());
        }
        if (updatedComplaint.getLongitude() != null) {
            existingComplaint.setLongitude(updatedComplaint.getLongitude());
        }
        if (updatedComplaint.getPhotoUrl() != null) {
            existingComplaint.setPhotoUrl(updatedComplaint.getPhotoUrl());
        }

        long repeatedCount = complaintRepository.countByCategoryIgnoreCaseAndLocationIgnoreCase(
                existingComplaint.getCategory(), existingComplaint.getLocation());
        if (repeatedCount > 0) {
            repeatedCount -= 1;
        }

        PriorityCalculationResult result = complaintPriorityService.calculatePriority(existingComplaint, repeatedCount);
        existingComplaint.setPriority(result.getPriority().name());
        existingComplaint.setPriorityScore(result.getScore());
        existingComplaint.setPriorityBreakdown(result.getBreakdown());

        Complaint savedComplaint = complaintRepository.save(existingComplaint);

        // Notify citizen only if status actually changed
        if (savedComplaint.getCitizenId() != null
                && savedComplaint.getStatus() != null
                && !sameStatus(oldStatus, savedComplaint.getStatus())) {

            createStatusNotification(savedComplaint);
        }

        return savedComplaint;
    }

    // =========================================================
    // UPDATE COMPLAINT STATUS
    // =========================================================
    public Complaint updateComplaintStatus(Long id, String status) {
        return updateComplaintStatus(id, status, null);
    }

    public Complaint updateComplaintStatus(Long id, String status, String updatedBy) {

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found with id: " + id));

        // Rule 1: Once a complaint is resolved, it cannot be modified
        if ("RESOLVED".equalsIgnoreCase(complaint.getStatus())) {
            throw new IllegalStateException("Complaint #" + id + " has already been resolved and closed. Status cannot be modified.");
        }

        // Rule 2: Escalated complaints can ONLY be updated by Administrator
        if (Boolean.TRUE.equals(complaint.getIsEscalated())) {
            if (!"ADMIN".equalsIgnoreCase(updatedBy)) {
                throw new IllegalStateException("Access denied: Complaint #" + id + " is escalated to Higher Authority. Only Administrators can update its status.");
            }
        }

        String oldStatus = complaint.getStatus();
        String newStatus = normalizeStatus(status);

        complaint.setStatus(newStatus);

        Complaint savedComplaint = complaintRepository.save(complaint);

        // Rule 3: Always notify citizen whenever status changes (both dept and admin updates)
        if (savedComplaint.getCitizenId() != null
                && !sameStatus(oldStatus, newStatus)) {

            createStatusNotification(savedComplaint, updatedBy);
        }

        // Rule 4: Department officer is notified ONLY when Admin takes action on an escalated complaint
        boolean isAdminActionOnEscalated = "ADMIN".equalsIgnoreCase(updatedBy) && Boolean.TRUE.equals(complaint.getIsEscalated());
        if (isAdminActionOnEscalated && !sameStatus(oldStatus, newStatus)) {
            String deptCode = savedComplaint.getDepartmentCode();
            Long deptId = savedComplaint.getDepartmentId();
            if (deptCode != null || deptId != null) {
                notificationService.createDepartmentNotification(
                        deptId,
                        deptCode,
                        savedComplaint.getId(),
                        savedComplaint.getTitle(),
                        "Admin Action on Escalated Case",
                        "Higher Municipal Authority updated Complaint #" + savedComplaint.getId()
                                + " (\"" + savedComplaint.getTitle() + "\") status to " + newStatus + ".",
                        "admin_action",
                        "ADMIN"
                );
            }
        }

        return savedComplaint;
    }

    // =========================================================
    // ASSIGN DEPARTMENT
    // =========================================================
    public Complaint assignDepartment(Long id, Long departmentId) {

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        complaint.setDepartmentId(departmentId);

        return complaintRepository.save(complaint);
    }

    // =========================================================
    // RESOLVE COMPLAINT
    // =========================================================
    public Complaint resolveComplaint(Long id) {

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if ("RESOLVED".equalsIgnoreCase(complaint.getStatus())) {
            throw new IllegalStateException("Complaint #" + id + " has already been resolved and closed.");
        }

        String oldStatus = complaint.getStatus();

        complaint.setStatus("RESOLVED");

        Complaint savedComplaint = complaintRepository.save(complaint);

        // Notify only when it wasn't already resolved
        if (savedComplaint.getCitizenId() != null
                && !sameStatus(oldStatus, "RESOLVED")) {

            notificationService.createNotification(
                    savedComplaint.getCitizenId(),
                    savedComplaint.getId(),
                    savedComplaint.getTitle(),
                    "Complaint Resolved",
                    "Your complaint \"" + savedComplaint.getTitle()
                    + "\" has been resolved.",
                    "resolved",
                    "DEPARTMENT_OFFICER"
            );
        }

        if (Boolean.TRUE.equals(savedComplaint.getIsEscalated())) {
            notificationService.createDepartmentNotification(
                    savedComplaint.getDepartmentId(),
                    savedComplaint.getDepartmentCode(),
                    savedComplaint.getId(),
                    savedComplaint.getTitle(),
                    "Escalated Complaint Resolved",
                    "Complaint #" + savedComplaint.getId() + " (\"" + savedComplaint.getTitle() + "\") has been marked as RESOLVED.",
                    "resolved",
                    "ADMIN"
            );
        }

        return savedComplaint;
    }

    // =========================================================
    // DELETE COMPLAINT
    // =========================================================
    public void deleteComplaint(Long id) {
        complaintRepository.deleteById(id);
    }

    // =========================================================
    // STATUS NOTIFICATION
    // =========================================================
    private void createStatusNotification(Complaint complaint) {
        createStatusNotification(complaint, null);
    }

    private void createStatusNotification(Complaint complaint, String updatedBy) {

        String status = complaint.getStatus();
        boolean isAdmin = "ADMIN".equalsIgnoreCase(updatedBy) || Boolean.TRUE.equals(complaint.getIsEscalated());

        String deptTitle = complaint.getDepartmentName() != null ? complaint.getDepartmentName() : "Department";
        String actor = isAdmin ? "Higher Municipal Authority / Admin" : deptTitle + " Officer";

        String title;
        String message;
        String type;

        switch (status.toUpperCase()) {

            case "PENDING":
                title = isAdmin ? "Higher Authority: Pending Review" : "Complaint Status: Pending";
                message = "Your complaint \"" + complaint.getTitle()
                        + "\" is pending review by " + actor + ".";
                type = "pending";
                break;

            case "IN_PROGRESS":
                title = isAdmin ? "Higher Authority Action: In Progress" : "Complaint In Progress";
                message = actor + " is now actively processing your complaint \"" + complaint.getTitle() + "\".";
                type = "status";
                break;

            case "RESOLVED":
                title = isAdmin ? "Higher Authority: Resolved" : "Complaint Resolved";
                message = "Your complaint \"" + complaint.getTitle()
                        + "\" has been resolved by " + actor + ".";
                type = "resolved";
                break;

            case "REJECTED":
                title = isAdmin ? "Higher Authority: Rejected" : "Complaint Rejected";
                message = "Your complaint \"" + complaint.getTitle()
                        + "\" has been reviewed and rejected by " + actor + ".";
                type = "warning";
                break;

            default:
                title = "Complaint Status Updated";
                message = "The status of your complaint \""
                        + complaint.getTitle()
                        + "\" has been updated to "
                        + status + " by " + actor + ".";
                type = "status";
        }

        notificationService.createNotification(
                complaint.getCitizenId(),
                complaint.getId(),
                complaint.getTitle(),
                title,
                message,
                type,
                isAdmin ? "ADMIN" : "DEPARTMENT_OFFICER"
        );
    }

    private boolean sameStatus(String first, String second) {

        if (first == null && second == null) {
            return true;
        }

        if (first == null || second == null) {
            return false;
        }

        return normalizeStatus(first).equalsIgnoreCase(normalizeStatus(second));
    }

    public static String normalizeStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return "PENDING";
        }
        String clean = raw.trim().toUpperCase().replace("-", "_").replace(" ", "_");
        if (clean.equals("IN_PROGRESS") || clean.equals("INPROGRESS") || clean.equals("PROGRESS")) {
            return "IN_PROGRESS";
        }
        if (clean.equals("RESOLVED") || clean.equals("RESOLVE") || clean.equals("DONE")) {
            return "RESOLVED";
        }
        if (clean.equals("REJECTED") || clean.equals("REJECT")) {
            return "REJECTED";
        }
        if (clean.equals("PENDING")) {
            return "PENDING";
        }
        return clean;
    }

    private double calculateSimilarity(String text1, String text2) {

        if (text1 == null || text2 == null) {
            return 0.0;
        }

        String[] words1 = normalizeText(text1).split("\\s+");
        String[] words2 = normalizeText(text2).split("\\s+");

        java.util.Set<String> set1
                = new java.util.HashSet<>(java.util.Arrays.asList(words1));

        java.util.Set<String> set2
                = new java.util.HashSet<>(java.util.Arrays.asList(words2));

        if (set1.isEmpty() || set2.isEmpty()) {
            return 0.0;
        }

        java.util.Set<String> intersection
                = new java.util.HashSet<>(set1);

        intersection.retainAll(set2);

        java.util.Set<String> union
                = new java.util.HashSet<>(set1);

        union.addAll(set2);

        return (double) intersection.size() / union.size();
    }

    private String normalizeText(String text) {

        return text
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    // =========================================================
    // SLA & ESCALATION GOVERNANCE
    // =========================================================

    /**
     * Retrieves all complaints escalated to the Higher Authority.
     * Automatically triggers a scan of breached deadlines before returning.
     */
    public List<Complaint> getEscalatedComplaints() {
        checkAndAutoEscalateComplaints();
        return complaintRepository.findAllEscalatedSorted();
    }

    /**
     * Manually routes/escalates a complaint to the Higher Authority.
     * Can be invoked by Department Officers who cannot resolve the issue at their level.
     */
    public Complaint escalateComplaint(Long complaintId, String reason, String officerName) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found with ID: " + complaintId));

        complaint.setIsEscalated(true);
        complaint.setEscalationLevel("HIGHER_AUTHORITY");
        complaint.setEscalatedAt(LocalDateTime.now());
        complaint.setEscalatedTo("Higher Municipal Authority");

        String formattedReason = (reason != null && !reason.isBlank())
                ? reason.trim()
                : "Escalated by Department Officer for higher-level intervention.";

        if (officerName != null && !officerName.isBlank()) {
            formattedReason = "[" + officerName.trim() + "] " + formattedReason;
        }

        complaint.setEscalationReason(formattedReason);
        Complaint saved = complaintRepository.save(complaint);

        // Notify Citizen about escalation to Higher Authority
        if (saved.getCitizenId() != null) {
            notificationService.createNotification(
                    saved.getCitizenId(),
                    saved.getId(),
                    saved.getTitle(),
                    "Escalated to Higher Authority",
                    "Your complaint has been escalated to the Higher Municipal Authority for priority resolution. Reason: " + formattedReason,
                    "escalated",
                    "DEPARTMENT_OFFICER"
            );
        }

        // Notify Department Dashboard: "received or escalated"
        String deptCode = saved.getDepartmentCode();
        Long deptId = saved.getDepartmentId();
        if (deptCode != null || deptId != null) {
            notificationService.createDepartmentNotification(
                    deptId,
                    deptCode,
                    saved.getId(),
                    saved.getTitle(),
                    "Complaint Escalated & Received",
                    "Complaint #" + saved.getId() + " (\"" + saved.getTitle() + "\") has been escalated to Higher Municipal Authority. Status: Received / Escalated for Executive Review. Reason: " + formattedReason,
                    "escalated",
                    "DEPARTMENT_OFFICER"
            );
        }

        log.info("🚨 Complaint #{} manually escalated to Higher Authority by '{}'. Reason: {}",
                complaintId, officerName, formattedReason);

        return saved;
    }

    /**
     * Scheduled Background Task: Runs every 60 seconds.
     * Automatically checks all active complaints against their priority-based SLA deadlines.
     * If now > slaDeadline, automatically routes the complaint to the Higher Authority.
     */
    @Scheduled(fixedRate = 60000)
    public int checkAndAutoEscalateComplaints() {
        LocalDateTime now = LocalDateTime.now();
        List<Complaint> allComplaints = complaintRepository.findAll();
        List<Complaint> toEscalate = new ArrayList<>();
        List<Complaint> toUpdateMetadata = new ArrayList<>();

        for (Complaint c : allComplaints) {
            boolean metadataChanged = false;
            if (c.getCreatedAt() == null) {
                c.setCreatedAt(now);
                metadataChanged = true;
            }
            if (c.getSlaHours() == null) {
                c.setSlaHours(Complaint.calculateSlaHours(c.getPriority()));
                metadataChanged = true;
            }
            if (c.getSlaDeadline() == null) {
                c.setSlaDeadline(c.getCreatedAt().plusHours(c.getSlaHours()));
                metadataChanged = true;
            }
            if (c.getIsEscalated() == null) {
                c.setIsEscalated(false);
                metadataChanged = true;
            }

            String status = c.getStatus() != null ? c.getStatus().trim().toUpperCase() : "";
            boolean isResolvedOrRejected = "RESOLVED".equals(status) || "REJECTED".equals(status);

            // If time limit expired and not yet escalated and not closed -> AUTO-ESCALATE TO HIGHER AUTHORITY
            if (!Boolean.TRUE.equals(c.getIsEscalated())
                    && !isResolvedOrRejected
                    && c.getSlaDeadline() != null
                    && now.isAfter(c.getSlaDeadline())) {

                c.setIsEscalated(true);
                c.setEscalationLevel("HIGHER_AUTHORITY");
                c.setEscalatedAt(now);
                c.setEscalatedTo("Higher Municipal Authority");

                int hours = c.getSlaHours() != null ? c.getSlaHours() : Complaint.calculateSlaHours(c.getPriority());
                String autoReason = String.format("SLA BREACH: Auto-escalated to Higher Authority because %s priority resolution SLA (%dh) expired.",
                        c.getPriority() != null ? c.getPriority() : "Standard", hours);
                c.setEscalationReason(autoReason);

                if (c.getCitizenId() != null) {
                    notificationService.createNotification(
                            c.getCitizenId(),
                            c.getId(),
                            c.getTitle(),
                            "SLA Breached - Auto-Escalated",
                            "Your complaint has exceeded the " + hours + "-hour resolution SLA and has been automatically escalated to the Higher Municipal Authority.",
                            "escalated",
                            "SYSTEM"
                    );
                }

                if (c.getDepartmentCode() != null || c.getDepartmentId() != null) {
                    notificationService.createDepartmentNotification(
                            c.getDepartmentId(),
                            c.getDepartmentCode(),
                            c.getId(),
                            c.getTitle(),
                            "SLA Breached - Auto-Escalated & Received",
                            "Complaint #" + c.getId() + " (\"" + c.getTitle() + "\") exceeded " + hours + "h SLA and was auto-escalated to Higher Authority. Status: Received for review.",
                            "escalated",
                            "SYSTEM"
                    );
                }

                toEscalate.add(c);
            } else if (metadataChanged) {
                toUpdateMetadata.add(c);
            }
        }

        if (!toUpdateMetadata.isEmpty()) {
            complaintRepository.saveAll(toUpdateMetadata);
        }

        if (!toEscalate.isEmpty()) {
            complaintRepository.saveAll(toEscalate);
            log.warn("⚠️ SLA Monitor: Automatically escalated {} overdue complaints to Higher Authority.", toEscalate.size());
            return toEscalate.size();
        }

        return 0;
    }

    /**
     * Provides SLA & Escalation Governance Statistics.
     */
    public Map<String, Object> getSlaStats() {
        checkAndAutoEscalateComplaints();
        List<Complaint> all = complaintRepository.findAll();
        long total = all.size();
        long escalated = all.stream().filter(c -> Boolean.TRUE.equals(c.getIsEscalated())).count();
        long resolved = all.stream().filter(c -> "RESOLVED".equalsIgnoreCase(c.getStatus())).count();
        long breached = all.stream().filter(c -> {
            if ("RESOLVED".equalsIgnoreCase(c.getStatus()) || "REJECTED".equalsIgnoreCase(c.getStatus())) {
                return false;
            }
            return c.getSlaDeadline() != null && LocalDateTime.now().isAfter(c.getSlaDeadline());
        }).count();

        long withinSla = all.stream().filter(c -> {
            if ("RESOLVED".equalsIgnoreCase(c.getStatus())) {
                return true;
            }
            return c.getSlaDeadline() != null && LocalDateTime.now().isBefore(c.getSlaDeadline());
        }).count();

        double complianceRate = total > 0 ? ((double) withinSla / total) * 100 : 100.0;

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalComplaints", total);
        stats.put("escalatedComplaints", escalated);
        stats.put("breachedComplaints", breached);
        stats.put("withinSlaComplaints", withinSla);
        stats.put("resolvedComplaints", resolved);
        stats.put("slaComplianceRate", Math.round(complianceRate * 10.0) / 10.0);

        return stats;
    }
}
