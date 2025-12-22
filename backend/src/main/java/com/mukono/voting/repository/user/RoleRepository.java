package com.mukono.voting.repository.user;

import com.mukono.voting.model.user.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(Role.RoleName name);

    boolean existsByName(Role.RoleName name);

    @Query(value = "select name from roles", nativeQuery = true)
    List<String> findAllRoleNames();
}