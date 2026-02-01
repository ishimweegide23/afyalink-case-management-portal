package com.afyalink.backend.controller;

import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.dto.intervention.CreateInterventionRequest;
import com.afyalink.backend.dto.intervention.InterventionDto;
import com.afyalink.backend.dto.intervention.InterventionStaffDto;
import com.afyalink.backend.dto.intervention.InterventionStatsDto;
import com.afyalink.backend.dto.intervention.UpdateInterventionRequest;
import com.afyalink.backend.enums.InterventionStatus;
import com.afyalink.backend.enums.InterventionType;
import com.afyalink.backend.model.User;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.InterventionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class InterventionController {

    private final InterventionService interventionService;
    private final CustomUserDetailsService customUserDetailsService;

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserDetails)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }
        return customUserDetailsService.getUserIdFromUserDetails((UserDetails) auth.getPrincipal());
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return customUserDetailsService.getUserEntityFromUserDetails((UserDetails) auth.getPrincipal());
    }

    @GetMapping("/api/interventions")
    public ResponseEntity<ApiResponse<PageResponse<InterventionDto>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction,
            @RequestParam(required = false) InterventionStatus status,
            @RequestParam(required = false) InterventionType type,
            @RequestParam(required = false) String keyword) {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(
                interventionService.findAll(page, size, sortBy, direction, status, type, keyword, user.getId(), user.getRole())));
    }

    @GetMapping("/api/interventions/stats")
    public ResponseEntity<ApiResponse<InterventionStatsDto>> getStats() {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(interventionService.getStats(user.getId(), user.getRole())));
    }

    @GetMapping("/api/interventions/my-schedule")
    public ResponseEntity<ApiResponse<PageResponse<InterventionDto>>> getMySchedule(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false) InterventionStatus status) {
        Long userId = currentUserId();
        LocalDateTime from = fromDate != null && !fromDate.isBlank()
                ? LocalDate.parse(fromDate).atStartOfDay() : null;
        LocalDateTime to = toDate != null && !toDate.isBlank()
                ? LocalDate.parse(toDate).atTime(LocalTime.MAX) : null;
        return ResponseEntity.ok(ApiResponse.success(
                interventionService.findMySchedule(userId, page, size, from, to, status)));
    }

    @GetMapping("/api/interventions/{id}")
    public ResponseEntity<ApiResponse<InterventionDto>> findById(@PathVariable Long id) {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(interventionService.findById(id, user.getId(), user.getRole())));
    }

    @GetMapping("/api/interventions/{id}/staff")
    public ResponseEntity<ApiResponse<List<InterventionStaffDto>>> getStaff(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(interventionService.getStaff(id)));
    }

    @GetMapping("/api/interventions/status/{status}")
    public ResponseEntity<ApiResponse<PageResponse<InterventionDto>>> findByStatus(
            @PathVariable InterventionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(interventionService.findByStatus(status, page, size, sortBy, direction, user.getId(), user.getRole())));
    }

    @GetMapping("/api/interventions/type/{type}")
    public ResponseEntity<ApiResponse<PageResponse<InterventionDto>>> findByType(
            @PathVariable InterventionType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(interventionService.findByType(type, page, size, sortBy, direction, user.getId(), user.getRole())));
    }

    @GetMapping("/api/interventions/search")
    public ResponseEntity<ApiResponse<PageResponse<InterventionDto>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(interventionService.search(keyword, page, size, sortBy, direction, user.getId(), user.getRole())));
    }

    @GetMapping("/api/cases/{caseId}/interventions")
    public ResponseEntity<ApiResponse<PageResponse<InterventionDto>>> findByCaseId(
            @PathVariable Long caseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(interventionService.findByCaseId(caseId, page, size, sortBy, direction, user.getId(), user.getRole())));
    }

    @GetMapping("/api/cases/{caseId}/interventions/search")
    public ResponseEntity<ApiResponse<PageResponse<InterventionDto>>> searchByCaseId(
            @PathVariable Long caseId,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(interventionService.searchByCaseId(caseId, keyword, page, size, sortBy, direction, user.getId(), user.getRole())));
    }

    @PostMapping("/api/interventions")
    public ResponseEntity<ApiResponse<InterventionDto>> create(@Valid @RequestBody CreateInterventionRequest request) {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(interventionService.create(request, user.getId(), user.getRole())));
    }

    @PutMapping("/api/interventions/{id}")
    public ResponseEntity<ApiResponse<InterventionDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateInterventionRequest request) {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(interventionService.update(id, request, user.getId(), user.getRole())));
    }

    @DeleteMapping("/api/interventions/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        User user = currentUser();
        interventionService.delete(id, user.getId(), user.getRole());
        return ResponseEntity.ok(ApiResponse.success("Intervention deleted", null));
    }

    @PostMapping("/api/interventions/{interventionId}/staff")
    public ResponseEntity<ApiResponse<InterventionStaffDto>> assignStaff(
            @PathVariable Long interventionId,
            @RequestParam Long userId,
            @RequestParam(required = false) String roleInIntervention) {
        return ResponseEntity.ok(ApiResponse.success(
                interventionService.assignStaff(interventionId, userId, roleInIntervention != null ? roleInIntervention : "", currentUserId())));
    }

    @DeleteMapping("/api/interventions/{interventionId}/staff/{userId}")
    public ResponseEntity<ApiResponse<Void>> unassignStaff(
            @PathVariable Long interventionId,
            @PathVariable Long userId) {
        interventionService.unassignStaff(interventionId, userId, currentUserId());
        return ResponseEntity.ok(ApiResponse.success("Staff unassigned", null));
    }
}
