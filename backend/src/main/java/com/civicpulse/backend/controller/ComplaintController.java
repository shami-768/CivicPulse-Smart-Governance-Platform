package com.civicpulse.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.civicpulse.backend.dto.PriorityDistributionResponseDTO;
import com.civicpulse.backend.entity.Complaint;
import com.civicpulse.backend.service.ComplaintService;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    // Get dynamic department priority distribution
    @GetMapping("/priority-distribution")
    public ResponseEntity<PriorityDistributionResponseDTO> getPriorityDistribution() {
        return ResponseEntity.ok(
                complaintService.getPriorityDistribution()
        );
    }

    // Get all complaints escalated to Higher Authority
    @GetMapping("/escalated")
    public ResponseEntity<List<Complaint>> getEscalatedComplaints() {
        return ResponseEntity.ok(complaintService.getEscalatedComplaints());
    }

    // Escalate a complaint to Higher Authority (Manual Officer escalation or directive)
    @PostMapping("/{id}/escalate")
    public ResponseEntity<Complaint> escalateComplaint(
            @PathVariable String id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        Long complaintId = parseComplaintId(id);
        if (complaintId == null) {
            return ResponseEntity.badRequest().build();
        }
        String reason = body != null ? body.get("reason") : "Escalated to Higher Authority";
        String officerName = body != null ? body.get("officerName") : "Department Officer";
        return ResponseEntity.ok(complaintService.escalateComplaint(complaintId, reason, officerName));
    }

    // Get SLA governance stats
    @GetMapping("/sla-stats")
    public ResponseEntity<java.util.Map<String, Object>> getSlaStats() {
        return ResponseEntity.ok(complaintService.getSlaStats());
    }

    // Create a complaint
    @PostMapping
    public ResponseEntity<Complaint> createComplaint(
            @RequestBody Complaint complaint) {

        return ResponseEntity.ok(
                complaintService.createComplaint(complaint)
        );
    }

    // Helper to safely extract numeric ID from formats like "CMP-1001", "#1001", "1001"
    private Long parseComplaintId(String idStr) {
        if (idStr == null || idStr.isBlank()) {
            return null;
        }
        String digits = idStr.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(digits);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // Get all complaints
    @GetMapping
    public ResponseEntity<List<Complaint>> getAllComplaints() {

        return ResponseEntity.ok(
                complaintService.getAllComplaints()
        );
    }

    // Get complaint by ID (supports "1001", "CMP-1001", "#1001")
    @GetMapping("/{id}")
    public ResponseEntity<Complaint> getComplaintById(
            @PathVariable String id) {

        Long complaintId = parseComplaintId(id);
        if (complaintId == null) {
            return ResponseEntity.notFound().build();
        }

        return complaintService.getComplaintById(complaintId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get complaints by citizen ID
    @GetMapping("/citizen/{citizenId}")
    public ResponseEntity<List<Complaint>> getComplaintsByCitizenId(
            @PathVariable String citizenId) {

        Long parsedCitizenId = parseComplaintId(citizenId);
        if (parsedCitizenId == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(
                complaintService.getComplaintsByCitizenId(parsedCitizenId)
        );
    }

    // Get complaints by department ID
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<Complaint>> getComplaintsByDepartmentId(
            @PathVariable String departmentId) {

        Long parsedDeptId = parseComplaintId(departmentId);
        if (parsedDeptId == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(
                complaintService.getComplaintsByDepartmentId(parsedDeptId)
        );
    }

    // Get complaints by status (normalized)
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Complaint>> getComplaintsByStatus(
            @PathVariable String status) {

        return ResponseEntity.ok(
                complaintService.getComplaintsByStatus(ComplaintService.normalizeStatus(status))
        );
    }

    // Get complaints by priority
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<Complaint>> getComplaintsByPriority(
            @PathVariable String priority) {

        return ResponseEntity.ok(
                complaintService.getComplaintsByPriority(priority)
        );
    }

    // Update complaint
    @PutMapping("/{id}")
    public ResponseEntity<Complaint> updateComplaint(
            @PathVariable String id,
            @RequestBody Complaint complaint) {

        Long complaintId = parseComplaintId(id);
        if (complaintId == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(
                complaintService.updateComplaint(complaintId, complaint)
        );
    }

    // Update complaint status (supports "CMP-1001" and any status format)
    @PutMapping("/{id}/status")
    public ResponseEntity<Complaint> updateComplaintStatus(
            @PathVariable String id,
            @RequestParam String status) {

        Long complaintId = parseComplaintId(id);
        if (complaintId == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(
                complaintService.updateComplaintStatus(complaintId, status)
        );
    }

    // Assign complaint to department
    @PutMapping("/{id}/department")
    public ResponseEntity<Complaint> assignDepartment(
            @PathVariable String id,
            @RequestParam Long departmentId) {

        Long complaintId = parseComplaintId(id);
        if (complaintId == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(
                complaintService.assignDepartment(complaintId, departmentId)
        );
    }

    // Resolve complaint
    @PutMapping("/{id}/resolve")
    public ResponseEntity<Complaint> resolveComplaint(
            @PathVariable String id) {

        Long complaintId = parseComplaintId(id);
        if (complaintId == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(
                complaintService.resolveComplaint(complaintId)
        );
    }

    // Get complaints sorted by priority
    @GetMapping("/priority-sorted")
    public ResponseEntity<List<Complaint>> getComplaintsSortedByPriority() {
        return ResponseEntity.ok(
                complaintService.getAllComplaintsSortedByPriority()
        );
    }

    // Recalculate priority for a single complaint
    @PutMapping("/{id}/recalculate-priority")
    public ResponseEntity<Complaint> recalculatePriority(@PathVariable String id) {
        Long complaintId = parseComplaintId(id);
        if (complaintId == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(
                complaintService.recalculatePriority(complaintId)
        );
    }

    // Recalculate priority for all complaints
    @PostMapping("/recalculate-all")
    public ResponseEntity<List<Complaint>> recalculateAllPriorities() {
        return ResponseEntity.ok(
                complaintService.recalculateAllPriorities()
        );
    }

    // Get complaint priority breakdown detail
    @GetMapping("/{id}/priority-breakdown")
    public ResponseEntity<String> getPriorityBreakdown(@PathVariable String id) {
        Long complaintId = parseComplaintId(id);
        if (complaintId == null) {
            return ResponseEntity.notFound().build();
        }

        return complaintService.getComplaintById(complaintId)
                .map(c -> ResponseEntity.ok(c.getPriorityBreakdown()))
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete complaint
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComplaint(
            @PathVariable String id) {

        Long complaintId = parseComplaintId(id);
        if (complaintId != null) {
            complaintService.deleteComplaint(complaintId);
        }

        return ResponseEntity.noContent().build();
    }

    // Trigger an immediate scan and escalation of overdue complaints
    @PostMapping("/trigger-sla-check")
    public ResponseEntity<Map<String, Object>> triggerSlaCheck() {
        int escalatedCount = complaintService.checkAndAutoEscalateComplaints();
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "escalatedCount", escalatedCount,
                "message", "SLA check completed. Overdue complaints escalated."
        ));
    }
}
