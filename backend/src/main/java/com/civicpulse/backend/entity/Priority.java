package com.civicpulse.backend.entity;

public enum Priority {
    HIGH,
    MEDIUM,
    LOW;

    public static Priority fromScore(int score) {
        if (score >= 80) {
            return HIGH;
        } else if (score >= 50) {
            return MEDIUM;
        } else {
            return LOW;
        }
    }
}
