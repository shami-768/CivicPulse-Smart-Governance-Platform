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

    // Create notification
    public Notification createNotification(
            Long citizenId,
            Long complaintId,
            String complaintTitle,
            String title,
            String message,
            String type) {

        Notification notification = new Notification();

        notification.setCitizenId(citizenId);
        notification.setComplaintId(complaintId);
        notification.setComplaintTitle(complaintTitle);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
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

    // Mark all notifications as read
    public void markAllAsRead(Long citizenId) {

        List<Notification> notifications =
                notificationRepository.findByCitizenIdOrderByCreatedAtDesc(citizenId);

        for (Notification notification : notifications) {
            notification.setRead(true);
        }

        notificationRepository.saveAll(notifications);
    }
}