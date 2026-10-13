package com.civicpulse.backend.service;

import com.civicpulse.backend.dto.FeedbackStatsDTO;
import com.civicpulse.backend.entity.Feedback;
import com.civicpulse.backend.repository.FeedbackRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;

    public FeedbackService(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    public Feedback createFeedback(Feedback feedback) {
        if (feedback.getRating() == null || feedback.getRating() < 1 || feedback.getRating() > 5) {
            feedback.setRating(5);
        }
        if (feedback.getCreatedAt() == null) {
            feedback.setCreatedAt(LocalDateTime.now());
        }
        if (feedback.getStatus() == null) {
            feedback.setStatus("PUBLISHED");
        }
        return feedbackRepository.save(feedback);
    }

    public List<Feedback> getAllFeedbacks() {
        return feedbackRepository.findAllByOrderByCreatedAtDesc();
    }

    public Optional<Feedback> getFeedbackById(Long id) {
        return feedbackRepository.findById(id);
    }

    public List<Feedback> getFeedbacksByCitizenId(Long citizenId) {
        return feedbackRepository.findByCitizenIdOrderByCreatedAtDesc(citizenId);
    }

    public List<Feedback> getFeedbacksByComplaintId(Long complaintId) {
        return feedbackRepository.findByComplaintIdOrderByCreatedAtDesc(complaintId);
    }

    public FeedbackStatsDTO getFeedbackStats() {
        List<Feedback> allFeedbacks = feedbackRepository.findAll();
        long total = allFeedbacks.size();

        if (total == 0) {
            return new FeedbackStatsDTO(0.0, 0, 0, 0, 0, 0, 0);
        }

        long c5 = 0, c4 = 0, c3 = 0, c2 = 0, c1 = 0;
        double sumRating = 0;

        for (Feedback f : allFeedbacks) {
            int r = f.getRating() != null ? f.getRating() : 5;
            sumRating += r;
            switch (r) {
                case 5 -> c5++;
                case 4 -> c4++;
                case 3 -> c3++;
                case 2 -> c2++;
                case 1 -> c1++;
                default -> c5++;
            }
        }

        double avg = Math.round((sumRating / total) * 10.0) / 10.0;
        return new FeedbackStatsDTO(avg, total, c5, c4, c3, c2, c1);
    }

    public void deleteFeedback(Long id) {
        feedbackRepository.deleteById(id);
    }
}
