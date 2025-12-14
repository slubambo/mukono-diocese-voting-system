package com.mukono.voting.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Value("${app.jwtSecret:change_me}")
    private String jwtSecret;

    /**
     * Extract JWT token from Authorization header.
     * Expected format: Bearer <token>
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        logger.debug("Authorization header present: {}", bearerToken != null);
        if (bearerToken != null) {
            logger.debug("Authorization header value: {}", bearerToken);
        }
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            logger.debug("Extracted JWT after 'Bearer ': {}", token != null ? (token.length() > 20 ? token.substring(0, 20) + "..." : token) : null);
            return token;
        } else {
            logger.debug("Authorization header missing or does not start with 'Bearer ' prefix");
        }
        return null;
    }

    /**
     * Extract username from JWT token claims.
     */
    private String getUsernameFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(jwtSecret.getBytes(StandardCharsets.UTF_8))
                    .parseClaimsJws(token)
                    .getBody();
            String username = (String) claims.get("username");
            logger.debug("Username extracted from token claims: {}", username);
            return username;
        } catch (Exception ex) {
            logger.warn("Failed to parse claims or extract username from token: {}", ex.getMessage());
            return null;
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            logger.debug("JwtAuthenticationFilter invoked for URI: {}", request.getRequestURI());
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt)) {
                boolean valid = tokenProvider.validateToken(jwt);
                logger.debug("Token present. Validation result: {}", valid);

                if (valid) {
                    // Extract username from token
                    String username = getUsernameFromToken(jwt);

                    if (StringUtils.hasText(username)) {
                        logger.debug("Loading user details for username: {}", username);
                        // Load user details
                        UserPrincipal userPrincipal = (UserPrincipal) customUserDetailsService.loadUserByUsername(username);
                        logger.debug("UserPrincipal loaded. Authorities: {}", userPrincipal.getAuthorities());

                        // Create authentication token
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userPrincipal,
                                null,
                                userPrincipal.getAuthorities()
                        );
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        // Set authentication in security context
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        logger.debug("SecurityContext authentication set for username: {}", username);
                    } else {
                        logger.warn("Username not found in token claims. Authentication not set.");
                    }
                } else {
                    logger.warn("JWT token failed validation.");
                }
            } else {
                logger.debug("No JWT token found in request.");
            }
        } catch (Exception ex) {
            logger.error("Exception in JwtAuthenticationFilter: {}", ex.getMessage(), ex);
            // Continue filter chain; unauthorized will be handled by entry point
        }

        filterChain.doFilter(request, response);
    }
}