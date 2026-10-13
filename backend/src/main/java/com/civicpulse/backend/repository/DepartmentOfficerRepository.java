package com.civicpulse.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.civicpulse.backend.entity.DepartmentOfficer;

public interface DepartmentOfficerRepository extends JpaRepository<DepartmentOfficer, Long> {

    Optional<DepartmentOfficer> findByEmailIgnoreCase(String email);

    Optional<DepartmentOfficer> findByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    Optional<DepartmentOfficer> findByUserId(Long userId);

    Optional<DepartmentOfficer> findByDepartmentId(Long departmentId);
}
