package com.afyalink.backend.controller;

import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.report.*;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.PerformanceService;
import com.afyalink.backend.service.ReassignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/performance")
@RequiredArgsConstructor
public class PerformanceController {

    private final PerformanceService performanceService;
    private final ReassignmentService reassignmentService;
    private final CustomUserDetailsService customUserDetailsService;

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserDetails)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }
        return customUserDetailsService.getUserIdFromUserDetails((UserDetails) auth.getPrincipal());
    }

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<List<PerformanceMetricsDto>>> getPerformanceMetrics(
            @RequestParam String role,
            @RequestParam(defaultValue = "week") String timeRange) {
        return ResponseEntity.ok(ApiResponse.success(performanceService.getPerformanceByRole(role, timeRange)));
    }

    @GetMapping("/supervisor-workload")
    public ResponseEntity<ApiResponse<List<SupervisorWorkloadDto>>> getSupervisorWorkload() {
        return ResponseEntity.ok(ApiResponse.success(performanceService.getSupervisorWorkload()));
    }

    @GetMapping("/details/{userId}")
    public ResponseEntity<ApiResponse<PerformanceDetailsDto>> getPerformanceDetails(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "week") String timeRange) {
        return ResponseEntity.ok(ApiResponse.success(performanceService.getPerformanceDetails(userId, timeRange)));
    }

    @PostMapping("/reassign")
    public ResponseEntity<ApiResponse<Void>> reassignSocialWorker(@Valid @RequestBody ReassignmentRequest request) {
        reassignmentService.reassignSocialWorker(currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
