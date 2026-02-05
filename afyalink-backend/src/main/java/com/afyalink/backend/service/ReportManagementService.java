package com.afyalink.backend.service;

import com.afyalink.backend.dto.report.*;
import com.afyalink.backend.enums.NotificationType;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.exception.BadRequestException;
import com.afyalink.backend.exception.ForbiddenException;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.model.Report;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.ReportRepository;
import com.afyalink.backend.repository.UserRepository;
import com.afyalink.backend.repository.CaseRepository;
import com.afyalink.backend.repository.ReportAttachmentRepository;
import com.afyalink.backend.repository.DocumentRepository;
import com.afyalink.backend.repository.BeneficiaryRepository;
import com.afyalink.backend.enums.CaseStatus;
import com.afyalink.backend.model.ReportAttachment;
import com.afyalink.backend.model.Document;
import com.afyalink.backend.util.DateRangeValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportManagementService {

    private static final List<String> REPORT_TYPES = List.of("DAILY", "WEEKLY", "MONTHLY", "YEARLY", "BENEFICIARY_COMPLETION", "CUSTOM", "ORGANIZATION", "SUPERVISOR_TEAM");
    private static final List<String> STATUSES = List.of("DRAFT", "FINAL", "SUBMITTED", "APPROVED", "NEEDS_CHANGES", "ARCHIVED");

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final CaseRepository caseRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;
    private final ReportAttachmentRepository reportAttachmentRepository;
    private final DocumentRepository documentRepository;
    private final OrganizationReportService organizationReportService;
    private final DistrictScopeService districtScopeService;

    @Transactional
    public ReportDto createReport(Long userId, CreateReportRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        validateReportRequest(request);
        String rtBlock = request.getReportType().toUpperCase().replace(" ", "_");
        if ("SUPERVISOR_TEAM".equals(rtBlock)) {
            throw new BadRequestException("Use POST /api/reports/supervisor-team to create supervisor consolidated reports");
        }
        if (request.getPeriodEnd().isBefore(request.getPeriodStart())) {
            throw new BadRequestException("Period end must be on or after period start");
        }
        if (!request.getPeriodEnd().isBefore(LocalDate.now().plusDays(1))) {
            throw new BadRequestException("Period end cannot be in the future");
        }
        if (request.getTitle().length() < 5 || request.getTitle().length() > 200) {
            throw new BadRequestException("Title must be between 5 and 200 characters");
        }

        User targetUser = request.getTargetUserId() != null ? userRepository.findById(request.getTargetUserId()).orElse(null) : null;
        com.afyalink.backend.model.Case relatedCase = request.getRelatedCaseId() != null ? caseRepository.getReferenceById(request.getRelatedCaseId()) : null;

        Report report = Report.builder()
                .title(request.getTitle())
                .reportType(request.getReportType().toUpperCase().replace(" ", "_"))
                .periodStart(request.getPeriodStart())
                .periodEnd(request.getPeriodEnd())
                .narrative(request.getNarrative() != null ? request.getNarrative() : "")
                .status("DRAFT")
                .generatedBy(user)
                .targetUser(targetUser)
                .relatedCase(relatedCase)
                .location(request.getLocation())
                .build();
        report = reportRepository.save(report);

        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            int attachmentCount = 0;
            int photoCount = 0;
            for (AttachmentRequestDto attReq : request.getAttachments()) {
                Document doc = documentRepository.findById(attReq.getDocumentId()).orElse(null);
                if (doc != null) {
                    ReportAttachment att = ReportAttachment.builder()
                            .report(report)
                            .document(doc)
                            .caption(attReq.getCaption())
                            .category(attReq.getCategory() != null ? attReq.getCategory() : "OTHER")
                            .displayOrder(attReq.getDisplayOrder() != null ? attReq.getDisplayOrder() : 0)
                            .build();
                    reportAttachmentRepository.save(att);
                    attachmentCount++;
                    if ("PHOTO".equalsIgnoreCase(attReq.getCategory()) || "IMAGE".equalsIgnoreCase(attReq.getCategory())) {
                        photoCount++;
                    }
                }
            }
            report.setAttachmentCount(attachmentCount);
            report.setPhotoCount(photoCount);
            report = reportRepository.save(report);
        }

        return toReportDto(report);
    }

    /**
     * Supervisor-only: draft report aggregating team metrics and excerpts from workers' submitted reports in the period.
     * Submit via finalize + submit to notify admins (see {@link #submitReport}).
     */
    @Transactional
    public ReportDto createSupervisorTeamReport(Long supervisorId, CreateSupervisorTeamReportRequest req) {
        User sup = userRepository.findById(supervisorId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (sup.getRole() != UserRole.SUPERVISOR) {
            throw new ForbiddenException("Only supervisors can create team consolidated reports");
        }
        if (req.getPeriodEnd().isBefore(req.getPeriodStart())) {
            throw new BadRequestException("Period end must be on or after period start");
        }
        if (!req.getPeriodEnd().isBefore(LocalDate.now().plusDays(1))) {
            throw new BadRequestException("Period end cannot be in the future");
        }
        List<User> workers = districtScopeService.workersInSupervisorDistrict(sup);
        TeamSummaryDto team = analyticsService.getTeamSummary(supervisorId, req.getPeriodStart(), req.getPeriodEnd());
        String narrative = buildSupervisorTeamNarrative(sup, team, workers, req);

        String title;
        if (req.getTitle() != null && !req.getTitle().isBlank()) {
            title = req.getTitle().trim();
        } else {
            DateTimeFormatter df = DateTimeFormatter.ofPattern("d MMM yyyy");
            title = "Team consolidated report – " + req.getPeriodStart().format(df) + " to " + req.getPeriodEnd().format(df);
        }
        if (title.length() < 5 || title.length() > 200) {
            throw new BadRequestException("Title must be between 5 and 200 characters");
        }

        Report report = Report.builder()
                .title(title)
                .reportType("SUPERVISOR_TEAM")
                .periodStart(req.getPeriodStart())
                .periodEnd(req.getPeriodEnd())
                .narrative(narrative)
                .status("DRAFT")
                .generatedBy(sup)
                .targetUser(null)
                .relatedCase(null)
                .build();
        report = reportRepository.save(report);
        return toReportDto(report);
    }

    private String buildSupervisorTeamNarrative(User supervisor, TeamSummaryDto team, List<User> workers, CreateSupervisorTeamReportRequest req) {
        StringBuilder sb = new StringBuilder();
        
        if (!workers.isEmpty()) {
            List<Long> workerIds = workers.stream().map(User::getId).toList();
            Page<Report> overlap = reportRepository.findByGeneratedBy_IdInAndPeriodBetween(
                    workerIds, req.getPeriodStart(), req.getPeriodEnd(), PageRequest.of(0, 200));
            List<Report> approved = overlap.getContent().stream()
                    .filter(r -> "APPROVED".equals(r.getStatus()) && !"SUPERVISOR_TEAM".equals(r.getReportType()))
                    .sorted(Comparator.comparing((Report r) -> r.getGeneratedBy().getFullName()).thenComparing(Report::getPeriodStart))
                    .toList();
            if (!approved.isEmpty()) {
                for (int i = 0; i < approved.size(); i++) {
                    Report r = approved.get(i);
                    sb.append(r.getGeneratedBy().getFullName()).append(": ").append(r.getNarrative() != null ? r.getNarrative() : "");
                    if (i < approved.size() - 1) {
                        sb.append("\n--------------------------------------------------\n");
                    }
                }
            } else {
                sb.append("No approved worker reports found for this period.");
            }
        } else {
            sb.append("No social workers assigned to team.");
        }

        if (req.getAdditionalNotes() != null && !req.getAdditionalNotes().isBlank()) {
            sb.append("\n\nSupervisor Notes:\n").append(req.getAdditionalNotes().trim());
        }
        return sb.toString();
    }

    @Transactional
    public ReportDto updateReport(Long reportId, Long userId, UpdateReportRequest req) {
        Report report = reportRepository.findById(reportId).orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        User editor = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        boolean owner = report.getGeneratedBy().getId().equals(userId);
        boolean adminOrgEdit = editor.getRole() == UserRole.ADMIN && "ORGANIZATION".equals(report.getReportType());
        if (!owner && !adminOrgEdit) {
            throw new ForbiddenException("Only the report owner can update it");
        }
        if (!owner && adminOrgEdit && !"DRAFT".equals(report.getStatus()) && !"NEEDS_CHANGES".equals(report.getStatus())) {
            throw new BadRequestException("Only draft or needs-changes organization reports can be edited");
        }
        // Reset to DRAFT if it was NEEDS_CHANGES so it can be resubmitted
        if ("NEEDS_CHANGES".equals(report.getStatus())) {
            report.setStatus("DRAFT");
        }
        if (req.getTitle() != null) {
            if (req.getTitle().length() < 5 || req.getTitle().length() > 200) throw new BadRequestException("Title must be between 5 and 200 characters");
            report.setTitle(req.getTitle());
        }
        if (req.getNarrative() != null) report.setNarrative(req.getNarrative());
        if (req.getLocation() != null) report.setLocation(req.getLocation());
        if (req.getLatitude() != null) report.setLatitude(req.getLatitude());
        if (req.getLongitude() != null) report.setLongitude(req.getLongitude());
        if (req.getReportType() != null && !req.getReportType().isBlank()) {
            String rt = req.getReportType().toUpperCase().replace(" ", "_");
            if (REPORT_TYPES.contains(rt)) report.setReportType(rt);
        }
        if (req.getPeriodStart() != null && req.getPeriodEnd() != null) {
            if (req.getPeriodEnd().isBefore(req.getPeriodStart())) throw new BadRequestException("Period end must be on or after period start");
            if (!req.getPeriodEnd().isBefore(LocalDate.now().plusDays(1))) throw new BadRequestException("Period end cannot be in the future");
            report.setPeriodStart(req.getPeriodStart());
            report.setPeriodEnd(req.getPeriodEnd());
        }

        if (req.getAttachments() != null) {
            List<ReportAttachment> existingAtts = reportAttachmentRepository.findByReportIdOrderByDisplayOrderAsc(reportId);
            reportAttachmentRepository.deleteAll(existingAtts);

            int attachmentCount = 0;
            int photoCount = 0;
            for (AttachmentRequestDto attReq : req.getAttachments()) {
                Document doc = documentRepository.findById(attReq.getDocumentId()).orElse(null);
                if (doc != null) {
                    ReportAttachment att = ReportAttachment.builder()
                            .report(report)
                            .document(doc)
                            .caption(attReq.getCaption())
                            .category(attReq.getCategory() != null ? attReq.getCategory() : "OTHER")
                            .displayOrder(attReq.getDisplayOrder() != null ? attReq.getDisplayOrder() : 0)
                            .build();
                    reportAttachmentRepository.save(att);
                    attachmentCount++;
                    if ("PHOTO".equalsIgnoreCase(attReq.getCategory()) || "IMAGE".equalsIgnoreCase(attReq.getCategory())) {
                        photoCount++;
                    }
                }
            }
            report.setAttachmentCount(attachmentCount);
            report.setPhotoCount(photoCount);
        }

        report = reportRepository.save(report);
        return toReportDto(report);
    }

    @Transactional
    public ReportDto finalizeReport(Long reportId, Long userId) {
        Report report = reportRepository.findById(reportId).orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        if (!report.getGeneratedBy().getId().equals(userId)) {
            throw new ForbiddenException("Only the report owner can finalize it");
        }
        if (!"DRAFT".equals(report.getStatus())) {
            throw new BadRequestException("Only DRAFT reports can be finalized");
        }
        if (report.getNarrative() == null || report.getNarrative().length() < 50) {
            throw new BadRequestException("Narrative must be at least 50 characters to finalize");
        }
        report.setStatus("FINAL");
        report = reportRepository.save(report);
        return toReportDto(report);
    }

    @Transactional
    public ReportDto submitReport(Long reportId, Long userId) {
        Report report = reportRepository.findById(reportId).orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        if (!report.getGeneratedBy().getId().equals(userId)) {
            throw new ForbiddenException("Only the report owner can submit it");
        }
        if (!"FINAL".equals(report.getStatus())) {
            throw new BadRequestException("Report must be FINAL to submit");
        }
        report.setStatus("SUBMITTED");
        report = reportRepository.save(report);
        User generator = report.getGeneratedBy();
        if (generator.getRole() == UserRole.SOCIAL_WORKER && generator.getSupervisor() != null) {
            String msg = generator.getFullName() + " submitted a " + report.getReportType() + " report for period " + report.getPeriodStart() + " to " + report.getPeriodEnd();
            notificationService.create(generator.getSupervisor().getId(), NotificationType.SYSTEM_ANNOUNCEMENT, "📋 New Report Submitted", msg, null, null, null, null, null, null);
        } else if (generator.getRole() == UserRole.SUPERVISOR) {
            List<User> admins = userRepository.findByRole(UserRole.ADMIN);
            String msg = "Team Report Submitted by " + generator.getFullName();
            for (User admin : admins) {
                notificationService.create(admin.getId(), NotificationType.SYSTEM_ANNOUNCEMENT, "📋 Team Report Submitted by " + generator.getFullName(), msg, null, null, null, null, null, null);
            }
        }
        return toReportDto(report);
    }

    @Transactional(readOnly = true)
    public Page<ReportDto> getMyReports(Long userId, Pageable pageable, String reportType, String status) {
        String rt = reportType != null && !reportType.isBlank() ? reportType.toUpperCase().replace(" ", "_") : null;
        String st = status != null && !status.isBlank() ? status.toUpperCase() : null;
        if (rt != null && st != null) {
            return reportRepository.findByGeneratedBy_IdAndReportTypeAndStatus(userId, rt, st, pageable).map(this::toReportDto);
        }
        if (rt != null) {
            return reportRepository.findByGeneratedBy_IdAndReportType(userId, rt, pageable).map(this::toReportDto);
        }
        if (st != null) {
            return reportRepository.findByGeneratedBy_IdAndStatus(userId, st, pageable).map(this::toReportDto);
        }
        return reportRepository.findByGeneratedBy_Id(userId, pageable).map(this::toReportDto);
    }

    @Transactional(readOnly = true)
    public Page<ReportDto> getTeamReports(Long supervisorId, Pageable pageable, LocalDate periodStart, LocalDate periodEnd, Long workerId, String reportType, String status) {
        User supervisor = userRepository.findById(supervisorId).orElseThrow();
        List<User> workers = districtScopeService.workersInSupervisorDistrict(supervisor);
        if (workers.isEmpty()) {
            return Page.empty(pageable);
        }
        List<Long> workerIds = workerId != null ? List.of(workerId) : workers.stream().map(User::getId).toList();
        if (workerId != null) {
            boolean allowed = workers.stream().anyMatch(w -> w.getId().equals(workerId));
            if (!allowed) {
                throw new ForbiddenException("Worker not in your team or not in your assigned district");
            }
        }
        String rt = reportType != null && !reportType.isBlank() ? reportType.toUpperCase().replace(" ", "_") : null;
        String st = status != null && !status.isBlank() ? status.toUpperCase() : null;
        if (rt != null && st != null) {
            return reportRepository.findByGeneratedBy_IdInAndReportTypeAndStatus(workerIds, rt, st, pageable).map(this::toReportDto);
        }
        if (rt != null) {
            return reportRepository.findByGeneratedBy_IdInAndReportType(workerIds, rt, pageable).map(this::toReportDto);
        }
        if (st != null) {
            return reportRepository.findByGeneratedBy_IdInAndStatus(workerIds, st, pageable).map(this::toReportDto);
        }
        if (periodStart != null && periodEnd != null) {
            return reportRepository.findByGeneratedBy_IdInAndPeriodBetween(workerIds, periodStart, periodEnd, pageable).map(this::toReportDto);
        }
        return reportRepository.findByGeneratedBy_IdIn(workerIds, pageable).map(this::toReportDto);
    }

    @Transactional(readOnly = true)
    public Page<ReportDto> getWorkerReports(Long supervisorId, Long workerId, Pageable pageable) {
        User supervisor = userRepository.findById(supervisorId).orElseThrow();
        List<User> workers = districtScopeService.workersInSupervisorDistrict(supervisor);
        if (!workers.stream().anyMatch(w -> w.getId().equals(workerId))) {
            throw new ForbiddenException("You do not have permission to view this worker's reports");
        }
        return reportRepository.findByGeneratedBy_Id(workerId, pageable).map(this::toReportDto);
    }

    @Transactional(readOnly = true)
    public Page<ReportDto> getAllReports(Pageable pageable, String reportType, String status, Long userId, LocalDate from, LocalDate to) {
        if (userId != null) {
            if (reportType != null && !reportType.isBlank()) {
                return reportRepository.findByGeneratedBy_IdAndReportType(userId, reportType, pageable).map(this::toReportDto);
            }
            return reportRepository.findByGeneratedBy_Id(userId, pageable).map(this::toReportDto);
        }
        if (from != null && to != null) {
            return reportRepository.findByPeriodBetween(from, to, pageable).map(this::toReportDto);
        }
        return reportRepository.findAll(pageable).map(this::toReportDto);
    }

    @Transactional
    public void deleteReport(Long reportId, Long userId) {
        Report report = reportRepository.findById(reportId).orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        if (!report.getGeneratedBy().getId().equals(userId)) {
            throw new ForbiddenException("Only the report owner can delete it");
        }
        if (!"DRAFT".equals(report.getStatus())) {
            throw new BadRequestException("Only DRAFT reports can be deleted");
        }
        reportRepository.delete(report);
    }

    @Transactional(readOnly = true)
    public Report getReportEntity(Long reportId) {
        return reportRepository.findById(reportId).orElseThrow(() -> new ResourceNotFoundException("Report not found"));
    }

    @Transactional(readOnly = true)
    public boolean canAccessReport(Long reportId, Long userId, UserRole role) {
        Report report = reportRepository.findById(reportId).orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        if (report.getGeneratedBy().getId().equals(userId)) return true;
        if (role == UserRole.ADMIN) return true;
        if (role == UserRole.SUPERVISOR && report.getGeneratedBy().getSupervisor() != null && report.getGeneratedBy().getSupervisor().getId().equals(userId)) return true;
        return false;
    }

    private void validateReportRequest(CreateReportRequest request) {
        if (request.getReportType() == null || request.getReportType().isBlank()) {
            throw new BadRequestException("Report type is required");
        }
        String rt = request.getReportType().toUpperCase().replace(" ", "_");
        if (!REPORT_TYPES.contains(rt)) {
            throw new BadRequestException("Invalid report type");
        }
    }

    /** Admin: submission status for all reporters (supervisors + social workers) in a period. */
    @Transactional(readOnly = true)
    public OrgReportPeriodSummaryDto getSubmissionStatus(String periodType, LocalDate periodStart, LocalDate periodEnd) {
        DateRangeValidator.validate(periodStart, periodEnd);
        List<User> reporters = new ArrayList<>();
        reporters.addAll(userRepository.findByRole(UserRole.SUPERVISOR));
        reporters.addAll(userRepository.findByRole(UserRole.SOCIAL_WORKER));
        Map<Long, User> uniqueById = new LinkedHashMap<>();
        for (User u : reporters) {
            if (u.isActive()) uniqueById.putIfAbsent(u.getId(), u);
        }
        reporters = new ArrayList<>(uniqueById.values());

        List<Report> allReportsInPeriod = reportRepository.findByPeriodBetween(periodStart, periodEnd, PageRequest.of(0, 10000)).getContent();
        Map<Long, List<Report>> reportsByUser = allReportsInPeriod.stream().collect(Collectors.groupingBy(r -> r.getGeneratedBy().getId()));
        List<Report> submittedInPeriod = allReportsInPeriod.stream().filter(r -> "SUBMITTED".equals(r.getStatus())).toList();

        String periodLabel = formatPeriodLabel(periodType, periodStart, periodEnd);
        List<ReportSubmissionStatusDto> statuses = reporters.stream()
                .map(u -> {
                    if (u.getRole() == UserRole.SUPERVISOR) {
                        String location = u.getUserProfile() != null ? u.getUserProfile().getDepartment() : null;
                        if (location == null || location.isBlank()) {
                            location = "UNKNOWN DISTRICT";
                        }
                        List<User> workers = userRepository.findBySupervisor(u);
                        if (workers == null) workers = List.of();
                        int workersCount = workers.size();

                        int submittedCount = 0;
                        int pendingCount = 0;
                        int missingCount = 0;
                        List<String> overdueWorkers = new ArrayList<>();
                        for (User w : workers) {
                            List<Report> reps = reportsByUser.getOrDefault(w.getId(), List.of());
                            if (reps.isEmpty()) {
                                missingCount++;
                                overdueWorkers.add(w.getFullName());
                            } else {
                                boolean hasSubmitted = reps.stream().anyMatch(r -> "SUBMITTED".equals(r.getStatus()));
                                if (hasSubmitted) {
                                    submittedCount++;
                                } else {
                                    pendingCount++;
                                    overdueWorkers.add(w.getFullName());
                                }
                            }
                        }

                        List<Report> supReports = reportsByUser.getOrDefault(u.getId(), List.of()).stream()
                                .filter(r -> "SUPERVISOR_TEAM".equals(r.getReportType()))
                                .toList();
                        String supReportStatus = "NOT_SUBMITTED";
                        if (!supReports.isEmpty()) {
                            supReportStatus = supReports.stream().anyMatch(r -> "SUBMITTED".equals(r.getStatus())) ? "SUBMITTED" : "DRAFT";
                        }

                        return ReportSubmissionStatusDto.builder()
                                .userId(u.getId())
                                .fullName(u.getFullName())
                                .email(u.getEmail())
                                .role(u.getRole() != null ? u.getRole().name() : null)
                                .submittedCount(submittedCount)
                                .pendingCount(pendingCount)
                                .missingCount(missingCount)
                                .workersCount(workersCount)
                                .location(location)
                                .overdueWorkers(overdueWorkers)
                                .status(supReportStatus)
                                .reports(supReports.stream().map(this::toReportDto).toList())
                                .build();
                    } else {
                        List<Report> reps = reportsByUser.getOrDefault(u.getId(), List.of());
                        int submittedCount = (int) reps.stream().filter(r -> "SUBMITTED".equals(r.getStatus())).count();
                        int pendingCount = (int) reps.stream().filter(r -> !"SUBMITTED".equals(r.getStatus())).count();
                        String swStatus = reps.isEmpty() ? "NOT_SUBMITTED" : (submittedCount > 0 ? "SUBMITTED" : "DRAFT");
                        return ReportSubmissionStatusDto.builder()
                                .userId(u.getId())
                                .fullName(u.getFullName())
                                .email(u.getEmail())
                                .role(u.getRole() != null ? u.getRole().name() : null)
                                .submittedCount(submittedCount)
                                .pendingCount(pendingCount)
                                .missingCount(reps.isEmpty() ? 1 : 0)
                                .status(swStatus)
                                .reports(reps.stream().map(this::toReportDto).toList())
                                .build();
                    }
                })
                .sorted(Comparator.comparing(ReportSubmissionStatusDto::getRole, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(ReportSubmissionStatusDto::getFullName, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        int totalSubmitted = submittedInPeriod.size();
        long totalBeneficiariesServed = beneficiaryRepository.count();
        double avgSuccessRate = caseRepository.findAll().stream()
                .filter(c -> c.getStatus() == CaseStatus.OPEN || c.getStatus() == CaseStatus.IN_PROGRESS)
                .mapToDouble(c -> c.getProgressPercent() != null ? c.getProgressPercent() : 0.0)
                .average().orElse(0.0);
        avgSuccessRate = Math.round(avgSuccessRate * 10.0) / 10.0;

        return OrgReportPeriodSummaryDto.builder()
                .periodType(periodType != null ? periodType.toUpperCase() : "WEEKLY")
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .periodLabel(periodLabel)
                .totalSubmittedReports(totalSubmitted)
                .totalExpectedReporters(reporters.size())
                .submissionStatuses(statuses)
                .totalBeneficiariesServed(totalBeneficiariesServed)
                .avgSuccessRate(avgSuccessRate)
                .build();
    }

    /** Admin: create a combined organization report from all submitted reports in the period. */
    @Transactional
    public ReportDto createOrgReport(Long adminUserId, CreateOrgReportRequest request) {
        User admin = userRepository.findById(adminUserId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (admin.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only admins can create organization reports");
        }
        if (request.getPeriodEnd().isBefore(request.getPeriodStart())) {
            throw new BadRequestException("Period end must be on or after period start");
        }
        DateRangeValidator.validate(request.getPeriodStart(), request.getPeriodEnd());

        // Pass district filter so org data is scoped correctly
        String districtFilter = request.getDistrict() != null && !request.getDistrict().isBlank()
                ? request.getDistrict().trim() : null;
        OrganizationReportDataDto orgData = organizationReportService.buildOrganizationReportData(
                request.getPeriodStart(), request.getPeriodEnd(), districtFilter);

        String periodType = request.getPeriodType() != null ? request.getPeriodType().toUpperCase() : "YEARLY";
        String districtSuffix = districtFilter != null ? " — " + districtFilter : "";
        String title = request.getTitle() != null && !request.getTitle().isBlank()
                ? request.getTitle()
                : switch (periodType) {
                    case "WEEKLY"  -> "Weekly Organization Report – "  + formatPeriodLabel(periodType, request.getPeriodStart(), request.getPeriodEnd()) + districtSuffix;
                    case "MONTHLY" -> "Monthly Organization Report – " + formatPeriodLabel(periodType, request.getPeriodStart(), request.getPeriodEnd()) + districtSuffix;
                    default        -> "Annual Organization Report – "  + formatPeriodLabel(periodType, request.getPeriodStart(), request.getPeriodEnd()) + districtSuffix;
                };

        // Use admin's narrative AS-IS, NO AUTO-GENERATION
        final String finalNarrative = request.getNarrative() != null ? request.getNarrative().trim() : "";

        Report orgReport = Report.builder()
                .title(title)
                .reportType("ORGANIZATION")
                .orgPeriodType(periodType)
                .periodStart(request.getPeriodStart())
                .periodEnd(request.getPeriodEnd())
                .narrative(finalNarrative)
                .status("DRAFT")
                .generatedBy(admin)
                .targetUser(null)
                .relatedCase(null)
                .location(districtFilter)
                .build();
        orgReport = reportRepository.save(orgReport);

        // Save any attachments the admin uploaded before calling this endpoint
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            int attachmentCount = 0;
            int photoCount = 0;
            for (CreateOrgReportRequest.AttachmentUploadDto attReq : request.getAttachments()) {
                if (attReq.getDocumentId() == null) continue;
                Document doc = documentRepository.findById(attReq.getDocumentId()).orElse(null);
                if (doc != null) {
                    ReportAttachment att = ReportAttachment.builder()
                            .report(orgReport)
                            .document(doc)
                            .caption(attReq.getCaption())
                            .category(attReq.getCategory() != null ? attReq.getCategory() : "OTHER")
                            .displayOrder(attReq.getDisplayOrder() != null ? attReq.getDisplayOrder() : attachmentCount)
                            .build();
                    reportAttachmentRepository.save(att);
                    attachmentCount++;
                    if ("PHOTO".equalsIgnoreCase(attReq.getCategory()) || "IMAGE".equalsIgnoreCase(attReq.getCategory())) {
                        photoCount++;
                    }
                }
            }
            orgReport.setAttachmentCount(attachmentCount);
            orgReport.setPhotoCount(photoCount);
            orgReport = reportRepository.save(orgReport);
        }

        return toReportDto(orgReport);
    }

    private static String formatPeriodLabel(String periodType, LocalDate start, LocalDate end) {
        if (periodType == null) periodType = "WEEKLY";
        DateTimeFormatter monthYear = DateTimeFormatter.ofPattern("MMMM yyyy");
        DateTimeFormatter dayMonth = DateTimeFormatter.ofPattern("d MMM yyyy");
        return switch (periodType.toUpperCase()) {
            case "MONTHLY" -> start.format(monthYear);
            case "YEARLY" -> String.valueOf(start.getYear());
            default -> "Week " + start.format(dayMonth) + " – " + end.format(dayMonth);
        };
    }

    @Transactional
    public ReportDto provideFeedback(Long reportId, Long reviewerId, String status, String feedback) {
        Report report = reportRepository.findById(reportId).orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        User reviewer = userRepository.findById(reviewerId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (reviewer.getRole() != UserRole.SUPERVISOR && reviewer.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only supervisors and admins can provide feedback");
        }
        
        if (reviewer.getRole() == UserRole.SUPERVISOR) {
            if (report.getGeneratedBy().getSupervisor() == null || !report.getGeneratedBy().getSupervisor().getId().equals(reviewerId)) {
                throw new ForbiddenException("You are not the supervisor of the report owner");
            }
        } else if (reviewer.getRole() == UserRole.ADMIN) {
            if (!"SUPERVISOR_TEAM".equals(report.getReportType())) {
                throw new ForbiddenException("Admins can only provide feedback on supervisor team reports");
            }
        }
        
        if (!"SUBMITTED".equals(report.getStatus()) && !"NEEDS_CHANGES".equals(report.getStatus())) {
            throw new BadRequestException("Can only provide feedback on SUBMITTED or NEEDS_CHANGES reports");
        }
        
        if (!"APPROVED".equals(status) && !"NEEDS_CHANGES".equals(status)) {
            throw new BadRequestException("Invalid feedback status. Must be APPROVED or NEEDS_CHANGES");
        }
        
        report.setStatus(status);
        report.setSupervisorFeedback(feedback);
        report = reportRepository.save(report);
        
        String roleName = reviewer.getRole() == UserRole.ADMIN ? "Admin" : "Supervisor";
        String msg = "Your report '" + report.getTitle() + "' has been marked as " + status + " by " + roleName + ".";
        if ("NEEDS_CHANGES".equals(status) && feedback != null && !feedback.isBlank()) {
            msg += "\n\nFeedback: " + feedback;
        }
        notificationService.create(report.getGeneratedBy().getId(), NotificationType.REPORT_FEEDBACK, "📋 Report Feedback: " + status, msg, null, null, null, null, null, null);
        
        return toReportDto(report);
    }

    public ReportDto toReportDto(Report r) {
        List<ReportAttachmentDto> attachmentDtos = new ArrayList<>();
        if (r.getId() != null) {
            List<ReportAttachment> attachments = reportAttachmentRepository.findByReportIdOrderByDisplayOrderAsc(r.getId());
            for (ReportAttachment a : attachments) {
                attachmentDtos.add(ReportAttachmentDto.builder()
                        .id(a.getId())
                        .reportId(r.getId())
                        .documentId(a.getDocument().getId())
                        .documentUrl("/api/documents/download/" + a.getDocument().getId())
                        .documentName(a.getDocument().getFileName())
                        .caption(a.getCaption())
                        .category(a.getCategory())
                        .displayOrder(a.getDisplayOrder())
                        .createdAt(a.getCreatedAt())
                        .build());
            }
        }

        return ReportDto.builder()
                .id(r.getId())
                .title(r.getTitle())
                .reportType(r.getReportType())
                .periodStart(r.getPeriodStart())
                .periodEnd(r.getPeriodEnd())
                .narrative(r.getNarrative())
                .status(r.getStatus())
                .generatedByUserId(r.getGeneratedBy().getId())
                .generatedByName(r.getGeneratedBy().getFullName())
                .generatedByRole(r.getGeneratedBy().getRole() != null ? r.getGeneratedBy().getRole().name() : null)
                .generatedByDistrict(r.getGeneratedBy().getDistrict())
                .generatedBySector(r.getGeneratedBy().getSector())
                .generatedByCell(r.getGeneratedBy().getCell())
                .generatedByVillage(r.getGeneratedBy().getVillage())
                .targetUserId(r.getTargetUser() != null ? r.getTargetUser().getId() : null)
                .targetUserName(r.getTargetUser() != null ? r.getTargetUser().getFullName() : null)
                .relatedCaseId(r.getRelatedCase() != null ? r.getRelatedCase().getId() : null)
                .relatedCaseNumber(r.getRelatedCase() != null ? r.getRelatedCase().getCaseNumber() : null)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .attachmentCount(r.getAttachmentCount())
                .photoCount(r.getPhotoCount())
                .location(r.getLocation())
                .orgPeriodType(r.getOrgPeriodType())
                .latitude(r.getLatitude())
                .longitude(r.getLongitude())
                .supervisorFeedback(r.getSupervisorFeedback())
                .attachments(attachmentDtos)
                .build();
    }
}
