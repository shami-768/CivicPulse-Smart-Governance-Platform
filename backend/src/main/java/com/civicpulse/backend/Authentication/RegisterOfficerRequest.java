package com.civicpulse.backend.Authentication;

public class RegisterOfficerRequest {

    private String name;
    private String email;
    private String password;
    private String departmentName;
    private String departmentCode;
    private Long departmentId;
    private String phone;

    public RegisterOfficerRequest() {
    }

    public RegisterOfficerRequest(String name, String email, String password, String departmentName, String departmentCode, Long departmentId, String phone) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.departmentName = departmentName;
        this.departmentCode = departmentCode;
        this.departmentId = departmentId;
        this.phone = phone;
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

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
