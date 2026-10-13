package com.civicpulse.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.civicpulse.backend.dto.ReportCountDTO;
import com.civicpulse.backend.dto.ReportSummaryDTO;
import com.civicpulse.backend.service.ReportService;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // Overall report summary
    @GetMapping("/summary")
    public ResponseEntity<ReportSummaryDTO> getSummary() {

        return ResponseEntity.ok(
                reportService.getSummary()
        );
    }

    // Complaint status analysis
    @GetMapping("/status")
    public ResponseEntity<List<ReportCountDTO>> getStatusReport() {

        return ResponseEntity.ok(
                reportService.getStatusReport()
        );
    }

    // Complaint category analysis
    @GetMapping("/category")
    public ResponseEntity<List<ReportCountDTO>> getCategoryReport() {

        return ResponseEntity.ok(
                reportService.getCategoryReport()
        );
    }

    // Complaint priority analysis
    @GetMapping("/priority")
    public ResponseEntity<List<ReportCountDTO>> getPriorityReport() {

        return ResponseEntity.ok(
                reportService.getPriorityReport()
        );
    }

    // Complaint department analysis
    @GetMapping("/department")
    public ResponseEntity<List<ReportCountDTO>> getDepartmentReport() {

        return ResponseEntity.ok(
                reportService.getDepartmentReport()
        );
    }
}