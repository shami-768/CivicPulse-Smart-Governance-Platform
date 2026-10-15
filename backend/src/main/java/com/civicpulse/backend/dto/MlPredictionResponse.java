package com.civicpulse.backend.dto;

import java.util.Map;

/**
 * Response DTO received from the Python ML microservice after priority prediction.
 */
public class MlPredictionResponse {

    /** Predicted priority label: HIGH | MEDIUM | LOW */
    private String priority;

    /** Confidence score mapped to 0–100 integer */
    private int score;

    /** Raw confidence value from the model (0.0 – 1.0) */
    private double confidence;

    /** Per-class probabilities: { "HIGH": 0.82, "MEDIUM": 0.12, "LOW": 0.06 } */
    private Map<String, Double> probabilities;

    /** Model identifier, e.g. "random-forest-v1" */
    private String model;

    /** Human-readable feature breakdown string */
    private String breakdown;

    public MlPredictionResponse() {}

    // ── Getters & Setters ──────────────────────────────────────────────────

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }

    public Map<String, Double> getProbabilities() { return probabilities; }
    public void setProbabilities(Map<String, Double> probabilities) { this.probabilities = probabilities; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getBreakdown() { return breakdown; }
    public void setBreakdown(String breakdown) { this.breakdown = breakdown; }
}
