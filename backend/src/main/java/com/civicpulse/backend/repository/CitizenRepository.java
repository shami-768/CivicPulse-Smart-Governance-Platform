package com.civicpulse.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.civicpulse.backend.entity.Citizen;

public interface CitizenRepository extends JpaRepository<Citizen, Long> {

    Optional<Citizen> findByUserId(Long userId);

    Optional<Citizen> findByEmail(String email);

    Optional<Citizen> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);
}