package com.civicpulse.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.civicpulse.backend.entity.Department;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    Optional<Department> findByUserId(Long userId);

    Optional<Department> findByDepartmentNameContainingIgnoreCase(String departmentName);
}