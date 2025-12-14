package com.mukono.voting.security;

import com.mukono.voting.payload.request.LoginRequest;
import com.mukono.voting.payload.response.JwtAuthenticationResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    @Autowired
    public AuthController(AuthenticationManager authenticationManager,
                         JwtTokenProvider jwtTokenProvider,
                         CustomUserDetailsService customUserDetailsService) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.customUserDetailsService = customUserDetailsService;
    }

    /**
     * Authenticate user and return JWT token.
     * 
     * @param loginRequest contains username and password
     * @return JwtAuthenticationResponse with access token, username, and roles
     */
    @PostMapping("/login")
    public ResponseEntity<JwtAuthenticationResponse> authenticateUser(
            @Valid @RequestBody LoginRequest loginRequest) {

        logger.info("Login attempt for username: {}", loginRequest.getUsername());
        
        try {
            // Authenticate the user with username and password
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            logger.info("Authentication successful for username: {}", loginRequest.getUsername());

            // Set authentication in security context
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Get user principal from authentication
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            // Generate JWT token
            String jwt = jwtTokenProvider.generateToken(userPrincipal);

            // Extract roles from authorities
            List<String> roles = userPrincipal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            // Build and return response
            JwtAuthenticationResponse response = new JwtAuthenticationResponse(
                    jwt,
                    userPrincipal.getUsername(),
                    roles
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Authentication failed for username: {}, error: {}", loginRequest.getUsername(), e.getMessage(), e);
            throw e;
        }
    }
}