package com.civicpulse.backend.controller;

import com.civicpulse.backend.dto.FeedbackStatsDTO;
import com.civicpulse.backend.entity.Feedback;
import com.civicpulse.backend.service.FeedbackService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "*")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public ResponseEntity<Feedback> createFeedback(@RequestBody Feedback feedback) {
        return ResponseEntity.ok(feedbackService.createFeedback(feedback));
    }

    @GetMapping
    public ResponseEntity<List<Feedback>> getAllFeedbacks() {
        return ResponseEntity.ok(feedbackService.getAllFeedbacks());
    }

    @GetMapping("/stats")
    public ResponseEntity<FeedbackStatsDTO> getFeedbackStats() {
        return ResponseEntity.ok(feedbackService.getFeedbackStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Feedback> getFeedbackById(@PathVariable Long id) {
        return feedbackService.getFeedbackById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/citizen/{citizenId}")
    public ResponseEntity<List<Feedback>> getFeedbacksByCitizenId(@PathVariable Long citizenId) {
        return ResponseEntity.ok(feedbackService.getFeedbacksByCitizenId(citizenId));
    }

    @GetMapping("/complaint/{complaintId}")
    public ResponseEntity<List<Feedback>> getFeedbacksByComplaintId(@PathVariable Long complaintId) {
        return ResponseEntity.ok(feedbackService.getFeedbacksByComplaintId(complaintId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeedback(@PathVariable Long id) {
        feedbackService.deleteFeedback(id);
        return ResponseEntity.noContent().build();
    }
}
