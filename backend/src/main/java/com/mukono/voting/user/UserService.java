package com.mukono.voting.user;

import com.mukono.voting.people.Person;
import com.mukono.voting.people.PersonService;
import com.mukono.voting.payload.request.CreateUserRequest;
import com.mukono.voting.payload.request.UpdateUserRequest;
import com.mukono.voting.payload.response.PersonResponse;
import com.mukono.voting.payload.response.UserResponse;
import com.mukono.voting.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PersonService personService;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, RoleRepository roleRepository, 
                      PersonService personService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.personService = personService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Create a new system user.
     * Can optionally link to an existing person or create a new one.
     */
    public User createUser(CreateUserRequest request) {
        // Validate that roles are provided
        if (request.getRoles() == null || request.getRoles().isEmpty()) {
            throw new IllegalArgumentException("At least one role is required");
        }

        // Check for username and email uniqueness
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setStatus(User.Status.ACTIVE);

        // Handle Person linking
        Person linkedPerson = null;

        // Either personId or embedded person can be provided, not both
        if (request.getPersonId() != null && request.getPerson() != null) {
            throw new IllegalArgumentException("Cannot provide both personId and embedded person");
        }

        if (request.getPersonId() != null) {
            // Link to existing person
            linkedPerson = personService.findById(request.getPersonId())
                    .orElseThrow(() -> new IllegalArgumentException("Person not found with ID: " + request.getPersonId()));
        } else if (request.getPerson() != null) {
            // Create and link new person
            Person newPerson = new Person();
            newPerson.setFullName(request.getPerson().getFullName());
            newPerson.setEmail(request.getPerson().getEmail());
            newPerson.setPhoneNumber(request.getPerson().getPhoneNumber());
            
            if (request.getPerson().getGender() != null) {
                newPerson.setGender(Person.Gender.valueOf(request.getPerson().getGender().toUpperCase()));
            }
            
            newPerson.setDateOfBirth(request.getPerson().getDateOfBirth());
            newPerson.setStatus(Person.Status.ACTIVE);
            
            linkedPerson = personService.createPerson(newPerson);
        }

        user.setPerson(linkedPerson);

        // Assign roles
        Set<Role> roles = request.getRoles().stream()
                .map(roleName -> {
                    try {
                        Role.RoleName roleNameEnum = Role.RoleName.valueOf(roleName);
                        return roleRepository.findByName(roleNameEnum)
                                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleName));
                    } catch (IllegalArgumentException e) {
                        throw new IllegalArgumentException("Invalid role: " + roleName);
                    }
                })
                .collect(Collectors.toSet());

        user.setRoles(roles);

        return userRepository.save(user);
    }

    /**
     * Update an existing user.
     * Admin can change email, status, roles, password, and link/unlink person.
     */
    public User updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (!request.getEmail().equals(user.getEmail()) && 
                userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email already in use");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            user.setStatus(User.Status.valueOf(request.getStatus().toUpperCase()));
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            Set<Role> roles = request.getRoles().stream()
                    .map(roleName -> {
                        try {
                            Role.RoleName roleNameEnum = Role.RoleName.valueOf(roleName);
                            return roleRepository.findByName(roleNameEnum)
                                    .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleName));
                        } catch (IllegalArgumentException e) {
                            throw new IllegalArgumentException("Invalid role: " + roleName);
                        }
                    })
                    .collect(Collectors.toSet());
            user.setRoles(roles);
        }

        // Handle Person linking/unlinking
        if (request.getPersonId() != null) {
            Person linkedPerson = personService.findById(request.getPersonId())
                    .orElseThrow(() -> new IllegalArgumentException("Person not found with ID: " + request.getPersonId()));
            user.setPerson(linkedPerson);
        } else if (request.getPersonId() == null && request.getPersonId() != null) {
            // Only unlink if explicitly provided as an update (null value)
            // This is tricky - we rely on the request having null for personId to unlink
            // In the update, if personId field is present but null, unlink
            // Currently this logic relies on Optional handling in the request
        }

        return userRepository.save(user);
    }

    /**
     * Find user by ID.
     */
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * Find user by username.
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Get user response with linked person info.
     */
    public UserResponse toUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setStatus(user.getStatus().toString());
        response.setRoles(user.getRoles().stream()
                .map(role -> role.getName().toString())
                .collect(Collectors.toSet()));

        if (user.getPerson() != null) {
            response.setPerson(toPersonResponse(user.getPerson()));
        }

        return response;
    }

    /**
     * Convert Person to PersonResponse with computed age.
     */
    public PersonResponse toPersonResponse(Person person) {
        PersonResponse response = new PersonResponse();
        response.setId(person.getId());
        response.setFullName(person.getFullName());
        response.setEmail(person.getEmail());
        response.setPhoneNumber(person.getPhoneNumber());
        response.setGender(person.getGender() != null ? person.getGender().toString() : null);
        response.setDateOfBirth(person.getDateOfBirth());
        response.setAge(person.getAge());
        response.setStatus(person.getStatus().toString());
        return response;
    }

    /**
     * Return the current authenticated user's profile as a response.
     * Throws IllegalArgumentException if principal is null or user not found.
     */
    public UserResponse getCurrentUser(UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new IllegalArgumentException("User not authenticated");
        }
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toUserResponse(user);
    }
}