package com.civicpulse.backend.Authentication;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.civicpulse.backend.entity.Citizen;
import com.civicpulse.backend.entity.DepartmentOfficer;
import com.civicpulse.backend.entity.User;
import com.civicpulse.backend.repository.CitizenRepository;
import com.civicpulse.backend.repository.DepartmentOfficerRepository;
import com.civicpulse.backend.repository.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CitizenRepository citizenRepository;
    private final DepartmentOfficerRepository departmentOfficerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            CitizenRepository citizenRepository,
            DepartmentOfficerRepository departmentOfficerRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.citizenRepository = citizenRepository;
        this.departmentOfficerRepository = departmentOfficerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // Citizen Registration (Stores email, password, name, phone, address, and role in citizens table)
    public User register(RegisterRequest request) {
        String cleanEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";

        if (citizenRepository.existsByEmailIgnoreCase(cleanEmail) || userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new RuntimeException("Email already registered");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 1. Save User record
        User user = new User();
        user.setName(request.getName());
        user.setEmail(cleanEmail);
        user.setPassword(encodedPassword);
        user.setRole("CITIZEN");

        User savedUser = userRepository.save(user);

        // 2. Save Citizen record with email, password, and profile into citizens table
        Citizen citizen = new Citizen();
        citizen.setUserId(savedUser.getId());
        citizen.setName(request.getName());
        citizen.setEmail(cleanEmail);
        citizen.setPassword(encodedPassword);
        citizen.setPhone(request.getPhone() != null ? request.getPhone() : "");
        citizen.setAddress(request.getAddress() != null ? request.getAddress() : "");
        citizen.setRole("CITIZEN");

        citizenRepository.save(citizen);

        return savedUser;
    }

    // General Login
    public AuthResponse login(LoginRequest request) {
        String cleanEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";

        if ("admin@civicpulse.com".equalsIgnoreCase(cleanEmail) && !userRepository.existsByEmailIgnoreCase("admin@civicpulse.com")) {
            return adminLogin(request);
        }

        // Try Citizen DB first
        if (citizenRepository.existsByEmailIgnoreCase(cleanEmail)) {
            return citizenLogin(request);
        }

        // Try Department Officer DB
        if (departmentOfficerRepository.existsByEmailIgnoreCase(cleanEmail)) {
            return departmentLogin(request);
        }

        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);

        if ("CITIZEN".equalsIgnoreCase(user.getRole())) {
            Citizen citizen = citizenRepository.findByUserId(user.getId())
                    .orElseGet(() -> {
                        Citizen newCitizen = new Citizen();
                        newCitizen.setUserId(user.getId());
                        newCitizen.setName(user.getName());
                        newCitizen.setEmail(user.getEmail());
                        newCitizen.setPassword(user.getPassword());
                        newCitizen.setPhone("9876543210");
                        newCitizen.setAddress("Registered Address");
                        newCitizen.setRole("CITIZEN");
                        return citizenRepository.save(newCitizen);
                    });

            return new AuthResponse(
                    token,
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole(),
                    citizen.getId(),
                    citizen.getPhone(),
                    citizen.getAddress()
            );
        }

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }

    // Admin Dedicated Login
    public AuthResponse adminLogin(LoginRequest request) {
        String cleanEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String rawPassword = request.getPassword() != null ? request.getPassword() : "";

        if ("admin@civicpulse.com".equalsIgnoreCase(cleanEmail) && !userRepository.existsByEmailIgnoreCase("admin@civicpulse.com")) {
            User admin = new User();
            admin.setName("CivicPulse Admin");
            admin.setEmail("admin@civicpulse.com");
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setRole("ADMIN");
            userRepository.save(admin);
        }

        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseThrow(() -> new RuntimeException("Invalid admin email or password"));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Invalid admin email or password");
        }

        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("Access denied: Account is not an authorized administrator.");
        }

        String token = jwtService.generateToken(user);

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }

    // Citizen Dedicated Login (Fetches directly from citizens DB table and authenticates)
    public AuthResponse citizenLogin(LoginRequest request) {
        String cleanEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String rawPassword = request.getPassword() != null ? request.getPassword() : "";

        // 1. Fetch Citizen directly from citizens table
        Citizen citizen = citizenRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseGet(() -> {
                    // Fallback lookup in users table if migrated
                    User user = userRepository.findByEmailIgnoreCase(cleanEmail)
                            .orElseThrow(() -> new RuntimeException("Invalid citizen email or password"));

                    if (!"CITIZEN".equalsIgnoreCase(user.getRole())) {
                        throw new RuntimeException("Access denied: Account is not a registered citizen.");
                    }

                    Citizen newCitizen = new Citizen();
                    newCitizen.setUserId(user.getId());
                    newCitizen.setName(user.getName());
                    newCitizen.setEmail(user.getEmail());
                    newCitizen.setPassword(user.getPassword());
                    newCitizen.setPhone("9876543210");
                    newCitizen.setAddress("Registered Address");
                    newCitizen.setRole("CITIZEN");
                    return citizenRepository.save(newCitizen);
                });

        // 2. Verify password directly against citizen.getPassword() from citizens DB table
        if (!passwordEncoder.matches(rawPassword, citizen.getPassword())) {
            throw new RuntimeException("Invalid citizen email or password");
        }

        // Create User entity for JWT token generation
        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseGet(() -> {
                    User u = new User();
                    u.setId(citizen.getUserId() != null ? citizen.getUserId() : citizen.getId());
                    u.setName(citizen.getName());
                    u.setEmail(citizen.getEmail());
                    u.setPassword(citizen.getPassword());
                    u.setRole("CITIZEN");
                    return u;
                });

        String token = jwtService.generateToken(user);

        return new AuthResponse(
                token,
                user.getId(),
                citizen.getName() != null ? citizen.getName() : user.getName(),
                citizen.getEmail() != null ? citizen.getEmail() : user.getEmail(),
                "CITIZEN",
                citizen.getId(),
                citizen.getPhone(),
                citizen.getAddress()
        );
    }

    // Department Officer Dedicated Login (Fetches directly from department_officers DB table)
    public AuthResponse departmentLogin(LoginRequest request) {
        String cleanEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String rawPassword = request.getPassword() != null ? request.getPassword() : "";

        DepartmentOfficer officer = departmentOfficerRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseThrow(() -> new RuntimeException("Invalid department officer email or password"));

        if (!passwordEncoder.matches(rawPassword, officer.getPassword())) {
            throw new RuntimeException("Invalid department officer email or password");
        }

        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseGet(() -> {
                    User u = new User();
                    u.setId(officer.getUserId() != null ? officer.getUserId() : officer.getId());
                    u.setName(officer.getName());
                    u.setEmail(officer.getEmail());
                    u.setPassword(officer.getPassword());
                    u.setRole("DEPARTMENT_OFFICER");
                    return u;
                });

        String token = jwtService.generateToken(user);

        return new AuthResponse(
                token,
                user.getId(),
                officer.getName(),
                officer.getEmail(),
                "DEPARTMENT_OFFICER",
                officer.getDepartmentId(),
                officer.getDepartmentName(),
                officer.getDepartmentCode(),
                officer.getPhone()
        );
    }

    // Register Department Officer (Admin functionality)
    public DepartmentOfficer registerOfficer(RegisterOfficerRequest request) {
        String cleanEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";

        if (cleanEmail.isEmpty()) {
            throw new RuntimeException("Officer email is required");
        }

        if (departmentOfficerRepository.existsByEmailIgnoreCase(cleanEmail) || userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new RuntimeException("Officer with email '" + cleanEmail + "' is already registered in DB");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword() != null ? request.getPassword() : "Officer@123");

        // 1. Save User record
        User user = new User();
        user.setName(request.getName());
        user.setEmail(cleanEmail);
        user.setPassword(encodedPassword);
        user.setRole("DEPARTMENT_OFFICER");
        User savedUser = userRepository.save(user);

        // 2. Save DepartmentOfficer record in department_officers table
        DepartmentOfficer officer = new DepartmentOfficer();
        officer.setUserId(savedUser.getId());
        officer.setDepartmentId(request.getDepartmentId() != null ? request.getDepartmentId() : 1L);
        officer.setName(request.getName());
        officer.setEmail(cleanEmail);
        officer.setPassword(encodedPassword);
        officer.setDepartmentName(request.getDepartmentName() != null ? request.getDepartmentName() : "Municipal Department");
        officer.setDepartmentCode(request.getDepartmentCode() != null ? request.getDepartmentCode() : "DEPT");
        officer.setPhone(request.getPhone() != null ? request.getPhone() : "");
        officer.setRole("DEPARTMENT_OFFICER");

        return departmentOfficerRepository.save(officer);
    }

    // List all registered department officers
    public java.util.List<DepartmentOfficer> getAllOfficers() {
        return departmentOfficerRepository.findAll();
    }
}

