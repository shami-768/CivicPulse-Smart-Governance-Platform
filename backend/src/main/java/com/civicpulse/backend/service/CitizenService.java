package com.civicpulse.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.civicpulse.backend.dto.CitizenDashboardStats;
import com.civicpulse.backend.entity.Citizen;
import com.civicpulse.backend.entity.Complaint;
import com.civicpulse.backend.repository.CitizenRepository;
import com.civicpulse.backend.repository.ComplaintRepository;

@Service
public class CitizenService {

    private final CitizenRepository citizenRepository;
    private final ComplaintRepository complaintRepository;

    public CitizenService(
            CitizenRepository citizenRepository,
            ComplaintRepository complaintRepository) {

        this.citizenRepository = citizenRepository;
        this.complaintRepository = complaintRepository;
    }

    // Get all citizens
    public List<Citizen> getAllCitizens() {

        return citizenRepository.findAll();
    }

    // Get citizen by ID
    public Optional<Citizen> getCitizenById(Long id) {

        return citizenRepository.findById(id);
    }

    // Get citizen by user ID
    public Optional<Citizen> getCitizenByUserId(Long userId) {

        return citizenRepository.findByUserId(userId);
    }

    // Get citizen dashboard statistics
    public CitizenDashboardStats getCitizenDashboard(Long citizenId) {

        // Check whether citizen exists
        citizenRepository.findById(citizenId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Citizen not found with id: " + citizenId
                        )
                );

        // Total complaints
        long totalComplaints =
                complaintRepository
                        .findByCitizenId(citizenId)
                        .size();

        // Pending complaints
        long pendingComplaints =
                complaintRepository
                        .findByCitizenIdAndStatus(
                                citizenId,
                                "PENDING"
                        )
                        .size();

        // In-progress complaints
        long inProgressComplaints =
                complaintRepository
                        .findByCitizenIdAndStatus(
                                citizenId,
                                "IN_PROGRESS"
                        )
                        .size();

        // Resolved complaints
        long resolvedComplaints =
                complaintRepository
                        .findByCitizenIdAndStatus(
                                citizenId,
                                "RESOLVED"
                        )
                        .size();

        return new CitizenDashboardStats(
                citizenId,
                totalComplaints,
                pendingComplaints,
                inProgressComplaints,
                resolvedComplaints
        );
    }

    // Get all complaints belonging to a citizen
    public List<Complaint> getCitizenComplaints(Long citizenId) {

        // Check whether citizen exists
        citizenRepository.findById(citizenId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Citizen not found with id: " + citizenId
                        )
                );

        // Return citizen's complaints
        return complaintRepository.findByCitizenId(citizenId);
    }

    // Update citizen
    public Citizen updateCitizen(
            Long id,
            Citizen updatedCitizen) {

        Citizen citizen = citizenRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Citizen not found with id: " + id
                        )
                );

        citizen.setPhone(updatedCitizen.getPhone());
        citizen.setAddress(updatedCitizen.getAddress());

        return citizenRepository.save(citizen);
    }

    // Delete citizen
    public void deleteCitizen(Long id) {

        citizenRepository.deleteById(id);
    }
}