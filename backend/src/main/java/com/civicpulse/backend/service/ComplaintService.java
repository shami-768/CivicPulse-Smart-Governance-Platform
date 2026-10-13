package com.civicpulse.backend.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.civicpulse.backend.dto.DepartmentPriorityDistributionDTO;
import com.civicpulse.backend.dto.PriorityCalculationResult;
import com.civicpulse.backend.dto.PriorityDistributionResponseDTO;
import com.civicpulse.backend.entity.Complaint;
import com.civicpulse.backend.repository.ComplaintRepository;

@Service
public class ComplaintService {

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

        if (complaint.getStatus() == null || complaint.getStatus().isBlank()) {
            complaint.setStatus("PENDING");
        }

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

        Complaint savedComplaint = complaintRepository.save(complaint);

        // Create real notification after successful complaint creation
        if (savedComplaint.getCitizenId() != null) {

            notificationService.createNotification(
                    savedComplaint.getCitizenId(),
                    savedComplaint.getId(),
                    savedComplaint.getTitle(),
                    "Complaint Received",
                    "Your complaint \"" + savedComplaint.getTitle()
                    + "\" has been successfully registered with " + savedComplaint.getPriority() + " priority.",
                    "received"
            );
        }

        return savedComplaint;
    }

    // =========================================================
    // GET ALL COMPLAINTS
    // =========================================================
    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAllSortedByPriority();
    }

    public List<Complaint> getAllComplaintsSortedByPriority() {
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
        }
        return complaintRepository.saveAll(complaints);
    }

    // =========================================================
    // GET COMPLAINTS BY CITIZEN
    // =========================================================
    public List<Complaint> getComplaintsByCitizenId(Long citizenId) {
        return complaintRepository.findByCitizenId(citizenId);
    }

    // =========================================================
    // GET COMPLAINTS BY DEPARTMENT
    // =========================================================
    public List<Complaint> getComplaintsByDepartmentId(Long departmentId) {
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
        existingComplaint.setLocation(updatedComplaint.getLocation());
        existingComplaint.setStatus(updatedComplaint.getStatus());

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
                && !savedComplaint.getStatus().equalsIgnoreCase(oldStatus)) {

            createStatusNotification(savedComplaint);
        }

        return savedComplaint;
    }

    // =========================================================
    // UPDATE COMPLAINT STATUS
    // =========================================================
    public Complaint updateComplaintStatus(Long id, String status) {

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        String oldStatus = complaint.getStatus();

        complaint.setStatus(status);

        Complaint savedComplaint = complaintRepository.save(complaint);

        // Don't create duplicate notification
        if (savedComplaint.getCitizenId() != null
                && !sameStatus(oldStatus, status)) {

            createStatusNotification(savedComplaint);
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
                    "resolved"
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

        String status = complaint.getStatus();

        String title;
        String message;
        String type;

        switch (status.toUpperCase()) {

            case "PENDING":
                title = "Complaint Status Updated";
                message = "Your complaint \"" + complaint.getTitle()
                        + "\" is pending review.";
                type = "pending";
                break;

            case "IN_PROGRESS":
                title = "Complaint In Progress";
                message = "Your complaint \"" + complaint.getTitle()
                        + "\" is now being processed.";
                type = "status";
                break;

            case "RESOLVED":
                title = "Complaint Resolved";
                message = "Your complaint \"" + complaint.getTitle()
                        + "\" has been resolved.";
                type = "resolved";
                break;

            case "REJECTED":
                title = "Complaint Rejected";
                message = "Your complaint \"" + complaint.getTitle()
                        + "\" has been rejected.";
                type = "warning";
                break;

            default:
                title = "Complaint Status Updated";
                message = "The status of your complaint \""
                        + complaint.getTitle()
                        + "\" has been updated to "
                        + status + ".";
                type = "status";
        }

        notificationService.createNotification(
                complaint.getCitizenId(),
                complaint.getId(),
                complaint.getTitle(),
                title,
                message,
                type
        );
    }

    private boolean sameStatus(String first, String second) {

        if (first == null && second == null) {
            return true;
        }

        if (first == null || second == null) {
            return false;
        }

        return first.equalsIgnoreCase(second);
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
}
