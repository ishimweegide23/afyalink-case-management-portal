package com.afyalink.backend.controller;

import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.dto.common.AuditLogDto;
import com.afyalink.backend.dto.common.AuditStatsDto;
import com.afyalink.backend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AuditLogDto>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.findAllDtos(page, size, sortBy, direction, action, entityType, userId, startDate, endDate)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogDto>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.searchDtos(keyword, page, size, sortBy, direction, action, entityType, userId, startDate, endDate)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AuditStatsDto>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getStats()));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportLogs(
            @RequestParam(defaultValue = "excel") String format,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) throws IOException {
        
        byte[] data = auditLogService.exportLogs(format, keyword, action, entityType, userId, startDate, endDate);
        
        String filename = "audit_logs." + (format.equalsIgnoreCase("excel") ? "xlsx" : format.toLowerCase());
        MediaType mediaType;
        if ("pdf".equalsIgnoreCase(format)) {
            mediaType = MediaType.APPLICATION_PDF;
        } else if ("csv".equalsIgnoreCase(format)) {
            mediaType = MediaType.parseMediaType("text/csv");
        } else {
            mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(data);
    }
}
