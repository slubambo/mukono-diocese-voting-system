package com.mukono.voting.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

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
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
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
            return (String) claims.get("username");
        } catch (Exception ex) {
            return null;
        }
    }

    private Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .setSigningKey(jwtSecret.getBytes(StandardCharsets.UTF_8))
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception ex) {
            return null;
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String username = getUsernameFromToken(jwt);
                if (StringUtils.hasText(username)) {
                    UserPrincipal userPrincipal = (UserPrincipal) customUserDetailsService.loadUserByUsername(username);
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userPrincipal,
                            null,
                            userPrincipal.getAuthorities()
                    );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    // Attempt voter token authentication using claims
                    Claims claims = parseClaims(jwt);
                    if (claims != null) {
                        Object rolesObj = claims.get("roles");
                        String roles = rolesObj != null ? String.valueOf(rolesObj) : null;
                        if (roles != null && roles.contains("ROLE_VOTER")) {
                            Long personId = claims.get("personId", Number.class) != null ?
                                    claims.get("personId", Number.class).longValue() : null;
                            Long electionId = claims.get("electionId", Number.class) != null ?
                                    claims.get("electionId", Number.class).longValue() : null;
                            Long votingPeriodId = claims.get("votingPeriodId", Number.class) != null ?
                                    claims.get("votingPeriodId", Number.class).longValue() : null;
                            Long codeId = claims.get("codeId", Number.class) != null ?
                                    claims.get("codeId", Number.class).longValue() : null;

                            VoterPrincipal voterPrincipal = new VoterPrincipal(personId, electionId, votingPeriodId, codeId);
                            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                    voterPrincipal,
                                    null,
                                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_VOTER"))
                            );
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        }
                    }
                }
            }
        } catch (Exception ex) {
            // swallow and continue
        }
        filterChain.doFilter(request, response);
    }
}