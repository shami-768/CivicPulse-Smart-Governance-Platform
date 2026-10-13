package com.civicpulse.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.civicpulse.backend.dto.CitizenDashboardStats;
import com.civicpulse.backend.entity.Citizen;
import com.civicpulse.backend.entity.Complaint;
import com.civicpulse.backend.service.CitizenService;

@RestController
@RequestMapping("/api/citizens")
@CrossOrigin(origins = "*")
public class CitizenController {

    private final CitizenService citizenService;

    public CitizenController(CitizenService citizenService) {
        this.citizenService = citizenService;
    }

    // Get all citizens
    @GetMapping
    public ResponseEntity<List<Citizen>> getAllCitizens() {
        return ResponseEntity.ok(
                citizenService.getAllCitizens()
        );
    }

    // Get citizen by ID
    @GetMapping("/{id}")
    public ResponseEntity<Citizen> getCitizenById(
            @PathVariable Long id) {

        return citizenService.getCitizenById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get citizen by user ID
    @GetMapping("/user/{userId}")
    public ResponseEntity<Citizen> getCitizenByUserId(
            @PathVariable Long userId) {

        return citizenService.getCitizenByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get citizen dashboard statistics
    @GetMapping("/{id}/dashboard")
    public ResponseEntity<CitizenDashboardStats> getCitizenDashboard(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                citizenService.getCitizenDashboard(id)
        );
    }

    // Get all complaints of a citizen
    @GetMapping("/{id}/complaints")
    public ResponseEntity<List<Complaint>> getCitizenComplaints(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                citizenService.getCitizenComplaints(id)
        );
    }

    // Update citizen
    @PutMapping("/{id}")
    public ResponseEntity<Citizen> updateCitizen(
            @PathVariable Long id,
            @RequestBody Citizen citizen) {

        return ResponseEntity.ok(
                citizenService.updateCitizen(id, citizen)
        );
    }

    // Delete citizen
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCitizen(
            @PathVariable Long id) {

        citizenService.deleteCitizen(id);

        return ResponseEntity.noContent().build();
    }
}