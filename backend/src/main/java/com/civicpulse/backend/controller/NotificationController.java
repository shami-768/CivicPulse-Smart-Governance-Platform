package com.civicpulse.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.civicpulse.backend.entity.Notification;
import com.civicpulse.backend.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // Get notifications for a citizen
    @GetMapping("/citizen/{citizenId}")
    public ResponseEntity<List<Notification>> getCitizenNotifications(
            @PathVariable Long citizenId) {

        return ResponseEntity.ok(
                notificationService.getNotificationsByCitizenId(citizenId)
        );
    }

    // Get unread count
    @GetMapping("/citizen/{citizenId}/unread-count")
    public ResponseEntity<Long> getUnreadCount(
            @PathVariable Long citizenId) {

        return ResponseEntity.ok(
                notificationService.getUnreadCount(citizenId)
        );
    }

    // Mark one notification as read
    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                notificationService.markAsRead(id)
        );
    }

    // Mark all notifications as read for citizen
    @PutMapping("/citizen/{citizenId}/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @PathVariable Long citizenId) {

        notificationService.markAllAsRead(citizenId);

        return ResponseEntity.noContent().build();
    }

    // =========================================================
    // DEPARTMENT NOTIFICATIONS
    // =========================================================

    // Get notifications for a department (by department code like "WSS" or numeric department ID)
    @GetMapping("/department/{deptKey}")
    public ResponseEntity<List<Notification>> getDepartmentNotifications(
            @PathVariable String deptKey) {

        return ResponseEntity.ok(
                notificationService.getNotificationsByDepartment(deptKey)
        );
    }

    // Get unread count for a department
    @GetMapping("/department/{deptKey}/unread-count")
    public ResponseEntity<Long> getDepartmentUnreadCount(
            @PathVariable String deptKey) {

        return ResponseEntity.ok(
                notificationService.getDepartmentUnreadCount(deptKey)
        );
    }

    // Mark all notifications as read for a department
    @PutMapping("/department/{deptKey}/read-all")
    public ResponseEntity<Void> markAllDepartmentAsRead(
            @PathVariable String deptKey) {

        notificationService.markAllDepartmentAsRead(deptKey);

        return ResponseEntity.noContent().build();
    }
}