package com.afyalink.backend.controller;

import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.report.*;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.ExportService;
import com.afyalink.backend.service.ReportDataService;
import com.afyalink.backend.service.ReportManagementService;
import com.afyalink.backend.service.ReportService;
import com.afyalink.backend.service.OrganizationReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ReportManagementService reportManagementService;
    private final ReportDataService reportDataService;
    private final ExportService exportService;
    private final CustomUserDetailsService customUserDetailsService;
    private final OrganizationReportService organizationReportService;

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserDetails)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }
        return customUserDetailsService.getUserIdFromUserDetails((UserDetails) auth.getPrincipal());
    }

    private UserRole currentUserRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().isEmpty()) return null;
        String role = auth.getAuthorities().iterator().next().getAuthority();
        if (role.startsWith("ROLE_")) role = role.substring(5);
        try {
            return UserRole.valueOf(role);
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ReportSummaryDto>> getSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String periodLabel) {
        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = toDate.atTime(LocalTime.MAX);
        return ResponseEntity.ok(ApiResponse.success(reportService.getSummary(currentUserId(), from, to, periodLabel)));
    }

    @GetMapping("/beneficiaries")
    public ResponseEntity<ApiResponse<List<BeneficiaryProgressDto>>> getBeneficiaries(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = toDate.atTime(LocalTime.MAX);
        return ResponseEntity.ok(ApiResponse.success(reportService.getBeneficiariesWithProgress(currentUserId(), from, to)));
    }

    @GetMapping("/interventions")
    public ResponseEntity<ApiResponse<List<ReportInterventionDto>>> getInterventions(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = toDate.atTime(LocalTime.MAX);
        return ResponseEntity.ok(ApiResponse.success(reportService.getInterventions(currentUserId(), from, to)));
    }

    @GetMapping("/diary")
    public ResponseEntity<ApiResponse<List<ReportDiaryItemDto>>> getDiary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = toDate.atTime(LocalTime.MAX);
        return ResponseEntity.ok(ApiResponse.success(reportService.getDiary(currentUserId(), from, to)));
    }

    @GetMapping("/completed-support")
    public ResponseEntity<ApiResponse<List<ReportCompletedCaseDto>>> getCompletedSupport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = toDate.atTime(LocalTime.MAX);
        return ResponseEntity.ok(ApiResponse.success(reportService.getCompletedSupport(currentUserId(), from, to)));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<ReportAnalyticsDto>> getAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getAnalytics(currentUserId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReportDto>> createReport(@Valid @RequestBody CreateReportRequest request) {
        return ResponseEntity.ok(ApiResponse.success(reportManagementService.createReport(currentUserId(), request)));
    }

    /** Supervisor: create a draft team consolidated report (metrics + worker report excerpts). Finalize and submit to notify admins. */
    @PostMapping("/supervisor-team")
    public ResponseEntity<ApiResponse<ReportDto>> createSupervisorTeamReport(
            @Valid @RequestBody CreateSupervisorTeamReportRequest request) {
        if (currentUserRole() != UserRole.SUPERVISOR) {
            throw new org.springframework.security.access.AccessDeniedException("Only supervisors can create team consolidated reports");
        }
        return ResponseEntity.ok(ApiResponse.success(
                reportManagementService.createSupervisorTeamReport(currentUserId(), request)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<ReportDto>>> getMyReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String reportType,
            @RequestParam(required = false) String status) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(reportManagementService.getMyReports(currentUserId(), pageable, reportType, status)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReportDto>> updateReport(@PathVariable Long id, @RequestBody(required = false) UpdateReportRequest body) {
        return ResponseEntity.ok(ApiResponse.success(reportManagementService.updateReport(id, currentUserId(), body)));
    }

    @PatchMapping("/{id}/finalize")
    public ResponseEntity<ApiResponse<ReportDto>> finalizeReport(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(reportManagementService.finalizeReport(id, currentUserId())));
    }

    @PatchMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<ReportDto>> submitReport(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(reportManagementService.submitReport(id, currentUserId())));
    }

    @PostMapping("/{id}/feedback")
    public ResponseEntity<ApiResponse<ReportDto>> provideFeedback(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        String status = body.get("status");
        String feedback = body.get("feedback");
        return ResponseEntity.ok(ApiResponse.success(reportManagementService.provideFeedback(id, currentUserId(), status, feedback)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReport(@PathVariable Long id) {
        reportManagementService.deleteReport(id, currentUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/team")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<ReportDto>>> getTeamReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStart,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEnd,
            @RequestParam(required = false) Long workerId,
            @RequestParam(required = false) String reportType,
            @RequestParam(required = false) String status) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(reportManagementService.getTeamReports(currentUserId(), pageable, periodStart, periodEnd, workerId, reportType, status)));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<ReportDto>>> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String reportType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(reportManagementService.getAllReports(pageable, reportType, status, userId, from, to)));
    }

    // ---------- Admin: must be before /{id} so "admin" is not matched as id ----------
    @GetMapping("/admin/submission-status")
    public ResponseEntity<ApiResponse<OrgReportPeriodSummaryDto>> getSubmissionStatus(
            @RequestParam(required = false, defaultValue = "WEEKLY") String periodType,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStart,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEnd) {
        if (currentUserRole() != UserRole.ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Admin only");
        }
        return ResponseEntity.ok(ApiResponse.success(
                reportManagementService.getSubmissionStatus(periodType, periodStart, periodEnd)));
    }

    @PostMapping("/admin/combined")
    public ResponseEntity<ApiResponse<ReportDto>> createCombinedReport(@RequestBody CreateOrgReportRequest request) {
        Long userId = currentUserId();
        ReportDto report = reportManagementService.createOrgReport(userId, request);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PostMapping("/organization")
    public ResponseEntity<ApiResponse<ReportDto>> createOrganizationReport(@RequestBody CreateOrgReportRequest request) {
        Long userId = currentUserId();
        ReportDto report = reportManagementService.createOrgReport(userId, request);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/admin/organization-report-data")
    public ResponseEntity<ApiResponse<OrganizationReportDataDto>> getOrganizationReportData(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStart,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEnd,
            @RequestParam(required = false) String district) {
        if (currentUserRole() != UserRole.ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Admin only");
        }
        return ResponseEntity.ok(ApiResponse.success(
                organizationReportService.buildOrganizationReportData(periodStart, periodEnd, district)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReportDataDto>> getReportWithFullData(@PathVariable Long id) {
        if (!reportManagementService.canAccessReport(id, currentUserId(), currentUserRole())) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot access this report");
        }
        return ResponseEntity.ok(ApiResponse.success(reportDataService.buildReportData(id)));
    }

    @GetMapping("/{id}/export/pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable Long id) throws java.io.IOException {
        if (!reportManagementService.canAccessReport(id, currentUserId(), currentUserRole())) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot access this report");
        }
        return exportService.exportToPdf(id, currentUserId());
    }

    @GetMapping("/{id}/export/excel")
    public ResponseEntity<byte[]> exportExcel(@PathVariable Long id) throws java.io.IOException {
        if (!reportManagementService.canAccessReport(id, currentUserId(), currentUserRole())) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot access this report");
        }
        return exportService.exportToExcel(id, currentUserId());
    }

    @GetMapping("/{id}/export/word")
    public ResponseEntity<byte[]> exportWord(@PathVariable Long id) throws java.io.IOException {
        if (!reportManagementService.canAccessReport(id, currentUserId(), currentUserRole())) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot access this report");
        }
        return exportService.exportToWord(id, currentUserId());
    }
}
