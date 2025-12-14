package com.mukono.voting.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.UnsupportedJwtException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    @Value("${app.jwtSecret:change_me}")
    private String jwtSecret;

    @Value("${app.jwtExpirationInMs:86400000}")
    private long jwtExpirationInMs;

    /**
     * Generate JWT token from UserPrincipal.
     * Subject = user ID.
     * Includes username and roles in claims.
     * Includes issue and expiry timestamps.
     */
    public String generateToken(UserPrincipal userPrincipal) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        // Build roles claim
        String roles = userPrincipal.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .collect(Collectors.joining(","));

        String token = Jwts.builder()
                .setSubject(String.valueOf(userPrincipal.getId()))
                .claim("username", userPrincipal.getUsername())
                .claim("roles", roles)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, jwtSecret.getBytes(StandardCharsets.UTF_8))
                .compact();

        return token;
    }

    /**
     * Extract user ID from JWT token.
     * Parses the token and returns the subject as Long (user ID).
     */
    public Long getUserIdFromJWT(String token) {
        Claims claims = Jwts.parser()
                .setSigningKey(jwtSecret.getBytes(StandardCharsets.UTF_8))
                .parseClaimsJws(token)
                .getBody();
        String subject = claims.getSubject();
        return Long.parseLong(subject);
    }

    /**
     * Validate JWT token.
     * Parses token and returns true if valid, false otherwise.
     */
    public boolean validateToken(String authToken) {
        try {
            Jwts.parser()
                    .setSigningKey(jwtSecret.getBytes(StandardCharsets.UTF_8))
                    .parseClaimsJws(authToken);
            return true;
        } catch (SignatureException ex) {
            // invalid signature
        } catch (MalformedJwtException ex) {
            // invalid token
        } catch (ExpiredJwtException ex) {
            // expired token
        } catch (UnsupportedJwtException ex) {
            // unsupported token
        } catch (IllegalArgumentException ex) {
            // empty claims
        } catch (Exception ex) {
            // unexpected
        }
        return false;
    }
}