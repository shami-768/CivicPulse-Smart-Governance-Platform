package com.civicpulse.backend.entity;

public enum CanonicalDepartment {

    ED("ED", "Emergency & Public Safety Department", "emergency@civicpulse.com"),
    ESL("ESL", "Electricity & Street Lighting", "power@civicpulse.com"),
    PWI("PWI", "Public Works & Infrastructure", "pwd@civicpulse.com"),
    WSS("WSS", "Water Supply & Sewerage", "water@civicpulse.com"),
    SWM("SWM", "Sanitation & Waste Management", "sanitation@civicpulse.com"),
    PHH("PHH", "Public Health & Hygiene", "health@civicpulse.com"),
    PE("PE", "Environment & Parks", "parks@civicpulse.com"),
    TT("TT", "Traffic & Transportation", "traffic@civicpulse.com"),
    GAD("GAD", "General Administration Department", "admin@civicpulse.com");

    private final String code;
    private final String name;
    private final String defaultEmail;

    CanonicalDepartment(String code, String name, String defaultEmail) {
        this.code = code;
        this.name = name;
        this.defaultEmail = defaultEmail;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDefaultEmail() {
        return defaultEmail;
    }

    public static CanonicalDepartment fromCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            return GAD;
        }

        String cat = category.trim().toLowerCase();

        if (cat.contains("fire") || cat.contains("emergency")) {
            return ED;
        }
        if (cat.contains("street light") || cat.contains("electricity") || cat.contains("power")) {
            return ESL;
        }
        if (cat.contains("road") || cat.contains("infrastructure") || cat.contains("pothole") || cat.contains("bridge")) {
            return PWI;
        }
        if (cat.contains("water") || cat.contains("sewerage") || cat.contains("drainage") || cat.contains("pipeline") || cat.contains("leakage")) {
            return WSS;
        }
        if (cat.contains("sanitation") || cat.contains("garbage") || cat.contains("waste") || cat.contains("trash")) {
            return SWM;
        }
        if (cat.contains("health") || cat.contains("hygiene") || cat.contains("hospital")) {
            return PHH;
        }
        if (cat.contains("park") || cat.contains("tree") || cat.contains("environment") || cat.contains("green")) {
            return PE;
        }
        if (cat.contains("traffic") || cat.contains("transport") || cat.contains("signal")) {
            return TT;
        }

        return GAD;
    }

    public static CanonicalDepartment fromCode(String code) {
        if (code == null) return GAD;
        for (CanonicalDepartment dept : values()) {
            if (dept.getCode().equalsIgnoreCase(code.trim())) {
                return dept;
            }
        }
        return GAD;
    }
}
