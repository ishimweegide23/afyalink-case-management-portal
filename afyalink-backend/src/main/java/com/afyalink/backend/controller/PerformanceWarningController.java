package com.afyalink.backend.controller;

import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.report.CreateWarningRequest;
import com.afyalink.backend.dto.report.PerformanceWarningDto;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.PerformanceWarningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/warnings")
@RequiredArgsConstructor
public class PerformanceWarningController {

    private final PerformanceWarningService performanceWarningService;
    private final CustomUserDetailsService customUserDetailsService;

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserDetails)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }
        return customUserDetailsService.getUserIdFromUserDetails((UserDetails) auth.getPrincipal());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PerformanceWarningDto>> createWarning(@Valid @RequestBody CreateWarningRequest request) {
        return ResponseEntity.ok(ApiResponse.success(performanceWarningService.createWarning(currentUserId(), request)));
    }

    @GetMapping("/received")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<PerformanceWarningDto>>> getReceivedWarnings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean resolved) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(performanceWarningService.getReceivedWarnings(currentUserId(), pageable, resolved)));
    }

    @GetMapping("/sent")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<PerformanceWarningDto>>> getSentWarnings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(performanceWarningService.getSentWarnings(currentUserId(), pageable)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnresolvedWarningCount() {
        return ResponseEntity.ok(ApiResponse.success(performanceWarningService.getUnresolvedWarningCount(currentUserId())));
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<PerformanceWarningDto>> resolveWarning(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(performanceWarningService.resolveWarning(id, currentUserId())));
    }

    @GetMapping("/worker/{workerId}")
    public ResponseEntity<ApiResponse<List<PerformanceWarningDto>>> getWorkerWarningHistory(@PathVariable Long workerId) {
        return ResponseEntity.ok(ApiResponse.success(performanceWarningService.getWorkerWarningHistory(currentUserId(), workerId)));
    }
}
