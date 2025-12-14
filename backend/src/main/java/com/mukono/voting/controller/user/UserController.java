package com.mukono.voting.controller.user;

import com.mukono.voting.payload.request.CreateUserRequest;
import com.mukono.voting.payload.request.UpdateUserRequest;
import com.mukono.voting.payload.response.UserResponse;
import com.mukono.voting.security.UserPrincipal;
import com.mukono.voting.model.user.User;
import com.mukono.voting.repository.user.UserRepository;
import com.mukono.voting.service.user.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        boolean isBootstrap = userRepository.count() == 0;
        if (!isBootstrap) {
            throw new IllegalStateException("User creation requires ROLE_ADMIN after bootstrap");
        }
        User createdUser = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.toUserResponse(createdUser));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        User updatedUser = userService.updateUser(id, request);
        return ResponseEntity.ok(userService.toUserResponse(updatedUser));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(userService.toUserResponse(user));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(userService.getCurrentUser(currentUser));
    }

    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Page<UserResponse>> listUsers(Pageable pageable) {
        Page<User> users = userRepository.findAll(pageable);
        Page<UserResponse> responses = users.map(userService::toUserResponse);
        return ResponseEntity.ok(responses);
    }
}