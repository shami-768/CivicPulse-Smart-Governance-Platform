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

    private LocalDateTime createdAt;

    // Default constructor
    public Complaint() {
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
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
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}