package com.civicpulse.backend.dto;

import java.util.List;

public class PriorityDistributionResponseDTO {

    private List<DepartmentPriorityDistributionDTO> departments;
    private long totalComplaints;

    public PriorityDistributionResponseDTO() {
    }

    public PriorityDistributionResponseDTO(List<DepartmentPriorityDistributionDTO> departments, long totalComplaints) {
        this.departments = departments;
        this.totalComplaints = totalComplaints;
    }

    public List<DepartmentPriorityDistributionDTO> getDepartments() {
        return departments;
    }

    public void setDepartments(List<DepartmentPriorityDistributionDTO> departments) {
        this.departments = departments;
    }

    public long getTotalComplaints() {
        return totalComplaints;
    }

    public void setTotalComplaints(long totalComplaints) {
        this.totalComplaints = totalComplaints;
    }
}
