package com.civicpulse.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.civicpulse.backend.entity.Complaint;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByCitizenId(Long citizenId);

    List<Complaint> findByDepartmentId(Long departmentId);

    List<Complaint> findByStatus(String status);

    List<Complaint> findByPriority(String priority);

    List<Complaint> findByCitizenIdAndStatus(Long citizenId, String status);

    @Query("""
        SELECT c FROM Complaint c
        WHERE c.citizenId = :citizenId
        AND UPPER(REPLACE(c.status, ' ', '_')) = UPPER(REPLACE(:status, ' ', '_'))
    """)
    List<Complaint> findByCitizenIdAndNormalizedStatus(Long citizenId, String status);

    @Query("""
        SELECT COUNT(c) FROM Complaint c
        WHERE UPPER(REPLACE(c.status, ' ', '_')) = UPPER(REPLACE(:status, ' ', '_'))
    """)
    long countByNormalizedStatus(String status);

    long countByCategoryIgnoreCaseAndLocationIgnoreCase(String category, String location);
    List<Complaint> findByCategoryIgnoreCaseAndLocationIgnoreCase(String category,String location);
    
    @Query("""
        SELECT c FROM Complaint c
        ORDER BY CASE UPPER(c.priority)
            WHEN 'HIGH' THEN 1
            WHEN 'MEDIUM' THEN 2
            WHEN 'LOW' THEN 3
            ELSE 4 END,
            c.priorityScore DESC,
            c.id DESC
    """)
    List<Complaint> findAllSortedByPriority();

    List<Complaint> findByIsEscalatedTrue();

    @Query("""
        SELECT c FROM Complaint c
        WHERE c.isEscalated = true
        ORDER BY c.escalatedAt DESC, c.priorityScore DESC
    """)
    List<Complaint> findAllEscalatedSorted();

    @Query("""
        SELECT c FROM Complaint c
        WHERE (c.isEscalated = false OR c.isEscalated IS NULL)
        AND UPPER(c.status) NOT IN ('RESOLVED', 'REJECTED')
        AND c.slaDeadline IS NOT NULL
        AND c.slaDeadline < CURRENT_TIMESTAMP
    """)
    List<Complaint> findBreachedUnescalatedComplaints();

    long countByIsEscalatedTrue();


    // Count complaints by status
    long countByStatus(String status);

    // Count complaints by priority
    long countByPriority(String priority);

    // Count complaints by category
    @Query("""
        SELECT c.category, COUNT(c)
        FROM Complaint c
        GROUP BY c.category
        ORDER BY COUNT(c) DESC
    """)
    List<Object[]> countComplaintsByCategory();

    // Count complaints by status
    @Query("""
        SELECT c.status, COUNT(c)
        FROM Complaint c
        GROUP BY c.status
        ORDER BY COUNT(c) DESC
    """)
    List<Object[]> countComplaintsByStatus();

    // Count complaints by priority
    @Query("""
        SELECT c.priority, COUNT(c)
        FROM Complaint c
        GROUP BY c.priority
        ORDER BY COUNT(c) DESC
    """)
    List<Object[]> countComplaintsByPriority();

    // Count complaints by department
    @Query("""
        SELECT c.departmentId, COUNT(c)
        FROM Complaint c
        WHERE c.departmentId IS NOT NULL
        GROUP BY c.departmentId
        ORDER BY COUNT(c) DESC
    """)
    List<Object[]> countComplaintsByDepartment();
}