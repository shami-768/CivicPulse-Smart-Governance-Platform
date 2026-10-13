package com.civicpulse.backend.repository;

import com.civicpulse.backend.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    List<Feedback> findAllByOrderByCreatedAtDesc();

    List<Feedback> findByCitizenIdOrderByCreatedAtDesc(Long citizenId);

    List<Feedback> findByComplaintIdOrderByCreatedAtDesc(Long complaintId);

    List<Feedback> findByCategoryOrderByCreatedAtDesc(String category);

    long countByRating(Integer rating);
}
