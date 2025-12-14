package com.mukono.voting.backend;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * BishopNamespaceController reserves the /api/v1/bishop/** namespace.
 * Accessible by users with ROLE_ADMIN or ROLE_BISHOP.
 */
@RestController
@RequestMapping("/api/v1/bishop")
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_BISHOP')")
public class BishopNamespaceController {

    /**
     * Health check endpoint for Bishop namespace.
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "bishop ok");
        return ResponseEntity.ok(response);
    }
}
