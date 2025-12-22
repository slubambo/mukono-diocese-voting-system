package com.mukono.voting.controller.ds;

import com.mukono.voting.model.leadership.PositionScope;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

/**
 * Exposes leadership levels (scopes) for the DS namespace.
 */
@RestController
@RequestMapping("/api/v1/ds/leadership/levels")
@PreAuthorize("hasAnyRole('DS','ADMIN')")
public class DsLeadershipLevelController {

    @GetMapping
    public ResponseEntity<List<String>> getLevels() {
        List<String> levels = Arrays.stream(PositionScope.values())
                .map(Enum::name)
                .toList();
        return ResponseEntity.ok(levels);
    }
}
