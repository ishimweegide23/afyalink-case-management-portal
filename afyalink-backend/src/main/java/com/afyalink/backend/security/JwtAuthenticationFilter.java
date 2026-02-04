package com.afyalink.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // Allow JWT in query for document downloads (img/a tags cannot send Authorization header)
        if ((!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer "))
                && "GET".equalsIgnoreCase(request.getMethod())
                && request.getServletPath() != null
                && request.getServletPath().startsWith("/api/documents/download/")) {
            String queryToken = request.getParameter("access_token");
            if (StringUtils.hasText(queryToken)) {
                authHeader = "Bearer " + queryToken;
            }
        }

        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        try {
            if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
                String username = jwtTokenProvider.extractUsername(jwt);

                // Only set authentication if not already set
                if (StringUtils.hasText(username)
                        && SecurityContextHolder.getContext().getAuthentication() == null) {

                    UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

                    if (jwtTokenProvider.validateToken(jwt, userDetails)) {
                        UsernamePasswordAuthenticationToken authToken =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails,
                                        null,
                                        userDetails.getAuthorities()
                                );
                        authToken.setDetails(
                                new WebAuthenticationDetailsSource().buildDetails(request)
                        );
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        log.debug("Set authentication for user: {}", username);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/api/auth/login") ||
               path.startsWith("/api/auth/register") ||
               path.startsWith("/api/auth/forgot-password") ||
               path.startsWith("/api/auth/verify-otp") ||
               path.startsWith("/api/auth/reset-password") ||
               path.startsWith("/actuator/");
    }
}
