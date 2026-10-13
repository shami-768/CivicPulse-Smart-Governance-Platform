package com.civicpulse.backend.dto;

public class FeedbackStatsDTO {

    private double averageRating;
    private long totalFeedbacks;
    private long fiveStarCount;
    private long fourStarCount;
    private long threeStarCount;
    private long twoStarCount;
    private long oneStarCount;

    public FeedbackStatsDTO() {
    }

    public FeedbackStatsDTO(double averageRating, long totalFeedbacks, long fiveStarCount, long fourStarCount, long threeStarCount, long twoStarCount, long oneStarCount) {
        this.averageRating = averageRating;
        this.totalFeedbacks = totalFeedbacks;
        this.fiveStarCount = fiveStarCount;
        this.fourStarCount = fourStarCount;
        this.threeStarCount = threeStarCount;
        this.twoStarCount = twoStarCount;
        this.oneStarCount = oneStarCount;
    }

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }

    public long getTotalFeedbacks() {
        return totalFeedbacks;
    }

    public void setTotalFeedbacks(long totalFeedbacks) {
        this.totalFeedbacks = totalFeedbacks;
    }

    public long getFiveStarCount() {
        return fiveStarCount;
    }

    public void setFiveStarCount(long fiveStarCount) {
        this.fiveStarCount = fiveStarCount;
    }

    public long getFourStarCount() {
        return fourStarCount;
    }

    public void setFourStarCount(long fourStarCount) {
        this.fourStarCount = fourStarCount;
    }

    public long getThreeStarCount() {
        return threeStarCount;
    }

    public void setThreeStarCount(long threeStarCount) {
        this.threeStarCount = threeStarCount;
    }

    public long getTwoStarCount() {
        return twoStarCount;
    }

    public void setTwoStarCount(long twoStarCount) {
        this.twoStarCount = twoStarCount;
    }

    public long getOneStarCount() {
        return oneStarCount;
    }

    public void setOneStarCount(long oneStarCount) {
        this.oneStarCount = oneStarCount;
    }
}
