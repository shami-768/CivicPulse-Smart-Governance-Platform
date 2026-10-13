package com.civicpulse.backend.controller;

import java.util.List;

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

    // Create a complaint
    @PostMapping
    public ResponseEntity<Complaint> createComplaint(
            @RequestBody Complaint complaint) {

        return ResponseEntity.ok(
                complaintService.createComplaint(complaint)
        );
    }

    // Get all complaints
    @GetMapping
    public ResponseEntity<List<Complaint>> getAllComplaints() {

        return ResponseEntity.ok(
                complaintService.getAllComplaints()
        );
    }

    // Get complaint by ID
    @GetMapping("/{id}")
    public ResponseEntity<Complaint> getComplaintById(
            @PathVariable Long id) {

        return complaintService.getComplaintById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    // Get complaints by citizen ID

    @GetMapping("/citizen/{citizenId}")
    public ResponseEntity<List<Complaint>> getComplaintsByCitizenId(
            @PathVariable Long citizenId) {

        return ResponseEntity.ok(
                complaintService.getComplaintsByCitizenId(citizenId)
        );
    }

    // Get complaints by department ID
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<Complaint>> getComplaintsByDepartmentId(
            @PathVariable Long departmentId) {

        return ResponseEntity.ok(
                complaintService.getComplaintsByDepartmentId(departmentId)
        );
    }

    // Get complaints by status

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Complaint>> getComplaintsByStatus(
            @PathVariable String status) {

        return ResponseEntity.ok(
                complaintService.getComplaintsByStatus(status)
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
            @PathVariable Long id,
            @RequestBody Complaint complaint) {

        return ResponseEntity.ok(
                complaintService.updateComplaint(id, complaint)
        );
    }
    // Update complaint status

    @PutMapping("/{id}/status")
    public ResponseEntity<Complaint> updateComplaintStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return ResponseEntity.ok(
                complaintService.updateComplaintStatus(id, status)
        );
    }
    // Assign complaint to department

    @PutMapping("/{id}/department")
    public ResponseEntity<Complaint> assignDepartment(
            @PathVariable Long id,
            @RequestParam Long departmentId) {

        return ResponseEntity.ok(
                complaintService.assignDepartment(id, departmentId)
        );
    }
    // Resolve complaint

    @PutMapping("/{id}/resolve")
    public ResponseEntity<Complaint> resolveComplaint(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                complaintService.resolveComplaint(id)
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
    public ResponseEntity<Complaint> recalculatePriority(@PathVariable Long id) {
        return ResponseEntity.ok(
                complaintService.recalculatePriority(id)
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
    public ResponseEntity<String> getPriorityBreakdown(@PathVariable Long id) {
        return complaintService.getComplaintById(id)
                .map(c -> ResponseEntity.ok(c.getPriorityBreakdown()))
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete complaint
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComplaint(
            @PathVariable Long id) {

        complaintService.deleteComplaint(id);

        return ResponseEntity.noContent().build();
    }
}
