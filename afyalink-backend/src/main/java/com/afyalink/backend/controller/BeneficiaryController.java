package com.afyalink.backend.controller;

import com.afyalink.backend.dto.beneficiary.BeneficiaryDto;
import com.afyalink.backend.dto.beneficiary.CreateBeneficiaryRequest;
import com.afyalink.backend.dto.beneficiary.UpdateBeneficiaryRequest;
import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.enums.BeneficiaryStatus;
import com.afyalink.backend.enums.VulnerabilityLevel;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.BeneficiaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/beneficiaries")
@RequiredArgsConstructor
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;
    private final CustomUserDetailsService customUserDetailsService;

    private Long currentUserId() {
        return customUserDetailsService.getUserIdFromUserDetails(
                (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<BeneficiaryDto>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        return ResponseEntity.ok(ApiResponse.success(
                beneficiaryService.findAll(currentUserId(), page, size, sortBy, direction)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<BeneficiaryDto>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) BeneficiaryStatus status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) VulnerabilityLevel vulnerability,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        return ResponseEntity.ok(ApiResponse.success(
                beneficiaryService.search(currentUserId(), keyword, status, category, vulnerability, page, size, sortBy, direction)));
    }

    @GetMapping("/{id}/profile-picture")
    public ResponseEntity<byte[]> getProfilePicture(@PathVariable Long id) throws IOException {
        var result = beneficiaryService.getProfilePictureWithType(id, currentUserId());
        return ResponseEntity.ok()
                .contentType(result.contentType())
                .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                .body(result.data());
    }

    @PostMapping("/{id}/profile-picture")
    public ResponseEntity<ApiResponse<BeneficiaryDto>> uploadProfilePicture(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(ApiResponse.success(
                beneficiaryService.uploadProfilePicture(id, file, currentUserId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BeneficiaryDto>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(beneficiaryService.findById(id, currentUserId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BeneficiaryDto>> create(@Valid @RequestBody CreateBeneficiaryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(beneficiaryService.create(request, currentUserId())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BeneficiaryDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBeneficiaryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(beneficiaryService.update(id, request, currentUserId())));
    }
}
