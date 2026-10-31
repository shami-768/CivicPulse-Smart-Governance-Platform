package com.civicpulse.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.civicpulse.backend.entity.Notification;
import com.civicpulse.backend.repository.NotificationRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    // Get all notifications for a citizen
    public List<Notification> getNotificationsByCitizenId(Long citizenId) {
        return notificationRepository.findByCitizenIdOrderByCreatedAtDesc(citizenId);
    }

    // Get unread notification count
    public long getUnreadCount(Long citizenId) {
return notificationRepository.countByCitizenIdAndIsReadFalse(citizenId);    }

    // Create citizen notification
    public Notification createNotification(
            Long citizenId,
            Long complaintId,
            String complaintTitle,
            String title,
            String message,
            String type) {

        return createNotification(citizenId, complaintId, complaintTitle, title, message, type, "SYSTEM");
    }

    // Create citizen notification with updatedBy
    public Notification createNotification(
            Long citizenId,
            Long complaintId,
            String complaintTitle,
            String title,
            String message,
            String type,
            String updatedBy) {

        Notification notification = new Notification();

        notification.setCitizenId(citizenId);
        notification.setRecipientRole("CITIZEN");
        notification.setComplaintId(complaintId);
        notification.setComplaintTitle(complaintTitle);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setUpdatedBy(updatedBy != null ? updatedBy : "SYSTEM");
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }

    // =========================================================
    // DEPARTMENT NOTIFICATIONS
    // =========================================================

    // Get notifications for a department by code or ID
    public List<Notification> getNotificationsByDepartment(String deptKey) {
        if (deptKey == null || deptKey.trim().isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return notificationRepository.findByDepartmentKeyOrderByCreatedAtDesc(deptKey.trim());
    }

    // Get unread notification count for a department
    public long getDepartmentUnreadCount(String deptKey) {
        if (deptKey == null || deptKey.trim().isEmpty()) {
            return 0;
        }
        return notificationRepository.countUnreadByDepartmentKey(deptKey.trim());
    }

    // Create department notification (e.g. Received/Escalated or Admin update)
    public Notification createDepartmentNotification(
            Long departmentId,
            String departmentCode,
            Long complaintId,
            String complaintTitle,
            String title,
            String message,
            String type,
            String updatedBy) {

        Notification notification = new Notification();

        notification.setDepartmentId(departmentId);
        notification.setDepartmentCode(departmentCode);
        notification.setRecipientRole("DEPARTMENT");
        notification.setComplaintId(complaintId);
        notification.setComplaintTitle(complaintTitle);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setUpdatedBy(updatedBy != null ? updatedBy : "SYSTEM");
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }

    // Mark notification as read
    public Notification markAsRead(Long id) {

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notification.setRead(true);

        return notificationRepository.save(notification);
    }

    // Mark all notifications as read for citizen
    public void markAllAsRead(Long citizenId) {

        List<Notification> notifications =
                notificationRepository.findByCitizenIdOrderByCreatedAtDesc(citizenId);

        for (Notification notification : notifications) {
            notification.setRead(true);
        }

        notificationRepository.saveAll(notifications);
    }

    // Mark all notifications as read for department
    public void markAllDepartmentAsRead(String deptKey) {
        List<Notification> notifications = getNotificationsByDepartment(deptKey);
        for (Notification notification : notifications) {
            notification.setRead(true);
        }
        notificationRepository.saveAll(notifications);
    }
}