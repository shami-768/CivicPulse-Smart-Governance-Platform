package com.civicpulse.backend.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.civicpulse.backend.entity.Complaint;
import com.civicpulse.backend.entity.Department;
import com.civicpulse.backend.repository.ComplaintRepository;
import com.civicpulse.backend.repository.DepartmentRepository;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final ComplaintRepository complaintRepository;

    public DepartmentService(DepartmentRepository departmentRepository, ComplaintRepository complaintRepository) {
        this.departmentRepository = departmentRepository;
        this.complaintRepository = complaintRepository;
    }

    public Department createDepartment(Department department) {
        return departmentRepository.save(department);
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Optional<Department> getDepartmentById(Long id) {
        return departmentRepository.findById(id);
    }

    public Optional<Department> getDepartmentByUserId(Long userId) {
        return departmentRepository.findByUserId(userId);
    }

    public Department updateDepartment(Long id, Department updatedDepartment) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));

        department.setDepartmentName(updatedDepartment.getDepartmentName());
        department.setPhone(updatedDepartment.getPhone());
        department.setLocation(updatedDepartment.getLocation());
        if (updatedDepartment.getUserId() != null) {
            department.setUserId(updatedDepartment.getUserId());
        }

        return departmentRepository.save(department);
    }

    public void deleteDepartment(Long id) {
        departmentRepository.deleteById(id);
    }

    // Integrated Department-Complaint operations
    public List<Complaint> getDepartmentComplaints(Long departmentId) {
        return complaintRepository.findByDepartmentId(departmentId);
    }

    public Map<String, Object> getDepartmentStats(Long departmentId) {
        List<Complaint> complaints = complaintRepository.findByDepartmentId(departmentId);

        long total = complaints.size();
        long pending = complaints.stream().filter(c -> "PENDING".equalsIgnoreCase(c.getStatus())).count();
        long inProgress = complaints.stream().filter(c -> "IN_PROGRESS".equalsIgnoreCase(c.getStatus())).count();
        long resolved = complaints.stream().filter(c -> "RESOLVED".equalsIgnoreCase(c.getStatus())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("departmentId", departmentId);
        stats.put("totalComplaints", total);
        stats.put("pendingComplaints", pending);
        stats.put("inProgressComplaints", inProgress);
        stats.put("resolvedComplaints", resolved);

        return stats;
    }
}
