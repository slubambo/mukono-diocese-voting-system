package com.mukono.voting.test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/test")
public class TestController {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/secure")
    public ResponseEntity<String> secureTest() {
        return ResponseEntity.ok("secure ok");
    }

    /**
     * Verify BCrypt hash - for testing authentication issues
     */
    @PostMapping("/verify-bcrypt")
    public ResponseEntity<Map<String, Object>> verifyBCrypt(
            @RequestParam String password,
            @RequestParam String hash) {
        Map<String, Object> response = new HashMap<>();
        boolean matches = passwordEncoder.matches(password, hash);
        response.put("password", password);
        response.put("hash", hash);
        response.put("matches", matches);
        return ResponseEntity.ok(response);
    }

    /**
     * Encode a password to BCrypt - for generating test hashes
     */
    @PostMapping("/encode-password")
    public ResponseEntity<Map<String, String>> encodePassword(@RequestParam String password) {
        Map<String, String> response = new HashMap<>();
        String encoded = passwordEncoder.encode(password);
        response.put("password", password);
        response.put("hash", encoded);
        return ResponseEntity.ok(response);
    }
}
