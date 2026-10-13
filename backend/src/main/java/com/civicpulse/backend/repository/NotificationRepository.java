package com.civicpulse.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.civicpulse.backend.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByCitizenIdOrderByCreatedAtDesc(Long citizenId);

    long countByCitizenIdAndIsReadFalse(Long citizenId);
}