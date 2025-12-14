package com.mukono.voting.backend;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * StaffNamespaceController reserves the /api/v1/staff/** namespace.
 * Accessible by users with ROLE_ADMIN or ROLE_SENIOR_STAFF.
 */
@RestController
@RequestMapping("/api/v1/staff")
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SENIOR_STAFF')")
public class StaffNamespaceController {

    /**
     * Health check endpoint for Staff namespace.
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "staff ok");
        return ResponseEntity.ok(response);
    }
}
