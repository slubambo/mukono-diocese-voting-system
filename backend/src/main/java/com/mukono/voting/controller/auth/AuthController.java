package com.mukono.voting.controller.auth;

import com.mukono.voting.payload.request.LoginRequest;
import com.mukono.voting.payload.response.JwtAuthenticationResponse;
import com.mukono.voting.service.auth.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<JwtAuthenticationResponse> authenticateUser(
            @Valid @RequestBody LoginRequest loginRequest) {
        JwtAuthenticationResponse response = authService.authenticate(loginRequest);
        return ResponseEntity.ok(response);
    }
}
