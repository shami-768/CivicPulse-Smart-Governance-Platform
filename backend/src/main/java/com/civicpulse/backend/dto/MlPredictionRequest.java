package com.civicpulse.backend.dto;

/**
 * Request DTO sent to the Python ML microservice for priority prediction.
 */
public class MlPredictionRequest {

    private String title;
    private String description;
    private String location;
    private String category;
    private String severity;
    private String affectedPeople;
    private boolean safetyRisk;
    private boolean isPublicLocation;
    private int repeatedCount;

    public MlPredictionRequest() {}

    public MlPredictionRequest(
            String title,
            String description,
            String location,
            String category,
            String severity,
            String affectedPeople,
            boolean safetyRisk,
            boolean isPublicLocation,
            int repeatedCount) {
        this.title = title;
        this.description = description;
        this.location = location;
        this.category = category;
        this.severity = severity;
        this.affectedPeople = affectedPeople;
        this.safetyRisk = safetyRisk;
        this.isPublicLocation = isPublicLocation;
        this.repeatedCount = repeatedCount;
    }

    // ── Getters & Setters ──────────────────────────────────────────────────

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getAffectedPeople() { return affectedPeople; }
    public void setAffectedPeople(String affectedPeople) { this.affectedPeople = affectedPeople; }

    public boolean isSafetyRisk() { return safetyRisk; }
    public void setSafetyRisk(boolean safetyRisk) { this.safetyRisk = safetyRisk; }

    public boolean isPublicLocation() { return isPublicLocation; }
    public void setPublicLocation(boolean publicLocation) { isPublicLocation = publicLocation; }

    public int getRepeatedCount() { return repeatedCount; }
    public void setRepeatedCount(int repeatedCount) { this.repeatedCount = repeatedCount; }
}
