package com.civicpulse.backend.Authentication;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Application-level Spring configuration.
 *
 * Registers a RestTemplate bean used by ComplaintPriorityService
 * to communicate with the Python ML microservice.
 *
 * Timeouts are deliberately short so that a slow/down ML service
 * does not block complaint registration — the service falls back
 * to rule-based scoring if the call times out.
 */
@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(Duration.ofSeconds(3))   // 3s to connect
                .readTimeout(Duration.ofSeconds(5))       // 5s to read response
                .build();
    }
}
