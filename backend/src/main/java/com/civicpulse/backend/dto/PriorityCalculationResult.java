package com.civicpulse.backend.dto;

import com.civicpulse.backend.entity.Priority;

public class PriorityCalculationResult {

    private int score;
    private Priority priority;
    private String breakdown;
    private String reason;

    public PriorityCalculationResult() {
    }

    public PriorityCalculationResult(int score, Priority priority, String breakdown, String reason) {
        this.score = score;
        this.priority = priority;
        this.breakdown = breakdown;
        this.reason = reason;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public String getBreakdown() {
        return breakdown;
    }

    public void setBreakdown(String breakdown) {
        this.breakdown = breakdown;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
