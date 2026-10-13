package com.civicpulse.backend.service;

import org.springframework.stereotype.Service;

import com.civicpulse.backend.dto.DashboardStats;
import com.civicpulse.backend.repository.CitizenRepository;
import com.civicpulse.backend.repository.ComplaintRepository;
import com.civicpulse.backend.repository.DepartmentRepository;

@Service
public class DashboardService {

    private final ComplaintRepository complaintRepository;
    private final CitizenRepository citizenRepository;
    private final DepartmentRepository departmentRepository;

    public DashboardService(ComplaintRepository complaintRepository,
                            CitizenRepository citizenRepository,
                            DepartmentRepository departmentRepository) {
        this.complaintRepository = complaintRepository;
        this.citizenRepository = citizenRepository;
        this.departmentRepository = departmentRepository;
    }

    public DashboardStats getDashboardStats() {
        long totalComplaints = complaintRepository.count();
        long pending = complaintRepository.findByStatus("PENDING").size();
        long inProgress = complaintRepository.findByStatus("IN_PROGRESS").size();
        long resolved = complaintRepository.findByStatus("RESOLVED").size();
        long totalCitizens = citizenRepository.count();
        long totalDepartments = departmentRepository.count();

        return new DashboardStats(
                totalComplaints,
                pending,
                inProgress,
                resolved,
                totalCitizens,
                totalDepartments
        );
    }
}
