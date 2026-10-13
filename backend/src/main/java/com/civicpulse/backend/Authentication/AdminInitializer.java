package com.civicpulse.backend.Authentication;

import com.civicpulse.backend.entity.CanonicalDepartment;
import com.civicpulse.backend.entity.Citizen;
import com.civicpulse.backend.entity.Department;
import com.civicpulse.backend.entity.DepartmentOfficer;
import com.civicpulse.backend.entity.User;
import com.civicpulse.backend.repository.CitizenRepository;
import com.civicpulse.backend.repository.DepartmentOfficerRepository;
import com.civicpulse.backend.repository.DepartmentRepository;
import com.civicpulse.backend.repository.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminInitializer {

    @Bean
    CommandLineRunner createAdmin(
            UserRepository userRepository,
            CitizenRepository citizenRepository,
            DepartmentRepository departmentRepository,
            DepartmentOfficerRepository departmentOfficerRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {

            // 1. Create Default Admin User in 'users' table
            String adminEmail = "admin@civicpulse.com";
            if (!userRepository.existsByEmail(adminEmail)) {
                User admin = new User();
                admin.setName("CivicPulse Admin");
                admin.setEmail(adminEmail);
                admin.setPassword(passwordEncoder.encode("Admin@123"));
                admin.setRole("ADMIN");
                userRepository.save(admin);
            }

            // 2. Create Default Citizen User in 'users' and 'citizens' table
            String citizenEmail = "citizen@civicpulse.com";
            String encodedCitizenPassword = passwordEncoder.encode("Citizen@123");
            if (!userRepository.existsByEmail(citizenEmail)) {
                User citizenUser = new User();
                citizenUser.setName("John Citizen");
                citizenUser.setEmail(citizenEmail);
                citizenUser.setPassword(encodedCitizenPassword);
                citizenUser.setRole("CITIZEN");
                User savedCitizenUser = userRepository.save(citizenUser);

                Citizen citizenRecord = new Citizen();
                citizenRecord.setUserId(savedCitizenUser.getId());
                citizenRecord.setName("John Citizen");
                citizenRecord.setEmail(citizenEmail);
                citizenRecord.setPassword(encodedCitizenPassword);
                citizenRecord.setPhone("9876543210");
                citizenRecord.setAddress("Sector 15, Civic City");
                citizenRecord.setRole("CITIZEN");
                citizenRepository.save(citizenRecord);
            }

            // 3. Seed Canonical Departments & Officers
            String encodedOfficerPassword = passwordEncoder.encode("Officer@123");

            for (CanonicalDepartment canonical : CanonicalDepartment.values()) {
                // Seed Department record
                Department dept = departmentRepository.findByDepartmentNameContainingIgnoreCase(canonical.getName())
                        .orElseGet(() -> {
                            Department d = new Department();
                            d.setDepartmentName(canonical.getName());
                            d.setDepartmentCode(canonical.getCode());
                            d.setLocation("Central Municipal Zone");
                            d.setPhone("1800-CIVIC-PULSE");
                            return departmentRepository.save(d);
                        });

                if (dept.getDepartmentCode() == null || dept.getDepartmentCode().isBlank()) {
                    dept.setDepartmentCode(canonical.getCode());
                    departmentRepository.save(dept);
                }

                // Seed Department Officer record
                seedOfficer(departmentOfficerRepository, userRepository, canonical.getDefaultEmail(),
                        canonical.getName() + " Officer", canonical.getName(), canonical.getCode(),
                        dept.getId(), "987650000" + dept.getId(), encodedOfficerPassword);
            }
        };
    }

    private void seedOfficer(DepartmentOfficerRepository deptRepo, UserRepository userRepo,
                             String email, String name, String deptName, String deptCode, Long deptId, String phone, String password) {
        if (!deptRepo.existsByEmailIgnoreCase(email)) {
            User officerUser = new User();
            officerUser.setName(name);
            officerUser.setEmail(email);
            officerUser.setPassword(password);
            officerUser.setRole("DEPARTMENT_OFFICER");
            User savedUser = userRepo.save(officerUser);

            DepartmentOfficer officer = new DepartmentOfficer();
            officer.setUserId(savedUser.getId());
            officer.setDepartmentId(deptId);
            officer.setName(name);
            officer.setEmail(email);
            officer.setPassword(password);
            officer.setDepartmentName(deptName);
            officer.setDepartmentCode(deptCode);
            officer.setPhone(phone);
            officer.setRole("DEPARTMENT_OFFICER");
            deptRepo.save(officer);
        }
    }
}