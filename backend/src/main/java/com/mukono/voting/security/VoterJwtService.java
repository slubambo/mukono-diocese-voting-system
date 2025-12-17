package com.mukono.voting.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Builds short-lived JWTs for voters authenticated via VotingCode.
 * Does not require a User in the DB; encodes ROLE_VOTER and domain claims directly.
 */
@Component
public class VoterJwtService {

    @Value("${app.jwtSecret:change_me}")
    private String jwtSecret;

    /**
     * Generate a voter token with ROLE_VOTER and the required claims.
     */
    public String generateVoterToken(Long personId, Long electionId, Long votingPeriodId, Duration ttl, Long codeId) {
        long ttlSeconds = ttl.getSeconds();
        Date now = new Date();
        Date expiry = new Date(now.getTime() + ttlSeconds * 1000);

        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", "ROLE_VOTER"); // kept as string to match existing filter collector
        claims.put("personId", personId);
        claims.put("electionId", electionId);
        claims.put("votingPeriodId", votingPeriodId);
        if (codeId != null) {
            claims.put("codeId", codeId);
        }

        return Jwts.builder()
                .setSubject("voter:" + personId)
                .setClaims(claims)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(SignatureAlgorithm.HS512, jwtSecret.getBytes(StandardCharsets.UTF_8))
                .compact();
    }
}
