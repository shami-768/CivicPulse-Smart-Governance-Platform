package com.civicpulse.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.civicpulse.backend.dto.PriorityCalculationResult;
import com.civicpulse.backend.entity.Complaint;
import com.civicpulse.backend.entity.Priority;

class ComplaintPriorityServiceTest {

    private ComplaintPriorityService priorityService;

    @BeforeEach
    void setUp() {
        priorityService = new ComplaintPriorityService();
    }

    @Test
    @DisplayName("Test 1: Street light not working - Should infer LOW/MEDIUM priority")
    void test1_StreetLightNotWorking() {
        Complaint complaint = new Complaint();
        complaint.setTitle("Street light not working");
        complaint.setDescription("Street light near my house has been broken for two days.");
        complaint.setCategory("Street Light");
        complaint.setLocation("Sector 14 Residential");

        PriorityCalculationResult result = priorityService.calculatePriority(complaint, 0);

        assertNotNull(result);
        assertNotNull(result.getPriority());
        assertTrue(result.getPriority() == Priority.LOW || result.getPriority() == Priority.MEDIUM, 
                "Routine street light complaint should be LOW or MEDIUM, actual: " + result.getPriority());
        assertNotNull(result.getReason());
    }

    @Test
    @DisplayName("Test 2: Major pothole causing accidents - Should infer HIGH priority")
    void test2_MajorPotholeCausingAccidents() {
        Complaint complaint = new Complaint();
        complaint.setTitle("Major pothole causing accidents");
        complaint.setDescription("Large pothole on the main road has already caused accidents and is dangerous for vehicles.");
        complaint.setCategory("Road");
        complaint.setLocation("Main Expressway Road");

        PriorityCalculationResult result = priorityService.calculatePriority(complaint, 0);

        assertNotNull(result);
        assertEquals(Priority.HIGH, result.getPriority(), 
                "Road pothole causing accidents on main road must infer HIGH priority");
        assertTrue(result.getScore() >= 80);
        assertTrue(result.getReason().contains("High-risk") || result.getReason().contains("accidents"));
    }

    @Test
    @DisplayName("Test 3: Water pipe burst near hospital - Should infer HIGH priority")
    void test3_WaterPipeBurstNearHospital() {
        Complaint complaint = new Complaint();
        complaint.setTitle("Water pipe burst near hospital");
        complaint.setDescription("Large water leakage is flooding the road and blocking hospital access.");
        complaint.setCategory("Water");
        complaint.setLocation("Hospital Road");

        PriorityCalculationResult result = priorityService.calculatePriority(complaint, 0);

        assertNotNull(result);
        assertEquals(Priority.HIGH, result.getPriority(), 
                "Water burst near hospital blocking access must infer HIGH priority");
        assertTrue(result.getScore() >= 80);
        assertTrue(result.getReason().contains("hospital") || result.getReason().contains("flooding") || result.getReason().contains("burst"));
    }

    @Test
    @DisplayName("Test 4: Fire in building - Should infer HIGH priority")
    void test4_FireInBuilding() {
        Complaint complaint = new Complaint();
        complaint.setTitle("Fire in building");
        complaint.setDescription("Fire has started in a building and people are trapped.");
        complaint.setCategory("Fire & Emergency");
        complaint.setLocation("Sector 62 Commercial Complex");

        PriorityCalculationResult result = priorityService.calculatePriority(complaint, 0);

        assertNotNull(result);
        assertEquals(Priority.HIGH, result.getPriority(), 
                "Fire with people trapped must infer HIGH priority");
        assertTrue(result.getScore() >= 80);
        assertTrue(result.getReason().contains("High-risk") || result.getReason().contains("fire") || result.getReason().contains("trapped"));
    }

    @Test
    @DisplayName("Test 5: Garbage not collected - Should infer LOW/MEDIUM priority")
    void test5_GarbageNotCollected() {
        Complaint complaint = new Complaint();
        complaint.setTitle("Garbage not collected");
        complaint.setDescription("Garbage has not been collected for two days.");
        complaint.setCategory("Garbage");
        complaint.setLocation("Residential Alley");

        PriorityCalculationResult result = priorityService.calculatePriority(complaint, 0);

        assertNotNull(result);
        assertNotNull(result.getPriority());
        assertTrue(result.getPriority() == Priority.LOW || result.getPriority() == Priority.MEDIUM, 
                "Routine garbage uncollected should infer LOW or MEDIUM, actual: " + result.getPriority());
    }

    @Test
    @DisplayName("Null & Incomplete Complaint Handling")
    void testNullAndIncompleteHandling() {
        Complaint complaint = new Complaint();

        PriorityCalculationResult result = priorityService.calculatePriority(complaint, 0);

        assertNotNull(result);
        assertNotNull(result.getPriority());
        assertNotNull(result.getReason());
    }
}
