package com.civicpulse.backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.civicpulse.backend.dto.ReportCountDTO;
import com.civicpulse.backend.dto.ReportSummaryDTO;
import com.civicpulse.backend.entity.Department;
import com.civicpulse.backend.repository.ComplaintRepository;
import com.civicpulse.backend.repository.DepartmentRepository;

@Service
public class ReportService {

    private final ComplaintRepository complaintRepository;
    private final DepartmentRepository departmentRepository;

    public ReportService(
            ComplaintRepository complaintRepository,
            DepartmentRepository departmentRepository) {

        this.complaintRepository = complaintRepository;
        this.departmentRepository = departmentRepository;
    }

    // Overall report summary
    public ReportSummaryDTO getSummary() {

        long totalComplaints = complaintRepository.count();

        long pendingComplaints =
                complaintRepository.countByStatus("PENDING");

        long inProgressComplaints =
                complaintRepository.countByStatus("IN_PROGRESS");

        long resolvedComplaints =
                complaintRepository.countByStatus("RESOLVED");

        long highPriorityComplaints =
                complaintRepository.countByPriority("HIGH");

        double resolutionRate = 0;

        if (totalComplaints > 0) {
            resolutionRate =
                    ((double) resolvedComplaints / totalComplaints) * 100;

            resolutionRate =
                    Math.round(resolutionRate * 100.0) / 100.0;
        }

        return new ReportSummaryDTO(
                totalComplaints,
                pendingComplaints,
                inProgressComplaints,
                resolvedComplaints,
                highPriorityComplaints,
                resolutionRate
        );
    }

    // Report by status
    public List<ReportCountDTO> getStatusReport() {

        List<Object[]> results =
                complaintRepository.countComplaintsByStatus();

        List<ReportCountDTO> report = new ArrayList<>();

        for (Object[] row : results) {

            String status = row[0] != null
                    ? row[0].toString()
                    : "UNKNOWN";

            long count = ((Number) row[1]).longValue();

            report.add(
                    new ReportCountDTO(status, count)
            );
        }

        return report;
    }

    // Report by category
    public List<ReportCountDTO> getCategoryReport() {

        List<Object[]> results =
                complaintRepository.countComplaintsByCategory();

        List<ReportCountDTO> report = new ArrayList<>();

        for (Object[] row : results) {

            String category = row[0] != null
                    ? row[0].toString()
                    : "UNKNOWN";

            long count = ((Number) row[1]).longValue();

            report.add(
                    new ReportCountDTO(category, count)
            );
        }

        return report;
    }

    // Report by priority
    public List<ReportCountDTO> getPriorityReport() {

        List<Object[]> results =
                complaintRepository.countComplaintsByPriority();

        List<ReportCountDTO> report = new ArrayList<>();

        for (Object[] row : results) {

            String priority = row[0] != null
                    ? row[0].toString()
                    : "UNKNOWN";

            long count = ((Number) row[1]).longValue();

            report.add(
                    new ReportCountDTO(priority, count)
            );
        }

        return report;
    }

    // Report by department
    public List<ReportCountDTO> getDepartmentReport() {

        List<Object[]> results =
                complaintRepository.countComplaintsByDepartment();

        List<ReportCountDTO> report = new ArrayList<>();

        for (Object[] row : results) {

            Long departmentId = ((Number) row[0]).longValue();

            long count = ((Number) row[1]).longValue();

            String departmentName =
                    departmentRepository.findById(departmentId)
                            .map(Department::getDepartmentName)
                            .orElse("Unknown Department");

            report.add(
                    new ReportCountDTO(
                            departmentName,
                            count
                    )
            );
        }

        return report;
    }
}