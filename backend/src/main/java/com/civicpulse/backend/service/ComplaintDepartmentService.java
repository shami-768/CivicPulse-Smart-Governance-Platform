package com.civicpulse.backend.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.civicpulse.backend.entity.CanonicalDepartment;
import com.civicpulse.backend.entity.Department;
import com.civicpulse.backend.repository.DepartmentRepository;

@Service
public class ComplaintDepartmentService {

    private final DepartmentRepository departmentRepository;

    public ComplaintDepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    /**
     * Maps category to CanonicalDepartment and resolves/saves Department in DB.
     *
     * Category -> Canonical Department:
     * - Fire & Emergency -> ED (Emergency & Public Safety Department)
     * - Street Light / Electricity -> ESL (Electricity & Street Lighting)
     * - Road -> PWI (Public Works & Infrastructure)
     * - Water / Drainage -> WSS (Water Supply & Sewerage)
     * - Sanitation / Garbage -> SWM (Sanitation & Waste Management)
     * - Other -> GAD (General Administration Department)
     */
    public Department getDepartmentForCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            throw new IllegalArgumentException("Complaint category is required.");
        }

        CanonicalDepartment canonical = CanonicalDepartment.fromCategory(category);
        return findOrCreateDepartment(canonical);
    }

    public Department getDepartmentByCode(String code) {
        CanonicalDepartment canonical = CanonicalDepartment.fromCode(code);
        return findOrCreateDepartment(canonical);
    }

    public CanonicalDepartment getCanonicalDepartment(String category) {
        return CanonicalDepartment.fromCategory(category);
    }

    private Department findOrCreateDepartment(CanonicalDepartment canonical) {
        // 1. Check if department exists by code or name
        Optional<Department> existing = departmentRepository.findByDepartmentNameContainingIgnoreCase(canonical.getName());
        if (existing.isPresent()) {
            Department d = existing.get();
            if (d.getDepartmentCode() == null || d.getDepartmentCode().isBlank()) {
                d.setDepartmentCode(canonical.getCode());
                departmentRepository.save(d);
            }
            return d;
        }

        // 2. Create canonical department in DB
        Department newDept = new Department();
        newDept.setDepartmentName(canonical.getName());
        newDept.setDepartmentCode(canonical.getCode());
        newDept.setLocation("Central Municipal Zone");
        newDept.setPhone("1800-CIVIC-PULSE");
        return departmentRepository.save(newDept);
    }
}
