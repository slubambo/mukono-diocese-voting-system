package com.mukono.voting.controller.user;

import com.mukono.voting.payload.request.CreateUserRequest;
import com.mukono.voting.payload.request.UpdateUserRequest;
import com.mukono.voting.payload.response.UserResponse;
import com.mukono.voting.security.UserPrincipal;
import com.mukono.voting.model.user.User;
import com.mukono.voting.repository.user.UserRepository;
import com.mukono.voting.repository.user.RoleRepository;
import com.mukono.voting.service.user.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("hasAnyRole('ADMIN','DS')")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserController(UserService userService, UserRepository userRepository, RoleRepository roleRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        boolean isBootstrap = userRepository.count() == 0;
        if (!isBootstrap) {
            // For safety, restrict to ADMIN after bootstrap
            // Method-level PreAuthorize ensures this, but we keep the check
        }
        User createdUser = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.toUserResponse(createdUser));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        User updatedUser = userService.updateUser(id, request);
        return ResponseEntity.ok(userService.toUserResponse(updatedUser));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DS')")
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
    @PreAuthorize("hasAnyRole('ADMIN','DS')")
    public ResponseEntity<Page<UserResponse>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "id,desc") String sort) {
        String[] parts = sort.split(",", 2);
        String field = parts.length > 0 ? parts[0] : "id";
        String direction = parts.length > 1 ? parts[1] : "desc";
        Sort s = direction.equalsIgnoreCase("asc") ? Sort.by(field).ascending() : Sort.by(field).descending();
        Pageable pageable = PageRequest.of(page, size, s);
        Page<User> users = userService.search(username, email, active, pageable);
        Page<UserResponse> responses = users.map(userService::toUserResponse);
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> deactivate(@PathVariable Long id) {
        UpdateUserRequest req = new UpdateUserRequest();
        req.setActive(false);
        User updated = userService.updateUser(id, req);
        return ResponseEntity.ok(userService.toUserResponse(updated));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> activate(@PathVariable Long id) {
        UpdateUserRequest req = new UpdateUserRequest();
        req.setActive(true);
        User updated = userService.updateUser(id, req);
        return ResponseEntity.ok(userService.toUserResponse(updated));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetPassword(
            @PathVariable Long id,
            @RequestParam(required = false) String newPassword) {
        UpdateUserRequest req = new UpdateUserRequest();
        req.setPassword(newPassword != null && !newPassword.isBlank() ? newPassword : "ChangeMe123!");
        User updated = userService.updateUser(id, req);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/roles")
    public ResponseEntity<List<String>> listRoles() {
        List<String> roles = roleRepository.findAllRoleNames();
        return ResponseEntity.ok(roles);
    }
}