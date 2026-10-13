package com.civicpulse.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "department_officers")
public class DepartmentOfficer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Long departmentId;

    private String name;

    @Column(unique = true)
    private String email;

    private String password;

    private String departmentName;

    private String departmentCode;

    private String phone;

    private String role;

    public DepartmentOfficer() {
    }

    public DepartmentOfficer(Long id, Long userId, Long departmentId, String name, String email,
                             String password, String departmentName, String departmentCode,
                             String phone, String role) {
        this.id = id;
        this.userId = userId;
        this.departmentId = departmentId;
        this.name = name;
        this.email = email;
        this.password = password;
        this.departmentName = departmentName;
        this.departmentCode = departmentCode;
        this.phone = phone;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public String getDepartmentCode() {
        return departmentCode;
    }

    public void setDepartmentCode(String departmentCode) {
        this.departmentCode = departmentCode;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
