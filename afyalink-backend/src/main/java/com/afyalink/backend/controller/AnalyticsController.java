package com.afyalink.backend.controller;

import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.report.*;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.util.DateRangeValidator;
import com.afyalink.backend.exception.BadRequestException;
import com.afyalink.backend.exception.ForbiddenException;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.UserRepository;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.AnalyticsService;
import com.afyalink.backend.service.DistrictScopeService;
import com.afyalink.backend.service.OrganizationReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final OrganizationReportService organizationReportService;
    private final CustomUserDetailsService customUserDetailsService;
    private final UserRepository userRepository;
    private final DistrictScopeService districtScopeService;

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserDetails)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }
        return customUserDetailsService.getUserIdFromUserDetails((UserDetails) auth.getPrincipal());
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserDetails)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }
        return customUserDetailsService.getUserEntityFromUserDetails((UserDetails) auth.getPrincipal());
    }

    private static LocalDate[] periodToDates(String period, LocalDate baseDate) {
        LocalDate today = LocalDate.now();
        LocalDate end = baseDate != null ? (baseDate.isAfter(today) ? today : baseDate) : today;
        if (period == null || period.isBlank()) return new LocalDate[]{end.minusDays(30), end};
        return switch (period.toUpperCase()) {
            case "DAILY" -> new LocalDate[]{end, end};
            case "WEEKLY" -> {
                int daysFromMonday = end.getDayOfWeek().getValue() - 1;
                yield new LocalDate[]{end.minusDays(daysFromMonday), end};
            }
            case "MONTHLY" -> new LocalDate[]{end.withDayOfMonth(1), end};
            case "YEARLY" -> new LocalDate[]{LocalDate.of(end.getYear(), 1, 1), end};
            default -> new LocalDate[]{end.minusDays(30), end};
        };
    }

    @GetMapping("/my-summary")
    public ResponseEntity<ApiResponse<SocialWorkerSummaryDto>> getMySummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String period) {
        if (startDate == null || endDate == null) {
            LocalDate[] range = periodToDates(period, endDate);
            startDate = range[0];
            endDate = range[1];
        }
        validateDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getSocialWorkerSummary(currentUserId(), startDate, endDate)));
    }

    @GetMapping("/team-summary")
    public ResponseEntity<ApiResponse<TeamSummaryDto>> getTeamSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String period) {
        if (startDate == null || endDate == null) {
            LocalDate[] range = periodToDates(period, endDate);
            startDate = range[0];
            endDate = range[1];
        }
        validateDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getTeamSummary(currentUserId(), startDate, endDate)));
    }

    @GetMapping("/org-summary")
    public ResponseEntity<ApiResponse<OrgSummaryDto>> getOrgSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String period) {
        if (startDate == null || endDate == null) {
            LocalDate[] range = periodToDates(period, endDate);
            startDate = range[0];
            endDate = range[1];
        }
        validateDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getOrgSummary(startDate, endDate)));
    }

    @GetMapping("/worker/{workerId}")
    public ResponseEntity<ApiResponse<SocialWorkerSummaryDto>> getWorkerSummary(
            @PathVariable Long workerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String period) {
        if (startDate == null || endDate == null) {
            LocalDate[] range = periodToDates(period, endDate);
            startDate = range[0];
            endDate = range[1];
        }
        validateDateRange(startDate, endDate);
        User me = currentUser();
        if (me.getRole() == UserRole.SOCIAL_WORKER && !workerId.equals(me.getId())) {
            throw new ForbiddenException("You can only view your own worker analytics.");
        }
        if (me.getRole() == UserRole.SUPERVISOR) {
            User worker = userRepository.findById(workerId)
                    .orElseThrow(() -> new com.afyalink.backend.exception.ResourceNotFoundException("User", "id", workerId));
            if (worker.getSupervisor() == null || !worker.getSupervisor().getId().equals(me.getId())) {
                throw new ForbiddenException("You can only view analytics for social workers on your team.");
            }
            String supDistrict = districtScopeService.resolveSupervisorDistrict(me);
            if (supDistrict != null && !districtScopeService.matchesDistrict(worker.getDistrict(), supDistrict)) {
                throw new ForbiddenException("This worker is not in your assigned district.");
            }
        }
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getSocialWorkerSummary(workerId, startDate, endDate)));
    }

    @GetMapping("/beneficiary/{beneficiaryId}")
    public ResponseEntity<ApiResponse<BeneficiaryJourneyDto>> getBeneficiaryJourney(@PathVariable Long beneficiaryId) {
        User me = currentUser();
        return ResponseEntity.ok(ApiResponse.success(
                analyticsService.getBeneficiaryJourney(beneficiaryId, me.getId(), me.getRole())));
    }

    @GetMapping("/underperformers")
    public ResponseEntity<ApiResponse<List<UnderperformerFlagDto>>> getUnderperformers() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.autoDetectUnderperformers(currentUserId())));
    }

    @GetMapping("/district-performance")
    public ResponseEntity<ApiResponse<DistrictPerformanceSummaryDto>> getDistrictPerformance(
            @RequestParam String district,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String period) {
        if (startDate == null || endDate == null) {
            LocalDate[] range = periodToDates(period, endDate);
            startDate = range[0];
            endDate = range[1];
        }
        validateDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getDistrictPerformance(district, startDate, endDate)));
    }

    @GetMapping("/team-realtime-stats")
    public ResponseEntity<ApiResponse<TeamRealTimeStatsDto>> getTeamRealTimeStats() {
        User me = currentUser();
        if (me.getRole() != UserRole.SUPERVISOR) {
            throw new ForbiddenException("Only supervisors can access team real-time stats");
        }
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getTeamRealTimeStats(me.getId())));
    }

    @GetMapping("/districts")
    public ResponseEntity<ApiResponse<List<String>>> getAllDistricts() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getAllDistricts()));
    }

    /** Admin: beneficiary recovery distribution and trend for organization reporting. */
    @GetMapping("/org-recovery-progress")
    public ResponseEntity<ApiResponse<OrganizationReportDataDto>> getOrgRecoveryProgress(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (currentUser().getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Admin only");
        }
        validateDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(
                organizationReportService.buildOrganizationReportData(startDate, endDate)));
    }

    @GetMapping("/case-trends")
    public ResponseEntity<ApiResponse<List<CaseTrendDto>>> getCaseTrends(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (currentUser().getRole() != UserRole.ADMIN) throw new ForbiddenException("Admin only");
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        LocalDate[] range = periodToDates(period, end);
        LocalDate start = range[0];
        validateDateRange(start, end);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getCaseTrends(period, end)));
    }

    @GetMapping("/monthly-breakdown")
    public ResponseEntity<ApiResponse<List<MonthlyBreakdownDto>>> getMonthlyBreakdown(
            @RequestParam int year,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (currentUser().getRole() != UserRole.ADMIN) throw new ForbiddenException("Admin only");
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        if (year > LocalDate.now().getYear()) {
            throw new BadRequestException("Cannot query future years. Please select " + LocalDate.now().getYear() + " or earlier.");
        }
        if (year < DateRangeValidator.SYSTEM_START_DATE.getYear()) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        validateDateRange(LocalDate.of(year, 1, 1), end);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getMonthlyBreakdown(year, end)));
    }

    @GetMapping("/intervention-success")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getInterventionSuccessByType(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (currentUser().getRole() != UserRole.ADMIN) throw new ForbiddenException("Admin only");
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        LocalDate[] range = periodToDates(period, end);
        validateDateRange(range[0], range[1]);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getInterventionSuccessByType(period, end)));
    }

    @GetMapping("/cases-by-priority")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCasesByPriority(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (currentUser().getRole() != UserRole.ADMIN) throw new ForbiddenException("Admin only");
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        validateDateRange(end.minusYears(1), end);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getCasesByPriority(end)));
    }

    @GetMapping("/cases-by-type")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCasesByType(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (currentUser().getRole() != UserRole.ADMIN) throw new ForbiddenException("Admin only");
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        LocalDate[] range = periodToDates(period, end);
        validateDateRange(range[0], range[1]);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getCasesByType(period, end)));
    }

    @GetMapping("/districts-performance")
    public ResponseEntity<ApiResponse<List<DistrictPerformanceSummaryDto>>> getAllDistrictsPerformance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String period) {
        if (currentUser().getRole() != UserRole.ADMIN) throw new ForbiddenException("Admin only");
        if (startDate == null || endDate == null) {
            LocalDate[] range = periodToDates(period, endDate);
            startDate = range[0];
            endDate = range[1];
        }
        validateDateRange(startDate, endDate);
        List<String> districts = analyticsService.getAllDistricts();
        List<DistrictPerformanceSummaryDto> results = new ArrayList<>();
        for (String district : districts) {
            if (district == null || district.isBlank()) continue;
            try {
                results.add(analyticsService.getDistrictPerformance(district, startDate, endDate));
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/supervisor/{supervisorId}/workers")
    public ResponseEntity<ApiResponse<List<SocialWorkerSummaryDto>>> getWorkersUnderSupervisor(
            @PathVariable Long supervisorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String period) {
        if (currentUser().getRole() != UserRole.ADMIN) throw new ForbiddenException("Admin only");
        if (startDate == null || endDate == null) {
            LocalDate[] range = periodToDates(period, endDate);
            startDate = range[0];
            endDate = range[1];
        }
        validateDateRange(startDate, endDate);
        
        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new com.afyalink.backend.exception.ResourceNotFoundException("Supervisor", "id", supervisorId));
        List<User> workers = districtScopeService.workersInSupervisorDistrict(supervisor);
        
        List<SocialWorkerSummaryDto> summaries = new ArrayList<>();
        for (User w : workers) {
            try {
                summaries.add(analyticsService.getSocialWorkerSummary(w.getId(), startDate, endDate));
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(ApiResponse.success(summaries));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAnalytics(@RequestParam(required = false) String period) {
        if (currentUser().getRole() != UserRole.ADMIN) throw new ForbiddenException("Admin only");
        byte[] file = analyticsService.exportAnalyticsToExcel(period);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "analytics.xlsx");
        return ResponseEntity.ok().headers(headers).body(file);
    }

    /**
     * Supervisor: export selected team analytics to Excel.
     * UI sends: period + startDate + endDate.
     */
    @GetMapping("/team-export")
    public ResponseEntity<byte[]> exportTeamAnalytics(
            @RequestParam(required = false) String period,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        User me = currentUser();
        if (me.getRole() != UserRole.SUPERVISOR && me.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Supervisor only");
        }
        validateDateRange(startDate, endDate);
        byte[] file = analyticsService.exportTeamAnalyticsToExcel(me.getId(), period, startDate, endDate);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "team_analytics.xlsx");
        return ResponseEntity.ok().headers(headers).body(file);
    }

    private void validateDateRange(LocalDate start, LocalDate end) {
        // Throws only for invalid/future-start ranges; pre-system periods return empty data from services
        DateRangeValidator.validate(start, end);
    }
}
