package com.mukono.voting.config;

import com.mukono.voting.model.user.Role;
import com.mukono.voting.repository.user.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * RoleSeeder initializes default roles on application startup.
 * Ensures all role rows exist for the system to function.
 */
@Component
public class RoleSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;

    public RoleSeeder(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        seedRoles();
    }

    private void seedRoles() {
        Role.RoleName[] roleNames = {
            Role.RoleName.ROLE_ADMIN,
            Role.RoleName.ROLE_DS,
            Role.RoleName.ROLE_BISHOP,
            Role.RoleName.ROLE_SENIOR_STAFF,
            Role.RoleName.ROLE_POLLING_OFFICER,
            Role.RoleName.ROLE_VOTER
        };

        for (Role.RoleName roleName : roleNames) {
            if (!roleRepository.existsByName(roleName)) {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
                System.out.println("Seeded role: " + roleName);
            }
        }
    }
}
