package com.civicpulse.backend.Authentication;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.civicpulse.backend.entity.DepartmentOfficer;
import com.civicpulse.backend.entity.User;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Register Citizen
    @PostMapping("/register")
    public ResponseEntity<User> register(
            @RequestBody RegisterRequest request) {

        User user = authService.register(request);

        return ResponseEntity.ok(user);
    }

    // Register Department Officer (Admin only)
    @PostMapping("/register-officer")
    public ResponseEntity<DepartmentOfficer> registerOfficer(
            @RequestBody RegisterOfficerRequest request) {

        DepartmentOfficer officer = authService.registerOfficer(request);

        return ResponseEntity.ok(officer);
    }

    // Fetch all registered department officers
    @GetMapping("/officers")
    public ResponseEntity<List<DepartmentOfficer>> getAllOfficers() {
        return ResponseEntity.ok(authService.getAllOfficers());
    }

    // Login (General)
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody LoginRequest request) {

        AuthResponse authResponse = authService.login(request);

        return ResponseEntity.ok(authResponse);
    }

    // Admin Dedicated Login
    @PostMapping("/admin-login")
    public ResponseEntity<AuthResponse> adminLogin(
            @RequestBody LoginRequest request) {

        AuthResponse authResponse = authService.adminLogin(request);

        return ResponseEntity.ok(authResponse);
    }

    // Citizen Dedicated Login
    @PostMapping("/citizen-login")
    public ResponseEntity<AuthResponse> citizenLogin(
            @RequestBody LoginRequest request) {

        AuthResponse authResponse = authService.citizenLogin(request);

        return ResponseEntity.ok(authResponse);
    }

    // Department Officer Dedicated Login
    @PostMapping("/department-login")
    public ResponseEntity<AuthResponse> departmentLogin(
            @RequestBody LoginRequest request) {

        AuthResponse authResponse = authService.departmentLogin(request);

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/officer-login")
    public ResponseEntity<AuthResponse> officerLogin(
            @RequestBody LoginRequest request) {

        AuthResponse authResponse = authService.departmentLogin(request);

        return ResponseEntity.ok(authResponse);
    }
}