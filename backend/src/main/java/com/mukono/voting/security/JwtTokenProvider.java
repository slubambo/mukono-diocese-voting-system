package com.mukono.voting.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.UnsupportedJwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

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

        logger.debug("Generating JWT for username: {}, id: {}, roles: {}", userPrincipal.getUsername(), userPrincipal.getId(), roles);
        logger.debug("JWT issued at: {}, expires at: {} ({} ms)", now, expiryDate, jwtExpirationInMs);

        String token = Jwts.builder()
                .setSubject(String.valueOf(userPrincipal.getId()))
                .claim("username", userPrincipal.getUsername())
                .claim("roles", roles)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, jwtSecret.getBytes(StandardCharsets.UTF_8))
                .compact();

        logger.debug("Generated JWT length: {}", token != null ? token.length() : 0);
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
        logger.debug("Parsed subject (userId) from JWT: {}", subject);
        return Long.parseLong(subject);
    }

    /**
     * Validate JWT token.
     * Parses token and returns true if valid, false otherwise.
     */
    public boolean validateToken(String authToken) {
        try {
            logger.debug("Validating JWT token (first 20 chars): {}", authToken != null && authToken.length() > 20 ? authToken.substring(0, 20) + "..." : authToken);
            Jwts.parser()
                    .setSigningKey(jwtSecret.getBytes(StandardCharsets.UTF_8))
                    .parseClaimsJws(authToken);
            return true;
        } catch (SignatureException ex) {
            logger.warn("Invalid JWT signature: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            logger.warn("Invalid JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            logger.warn("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            logger.warn("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            logger.warn("JWT claims string is empty: {}", ex.getMessage());
        } catch (Exception ex) {
            logger.error("Unexpected error while validating JWT: {}", ex.getMessage(), ex);
        }
        return false;
    }
}