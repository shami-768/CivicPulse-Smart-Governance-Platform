package com.civicpulse.backend.service;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.Mockito;
import static org.mockito.Mockito.when;

import com.civicpulse.backend.entity.Department;
import com.civicpulse.backend.repository.DepartmentRepository;

class ComplaintDepartmentServiceTest {

    private DepartmentRepository departmentRepository;
    private ComplaintDepartmentService complaintDepartmentService;

    @BeforeEach
    void setUp() {
        departmentRepository = Mockito.mock(DepartmentRepository.class);
        complaintDepartmentService = new ComplaintDepartmentService(departmentRepository);

        when(departmentRepository.findByDepartmentNameContainingIgnoreCase(anyString()))
                .thenAnswer(invocation -> {
                    String queryName = invocation.getArgument(0);
                    Department dept = new Department();
                    dept.setId(100L);
                    dept.setDepartmentName(queryName);
                    if (queryName.contains("Emergency")) dept.setDepartmentCode("ED");
                    else if (queryName.contains("Electricity")) dept.setDepartmentCode("ESL");
                    else if (queryName.contains("Public Works")) dept.setDepartmentCode("PWI");
                    else if (queryName.contains("Water")) dept.setDepartmentCode("WSS");
                    else if (queryName.contains("Sanitation")) dept.setDepartmentCode("SWM");
                    else dept.setDepartmentCode("GAD");
                    return Optional.of(dept);
                });

        when(departmentRepository.save(any(Department.class)))
                .thenAnswer(invocation -> {
                    Department d = invocation.getArgument(0);
                    if (d.getId() == null) {
                        d.setId(200L);
                    }
                    return d;
                });
    }

    @Test
    void testFireAndEmergencyMapping() {
        Department dept = complaintDepartmentService.getDepartmentForCategory("Fire & Emergency");
        assertNotNull(dept);
        assertEquals("Emergency & Public Safety Department", dept.getDepartmentName());
        assertEquals("ED", dept.getDepartmentCode());
    }

    @Test
    void testStreetLightMapping() {
        Department dept = complaintDepartmentService.getDepartmentForCategory("Street Light");
        assertNotNull(dept);
        assertEquals("Electricity & Street Lighting", dept.getDepartmentName());
        assertEquals("ESL", dept.getDepartmentCode());
    }

    @Test
    void testElectricityMapping() {
        Department dept = complaintDepartmentService.getDepartmentForCategory("Electricity");
        assertNotNull(dept);
        assertEquals("Electricity & Street Lighting", dept.getDepartmentName());
        assertEquals("ESL", dept.getDepartmentCode());
    }

    @Test
    void testRoadMapping() {
        Department dept = complaintDepartmentService.getDepartmentForCategory("Road");
        assertNotNull(dept);
        assertEquals("Public Works & Infrastructure", dept.getDepartmentName());
        assertEquals("PWI", dept.getDepartmentCode());
    }

    @Test
    void testWaterMapping() {
        Department dept = complaintDepartmentService.getDepartmentForCategory("Water");
        assertNotNull(dept);
        assertEquals("Water Supply & Sewerage", dept.getDepartmentName());
        assertEquals("WSS", dept.getDepartmentCode());
    }

    @Test
    void testDrainageMapping() {
        Department dept = complaintDepartmentService.getDepartmentForCategory("Drainage");
        assertNotNull(dept);
        assertEquals("Water Supply & Sewerage", dept.getDepartmentName());
        assertEquals("WSS", dept.getDepartmentCode());
    }

    @Test
    void testSanitationMapping() {
        Department dept = complaintDepartmentService.getDepartmentForCategory("Sanitation");
        assertNotNull(dept);
        assertEquals("Sanitation & Waste Management", dept.getDepartmentName());
        assertEquals("SWM", dept.getDepartmentCode());
    }

    @Test
    void testGarbageMapping() {
        Department dept = complaintDepartmentService.getDepartmentForCategory("Garbage");
        assertNotNull(dept);
        assertEquals("Sanitation & Waste Management", dept.getDepartmentName());
        assertEquals("SWM", dept.getDepartmentCode());
    }

    @Test
    void testOtherCategoryFallback() {
        Department dept = complaintDepartmentService.getDepartmentForCategory("Other");
        assertNotNull(dept);
        assertEquals("General Administration Department", dept.getDepartmentName());
        assertEquals("GAD", dept.getDepartmentCode());
    }

    @Test
    void testNullOrEmptyCategoryValidation() {
        assertThrows(IllegalArgumentException.class, () -> complaintDepartmentService.getDepartmentForCategory(null));
        assertThrows(IllegalArgumentException.class, () -> complaintDepartmentService.getDepartmentForCategory("  "));
    }
}
