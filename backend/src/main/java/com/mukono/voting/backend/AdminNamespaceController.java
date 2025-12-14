package com.mukono.voting.backend;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * AdminNamespaceController reserves the /api/v1/admin/** namespace.
 * Accessible only by users with ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class AdminNamespaceController {

    /**
     * Health check endpoint for admin namespace.
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "admin ok");
        return ResponseEntity.ok(response);
    }
}
