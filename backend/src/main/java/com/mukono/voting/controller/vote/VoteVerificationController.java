package com.mukono.voting.controller.vote;

import com.mukono.voting.payload.request.voting.VotePhoneVerifyRequest;
import com.mukono.voting.payload.response.voting.VotePhoneVerifyResponse;
import com.mukono.voting.repository.people.PersonRepository;
import com.mukono.voting.security.VoterPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vote")
@PreAuthorize("hasRole('VOTER')")
public class VoteVerificationController {

    private final PersonRepository personRepository;

    public VoteVerificationController(PersonRepository personRepository) {
        this.personRepository = personRepository;
    }

    @PostMapping("/verify-phone")
    public ResponseEntity<VotePhoneVerifyResponse> verifyPhone(@Valid @RequestBody VotePhoneVerifyRequest request,
                                                               Authentication authentication) {
        VoterPrincipal voter = (VoterPrincipal) authentication.getPrincipal();
        String phoneNumber = personRepository.findById(voter.getPersonId())
                .map(p -> p.getPhoneNumber())
                .orElse(null);

        String last3 = extractPhoneLast3(phoneNumber);
        if (last3 == null) {
            return ResponseEntity.ok(new VotePhoneVerifyResponse(false, "NO_PHONE"));
        }

        boolean verified = last3.equals(request.getLast3());
        return ResponseEntity.ok(new VotePhoneVerifyResponse(verified, verified ? "OK" : "MISMATCH"));
    }

    private String extractPhoneLast3(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return null;
        }
        String digits = phoneNumber.replaceAll("\\D", "");
        if (digits.length() < 3) {
            return null;
        }
        return digits.substring(digits.length() - 3);
    }
}
