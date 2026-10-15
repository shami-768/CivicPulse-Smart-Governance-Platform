package com.civicpulse.backend.entity;

public enum Priority {
    HIGH,
    MEDIUM,
    LOW;

    public static Priority fromScore(int score) {
        if (score >= 75) {
            return HIGH;
        } else if (score >= 30) {
            return MEDIUM;
        } else {
            return LOW;
        }
    }
}
