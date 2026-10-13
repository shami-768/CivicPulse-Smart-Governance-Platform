package com.civicpulse.backend.dto;

public class DepartmentPriorityDistributionDTO {

    private String departmentCode;
    private String departmentName;
    private long high;
    private long medium;
    private long low;
    private long total;

    public DepartmentPriorityDistributionDTO() {
    }

    public DepartmentPriorityDistributionDTO(String departmentCode, String departmentName, long high, long medium, long low) {
        this.departmentCode = departmentCode;
        this.departmentName = departmentName;
        this.high = high;
        this.medium = medium;
        this.low = low;
        this.total = high + medium + low;
    }

    public String getDepartmentCode() {
        return departmentCode;
    }

    public void setDepartmentCode(String departmentCode) {
        this.departmentCode = departmentCode;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public long getHigh() {
        return high;
    }

    public void setHigh(long high) {
        this.high = high;
    }

    public long getMedium() {
        return medium;
    }

    public void setMedium(long medium) {
        this.medium = medium;
    }

    public long getLow() {
        return low;
    }

    public void setLow(long low) {
        this.low = low;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }
}
