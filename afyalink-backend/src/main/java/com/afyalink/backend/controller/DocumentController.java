package com.afyalink.backend.controller;

import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.dto.document.DocumentDto;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final CustomUserDetailsService customUserDetailsService;

    private Long currentUserId() {
        return customUserDetailsService.getUserIdFromUserDetails((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    private UserRole currentUserRole() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().isEmpty()) return null;
        String role = auth.getAuthorities().iterator().next().getAuthority();
        if (role.startsWith("ROLE_")) role = role.substring(5);
        try {
            return UserRole.valueOf(role);
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> download(@PathVariable Long id) throws IOException {
        DocumentService.DownloadPayload payload = documentService.download(id, currentUserId(), currentUserRole());
        String encoded = URLEncoder.encode(payload.fileName(), StandardCharsets.UTF_8).replace("+", "%20");
        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(payload.mimeType());
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + encoded + "\"; filename*=UTF-8''" + encoded)
                .contentType(mediaType)
                .body(payload.bytes());
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<DocumentDto>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long caseId,
            @RequestParam(required = false) Long interventionId) throws IOException {
        return ResponseEntity.ok(ApiResponse.success(
                documentService.create(caseId, interventionId, file, currentUserId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentDto>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(documentService.findById(id)));
    }

    @GetMapping("/case/{caseId}")
    public ResponseEntity<ApiResponse<PageResponse<DocumentDto>>> findByCaseId(
            @PathVariable Long caseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        return ResponseEntity.ok(ApiResponse.success(documentService.findByCaseId(caseId, page, size, sortBy, direction)));
    }

    @GetMapping("/intervention/{interventionId}")
    public ResponseEntity<ApiResponse<PageResponse<DocumentDto>>> findByInterventionId(
            @PathVariable Long interventionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        return ResponseEntity.ok(ApiResponse.success(documentService.findByInterventionId(interventionId, page, size, sortBy, direction)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<DocumentDto>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        return ResponseEntity.ok(ApiResponse.success(documentService.search(keyword, page, size, sortBy, direction)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        documentService.softDelete(id, currentUserId());
        return ResponseEntity.ok(ApiResponse.success("Document deleted", null));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<DocumentDto>> setArchived(
            @PathVariable Long id,
            @RequestParam boolean archived) {
        return ResponseEntity.ok(ApiResponse.success(documentService.setArchived(id, archived, currentUserId())));
    }
}
