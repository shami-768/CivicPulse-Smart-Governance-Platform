package com.civicpulse.backend.dto;

public class ReportSummaryDTO {

    private long totalComplaints;
    private long pendingComplaints;
    private long inProgressComplaints;
    private long resolvedComplaints;
    private long highPriorityComplaints;
    private double resolutionRate;

    public ReportSummaryDTO() {
    }

    public ReportSummaryDTO(
            long totalComplaints,
            long pendingComplaints,
            long inProgressComplaints,
            long resolvedComplaints,
            long highPriorityComplaints,
            double resolutionRate) {

        this.totalComplaints = totalComplaints;
        this.pendingComplaints = pendingComplaints;
        this.inProgressComplaints = inProgressComplaints;
        this.resolvedComplaints = resolvedComplaints;
        this.highPriorityComplaints = highPriorityComplaints;
        this.resolutionRate = resolutionRate;
    }

    public long getTotalComplaints() {
        return totalComplaints;
    }

    public void setTotalComplaints(long totalComplaints) {
        this.totalComplaints = totalComplaints;
    }

    public long getPendingComplaints() {
        return pendingComplaints;
    }

    public void setPendingComplaints(long pendingComplaints) {
        this.pendingComplaints = pendingComplaints;
    }

    public long getInProgressComplaints() {
        return inProgressComplaints;
    }

    public void setInProgressComplaints(long inProgressComplaints) {
        this.inProgressComplaints = inProgressComplaints;
    }

    public long getResolvedComplaints() {
        return resolvedComplaints;
    }

    public void setResolvedComplaints(long resolvedComplaints) {
        this.resolvedComplaints = resolvedComplaints;
    }

    public long getHighPriorityComplaints() {
        return highPriorityComplaints;
    }

    public void setHighPriorityComplaints(long highPriorityComplaints) {
        this.highPriorityComplaints = highPriorityComplaints;
    }

    public double getResolutionRate() {
        return resolutionRate;
    }

    public void setResolutionRate(double resolutionRate) {
        this.resolutionRate = resolutionRate;
    }
}