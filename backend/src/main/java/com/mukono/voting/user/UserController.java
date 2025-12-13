package com.mukono.voting.user;

import com.mukono.voting.payload.request.CreateUserRequest;
import com.mukono.voting.payload.request.UpdateUserRequest;
import com.mukono.voting.payload.response.UserResponse;
import com.mukono.voting.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * UserController handles REST endpoints for managing system users.
 * Users authenticate via username/password + JWT.
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    /**
     * Create a system user.
     * Bootstrap mode: if no users exist, allow unauthenticated first-user creation.
     * Otherwise requires ROLE_ADMIN.
     */
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        // Check if this is bootstrap mode (no users exist yet)
        boolean isBootstrap = userRepository.count() == 0;

        if (!isBootstrap) {
            // Require ADMIN role if users already exist
            // This will be enforced by Spring Security via annotation if we use @PreAuthorize
            // For now, we check manually to allow bootstrap
            throw new IllegalStateException("User creation requires ROLE_ADMIN after bootstrap");
        }

        User createdUser = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.toUserResponse(createdUser));
    }

    /**
     * Update a user (email, status, roles, password, person link).
     * Requires ROLE_ADMIN.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {

        User updatedUser = userService.updateUser(id, request);
        return ResponseEntity.ok(userService.toUserResponse(updatedUser));
    }

    /**
     * Get a user by ID.
     * Requires ROLE_ADMIN.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(userService.toUserResponse(user));
    }

    /**
     * Get current authenticated user profile.
     * Accessible by any authenticated system user.
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new IllegalArgumentException("User not authenticated");
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(userService.toUserResponse(user));
    }
}
