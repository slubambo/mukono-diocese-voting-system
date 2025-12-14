package com.mukono.voting.backend;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * PollingNamespaceController reserves the /api/v1/polling/** namespace.
 * Accessible by users with ROLE_ADMIN or ROLE_POLLING_OFFICER.
 */
@RestController
@RequestMapping("/api/v1/polling")
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_POLLING_OFFICER')")
public class PollingNamespaceController {

    /**
     * Health check endpoint for Polling namespace.
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "polling ok");
        return ResponseEntity.ok(response);
    }
}
