package com.afyalink.backend.controller;

import com.afyalink.backend.dto.cases.CaseDto;
import com.afyalink.backend.dto.cases.CreateCaseRequest;
import com.afyalink.backend.dto.cases.UpdateCaseRequest;
import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.enums.CaseStatus;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.model.User;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.CaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
public class CaseController {

    private final CaseService caseService;
    private final CustomUserDetailsService customUserDetailsService;

    private Long currentUserId() {
        return customUserDetailsService.getUserIdFromUserDetails((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    private User currentUser() {
        return customUserDetailsService.getUserEntityFromUserDetails((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CaseDto>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(caseService.findAll(page, size, sortBy, direction, user.getId(), user.getRole())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CaseDto>> findById(@PathVariable Long id) {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(caseService.findById(id, user.getId(), user.getRole())));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<PageResponse<CaseDto>>> findByStatus(
            @PathVariable CaseStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(caseService.findByStatus(status, page, size, sortBy, direction, user.getId(), user.getRole())));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<CaseDto>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(caseService.search(keyword, page, size, sortBy, direction, user.getId(), user.getRole())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CaseDto>> create(@Valid @RequestBody CreateCaseRequest request) {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(caseService.create(request, user.getId(), user.getRole())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CaseDto>> update(@PathVariable Long id, @Valid @RequestBody UpdateCaseRequest request) {
        User user = currentUser();
        return ResponseEntity.ok(ApiResponse.success(caseService.update(id, request, user.getId(), user.getRole())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        User user = currentUser();
        caseService.delete(id, user.getId(), user.getRole());
        return ResponseEntity.ok(ApiResponse.success("Case deleted", null));
    }
}
