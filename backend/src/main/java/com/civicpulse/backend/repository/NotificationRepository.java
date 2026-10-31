package com.civicpulse.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.civicpulse.backend.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByCitizenIdOrderByCreatedAtDesc(Long citizenId);

    long countByCitizenIdAndIsReadFalse(Long citizenId);

    List<Notification> findByDepartmentCodeOrderByCreatedAtDesc(String departmentCode);

    List<Notification> findByDepartmentIdOrderByCreatedAtDesc(Long departmentId);

    long countByDepartmentCodeAndIsReadFalse(String departmentCode);

    long countByDepartmentIdAndIsReadFalse(Long departmentId);

    @Query("""
        SELECT n FROM Notification n
        WHERE (UPPER(n.departmentCode) = UPPER(:deptKey) OR CAST(n.departmentId AS string) = :deptKey)
        ORDER BY n.createdAt DESC
    """)
    List<Notification> findByDepartmentKeyOrderByCreatedAtDesc(@Param("deptKey") String deptKey);

    @Query("""
        SELECT COUNT(n) FROM Notification n
        WHERE (UPPER(n.departmentCode) = UPPER(:deptKey) OR CAST(n.departmentId AS string) = :deptKey)
        AND n.isRead = false
    """)
    long countUnreadByDepartmentKey(@Param("deptKey") String deptKey);
}