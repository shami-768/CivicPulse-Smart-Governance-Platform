package com.civicpulse.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.civicpulse.backend.Authentication.AuthService;
import com.civicpulse.backend.Authentication.RegisterOfficerRequest;
import com.civicpulse.backend.entity.Complaint;
import com.civicpulse.backend.entity.Department;
import com.civicpulse.backend.entity.DepartmentOfficer;
import com.civicpulse.backend.service.DepartmentService;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin(origins = "*")
public class DepartmentController {

    private final DepartmentService departmentService;
    private final AuthService authService;

    public DepartmentController(DepartmentService departmentService, AuthService authService) {
        this.departmentService = departmentService;
        this.authService = authService;
    }

    @PostMapping("/register-officer")
    public ResponseEntity<DepartmentOfficer> registerOfficer(@RequestBody RegisterOfficerRequest request) {
        return ResponseEntity.ok(authService.registerOfficer(request));
    }

    @GetMapping("/officers")
    public ResponseEntity<List<DepartmentOfficer>> getAllOfficers() {
        return ResponseEntity.ok(authService.getAllOfficers());
    }

    @PostMapping
    public ResponseEntity<Department> createDepartment(@RequestBody Department department) {
        return ResponseEntity.ok(departmentService.createDepartment(department));
    }

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Department> getDepartmentById(@PathVariable Long id) {
        return departmentService.getDepartmentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Department> getDepartmentByUserId(@PathVariable Long userId) {
        return departmentService.getDepartmentByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/complaints")
    public ResponseEntity<List<Complaint>> getDepartmentComplaints(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getDepartmentComplaints(id));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<Map<String, Object>> getDepartmentStats(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getDepartmentStats(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Department> updateDepartment(
            @PathVariable Long id,
            @RequestBody Department department) {
        return ResponseEntity.ok(departmentService.updateDepartment(id, department));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }
}
