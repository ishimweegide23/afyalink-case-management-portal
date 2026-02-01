package com.afyalink.backend.controller;

import com.afyalink.backend.dto.cases.CaseEntryDto;
import com.afyalink.backend.dto.cases.CreateCaseEntryRequest;
import com.afyalink.backend.dto.cases.UpdateCaseEntryRequest;
import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.model.User;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.CaseEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cases/{caseId}/entries")
@RequiredArgsConstructor
public class CaseEntryController {

    private final CaseEntryService caseEntryService;
    private final CustomUserDetailsService customUserDetailsService;

    private Long currentUserId() {
        return customUserDetailsService.getUserIdFromUserDetails((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    private User currentUser() {
        return customUserDetailsService.getUserEntityFromUserDetails(
                (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CaseEntryDto>>> findByCaseId(
            @PathVariable Long caseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        User u = currentUser();
        return ResponseEntity.ok(ApiResponse.success(
                caseEntryService.findByCaseId(caseId, page, size, sortBy, direction, u.getId(), u.getRole())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CaseEntryDto>> findById(@PathVariable Long caseId, @PathVariable Long id) {
        User u = currentUser();
        return ResponseEntity.ok(ApiResponse.success(caseEntryService.findById(caseId, id, u.getId(), u.getRole())));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<CaseEntryDto>>> search(
            @PathVariable Long caseId,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        User u = currentUser();
        return ResponseEntity.ok(ApiResponse.success(
                caseEntryService.searchByCaseId(caseId, keyword, page, size, sortBy, direction, u.getId(), u.getRole())));
    }

    @GetMapping("/overdue-tasks")
    public ResponseEntity<ApiResponse<List<CaseEntryDto>>> findOverdueTasks(@PathVariable Long caseId) {
        User u = currentUser();
        return ResponseEntity.ok(ApiResponse.success(caseEntryService.findOverdueTasks(caseId, u.getId(), u.getRole())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CaseEntryDto>> create(
            @PathVariable Long caseId,
            @Valid @RequestBody CreateCaseEntryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(caseEntryService.create(caseId, request, currentUserId())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CaseEntryDto>> update(
            @PathVariable Long caseId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCaseEntryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(caseEntryService.update(id, request, currentUserId())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long caseId, @PathVariable Long id) {
        caseEntryService.delete(id, currentUserId());
        return ResponseEntity.ok(ApiResponse.success("Case entry deleted", null));
    }
}
