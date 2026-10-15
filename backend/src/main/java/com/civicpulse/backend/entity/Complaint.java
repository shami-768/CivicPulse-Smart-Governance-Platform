package com.civicpulse.backend.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "complaints")
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;

    @Column(length = 1000)
    private String description;
    private String category;
    private String location;
    private String priority;
    private Integer priorityScore = 0;
    private String severity;
    private String affectedPeople;
    private Boolean safetyRisk = false;
    private Boolean isPublicLocation = false;

    @Column(length = 2000)
    private String priorityBreakdown;

    @Column(length = 1000)
    private String priorityReason;

    private String status;
    private Long citizenId;
    private Long departmentId;
    private String departmentCode;
    private String departmentName;

    private Double latitude;
    private Double longitude;

    @Column(columnDefinition = "LONGTEXT")
    private String photoUrl;

    private LocalDateTime createdAt;

    // SLA & Escalation Governance Fields (Benchmarked from Municipal Smart City Charters)
    private Integer slaHours = 48; // Default 48h (HIGH: 24h, MEDIUM: 48h, LOW: 72h)
    private LocalDateTime slaDeadline;
    private Boolean isEscalated = false;
    private LocalDateTime escalatedAt;
    private String escalationLevel = "LEVEL_1"; // "LEVEL_1" -> "HIGHER_AUTHORITY"

    @Column(length = 1000)
    private String escalationReason;
    private String escalatedTo = "Higher Municipal Authority";

    // Default constructor
    public Complaint() {
        this.createdAt = LocalDateTime.now();
        this.slaHours = calculateSlaHours(this.priority);
        this.slaDeadline = this.createdAt.plusHours(this.slaHours);
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.slaHours == null) {
            this.slaHours = calculateSlaHours(this.priority);
        }
        if (this.slaDeadline == null && this.createdAt != null) {
            this.slaDeadline = this.createdAt.plusHours(this.slaHours);
        }
        if (this.isEscalated == null) {
            this.isEscalated = false;
        }
        if (this.escalationLevel == null) {
            this.escalationLevel = "LEVEL_1";
        }
    }

    public static int calculateSlaHours(String priority) {
        if (priority == null) return 48;
        String p = priority.trim().toUpperCase();
        if (p.equals("CRITICAL") || p.equals("HIGH")) {
            return 24; // Research Benchmark: Urgent/Hazard issues resolve in 24h
        } else if (p.equals("MEDIUM")) {
            return 48; // Moderate issues resolve in 48h (2 days)
        } else {
            return 72; // Minor/Routine issues resolve in 72h (3 days)
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public String getCategory() {
        return category;
    }
    public void setCategory(String category) {
        this.category = category;
    }
    public String getLocation() {
        return location;
    }
    public void setLocation(String location) {
        this.location = location;
    }
    public String getPriority() {
        return priority;
    }
    public void setPriority(String priority) {
        this.priority = priority;
    }
    public Integer getPriorityScore() {
        return priorityScore;
    }
    public void setPriorityScore(Integer priorityScore) {
        this.priorityScore = priorityScore;
    }
    public String getSeverity() {
        return severity;
    }
    public void setSeverity(String severity) {
        this.severity = severity;
    }
    public String getAffectedPeople() {
        return affectedPeople;
    }
    public void setAffectedPeople(String affectedPeople) {
        this.affectedPeople = affectedPeople;
    }
    public Boolean getSafetyRisk() {
        return safetyRisk;
    }
    public void setSafetyRisk(Boolean safetyRisk) {
        this.safetyRisk = safetyRisk;
    }
    public Boolean getIsPublicLocation() {
        return isPublicLocation;
    }
    public void setIsPublicLocation(Boolean isPublicLocation) {
        this.isPublicLocation = isPublicLocation;
    }
    public String getPriorityBreakdown() {
        return priorityBreakdown;
    }
    public void setPriorityBreakdown(String priorityBreakdown) {
        this.priorityBreakdown = priorityBreakdown;
    }
    public String getPriorityReason() {
        return priorityReason;
    }
    public void setPriorityReason(String priorityReason) {
        this.priorityReason = priorityReason;
    }
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }
    public Long getCitizenId() {
        return citizenId;
    }
    public void setCitizenId(Long citizenId) {
        this.citizenId = citizenId;
    }
    public Long getDepartmentId() {
        return departmentId;
    }
    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }
    public String getDepartmentCode() {
        return departmentCode;
    }
    public void setDepartmentCode(String departmentCode) {
        this.departmentCode = departmentCode;
    }
    public String getDepartmentName() {
        return departmentName;
    }
    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }
    public Double getLatitude() {
        return latitude;
    }
    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }
    public Double getLongitude() {
        return longitude;
    }
    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
    public String getPhotoUrl() {
        return photoUrl;
    }
    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getSlaHours() {
        return slaHours;
    }
    public void setSlaHours(Integer slaHours) {
        this.slaHours = slaHours;
    }

    public LocalDateTime getSlaDeadline() {
        return slaDeadline;
    }
    public void setSlaDeadline(LocalDateTime slaDeadline) {
        this.slaDeadline = slaDeadline;
    }

    public Boolean getIsEscalated() {
        return isEscalated != null && isEscalated;
    }
    public void setIsEscalated(Boolean isEscalated) {
        this.isEscalated = isEscalated;
    }

    public LocalDateTime getEscalatedAt() {
        return escalatedAt;
    }
    public void setEscalatedAt(LocalDateTime escalatedAt) {
        this.escalatedAt = escalatedAt;
    }

    public String getEscalationLevel() {
        return escalationLevel;
    }
    public void setEscalationLevel(String escalationLevel) {
        this.escalationLevel = escalationLevel;
    }

    public String getEscalationReason() {
        return escalationReason;
    }
    public void setEscalationReason(String escalationReason) {
        this.escalationReason = escalationReason;
    }

    public String getEscalatedTo() {
        return escalatedTo;
    }
    public void setEscalatedTo(String escalatedTo) {
        this.escalatedTo = escalatedTo;
    }
}