package com.afyalink.backend.service;

import com.afyalink.backend.dto.report.*;
import com.afyalink.backend.enums.CaseEntryStatus;
import com.afyalink.backend.enums.CaseEntryType;
import com.afyalink.backend.enums.CaseStatus;
import com.afyalink.backend.enums.InterventionStatus;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.exception.ForbiddenException;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.util.DateRangeValidator;
import com.afyalink.backend.model.*;
import com.afyalink.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final CaseRepository caseRepository;
    private final CaseEntryRepository caseEntryRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final InterventionRepository interventionRepository;
    private final DocumentRepository documentRepository;
    private final ReportRepository reportRepository;
    private final DistrictScopeService districtScopeService;

    @Transactional(readOnly = true)
    public SocialWorkerSummaryDto getSocialWorkerSummary(Long userId, LocalDate startDate, LocalDate endDate) {
        User user = userRepository.findById(userId).orElseThrow();
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        if (start.isAfter(end)) {
            start = end;
        }

        long totalActiveCases = caseRepository.findByAssignedSocialWorkerAndStatus(user, CaseStatus.OPEN, PageRequest.of(0, 1000)).getTotalElements()
                + caseRepository.findByAssignedSocialWorkerAndStatus(user, CaseStatus.IN_PROGRESS, PageRequest.of(0, 1000)).getTotalElements();
        long newCasesInPeriod = caseRepository.countByAssignedSocialWorkerAndCreatedAtBetween(user, start, end);
        long closedCasesInPeriod = caseRepository.countByAssignedSocialWorkerAndStatusAndClosedAtBetween(user, CaseStatus.CLOSED, start, end);
        long totalBeneficiaries = beneficiaryRepository.countByAssignedSocialWorker(user);
        long newBeneficiariesInPeriod = beneficiaryRepository.countByAssignedSocialWorkerAndCreatedAtBetween(user, start, end);
        long interventionsCompleted = interventionRepository.countByWorkerAndStatusAndUpdatedAtBetween(userId, InterventionStatus.COMPLETED, start, end);
        long interventionsPlanned = interventionRepository.countByWorkerAndStatusAndCreatedAtBetween(userId, InterventionStatus.PLANNED, start, end);
        long totalInterventionsForRate = interventionRepository.findByPlannedBy(user, PageRequest.of(0, 5000)).getContent().stream()
                .filter(i -> i.getCaseRecord() != null && user.getId().equals(i.getCaseRecord().getAssignedSocialWorker() != null ? i.getCaseRecord().getAssignedSocialWorker().getId() : null))
                .count();
        double interventionCompletionRate = totalInterventionsForRate > 0 ? (interventionsCompleted * 100.0 / totalInterventionsForRate) : 0;

        List<CaseEntry> entriesInPeriod = caseEntryRepository.findByAssignedWorkerAndCreatedAtBetween(userId, start, end);
        long caseEntriesMade = entriesInPeriod.size();
        long tasksCompleted = caseEntryRepository.findByAssignedWorkerAndTypeAndStatusAndCompletedAtBetween(userId, CaseEntryType.TASK, CaseEntryStatus.COMPLETED, start, end).size();
        List<CaseEntry> overdueTasks = caseEntryRepository.findOverdueTasksByWorker(userId, CaseEntryType.TASK, CaseEntryStatus.COMPLETED, LocalDate.now());
        long overdueTasksCount = overdueTasks.size();

        List<Case> activeCases = caseRepository.findByAssignedSocialWorker(user, PageRequest.of(0, 500)).getContent().stream()
                .filter(c -> c.getStatus() == CaseStatus.OPEN || c.getStatus() == CaseStatus.IN_PROGRESS)
                .collect(Collectors.toList());
        double avgCaseProgress = activeCases.isEmpty() ? 0 : activeCases.stream()
                .mapToInt(c -> c.getProgressPercent() != null ? c.getProgressPercent() : 0)
                .average().orElse(0);

        Map<String, Long> caseProgressDistribution = new LinkedHashMap<>();
        caseProgressDistribution.put("0-25%", activeCases.stream().filter(c -> progressBucket(c) == 1).count());
        caseProgressDistribution.put("26-50%", activeCases.stream().filter(c -> progressBucket(c) == 2).count());
        caseProgressDistribution.put("51-75%", activeCases.stream().filter(c -> progressBucket(c) == 3).count());
        caseProgressDistribution.put("76-100%", activeCases.stream().filter(c -> progressBucket(c) == 4).count());

        // "Last activity" must reflect real worker activity (not only activity inside the selected reporting window).
        // This prevents returning "999 days" just because the worker had no entries in the filtered period.
        LocalDateTime lastActivityDateTime = caseEntryRepository.findMaxCreatedAtByAssignedWorkerUpTo(
                userId,
                LocalDate.now().atTime(LocalTime.MAX)
        );
        LocalDate lastActivityDate = lastActivityDateTime != null ? lastActivityDateTime.toLocalDate() : null;
        long daysSinceLastActivity = lastActivityDate == null ? 999 : ChronoUnit.DAYS.between(lastActivityDate, LocalDate.now());
        long documentsUploaded = documentRepository.countByUploadedBy_IdAndCreatedAtBetween(userId, start, end);

        String department = user.getUserProfile() != null ? user.getUserProfile().getDepartment() : null;

        List<LabelValueDto> caseProgressDist = caseProgressDistribution.entrySet().stream()
                .map(e -> LabelValueDto.builder().label(e.getKey()).value(e.getValue()).build())
                .collect(Collectors.toList());

        ChartDataDto chartData = ChartDataDto.builder()
                .progressOverTime(getCaseProgressOverTime(userId, "MONTHLY"))
                .interventionTypeDistribution(getInterventionTypeDistribution(userId, startDate, endDate))
                .dailyActivity(getDailyActivityData(userId, startDate, endDate))
                .caseStatusDistribution(List.of())
                .caseProgressDistribution(caseProgressDist)
                .build();

        return SocialWorkerSummaryDto.builder()
                .userId(user.getId())
                .workerName(user.getFullName())
                .workerEmail(user.getEmail())
                .workerRole(user.getRole() != null ? user.getRole().name() : null)
                .workerDepartment(department)
                .district(user.getDistrict())
                .sector(user.getSector())
                .cell(user.getCell())
                .village(user.getVillage())
                .totalActiveCases(totalActiveCases)
                .newCasesInPeriod(newCasesInPeriod)
                .closedCasesInPeriod(closedCasesInPeriod)
                .totalBeneficiaries(totalBeneficiaries)
                .newBeneficiariesInPeriod(newBeneficiariesInPeriod)
                .interventionsCompleted(interventionsCompleted)
                .interventionsPlanned(interventionsPlanned)
                .interventionCompletionRate(interventionCompletionRate)
                .caseEntriesMade(caseEntriesMade)
                .tasksCompleted(tasksCompleted)
                .overdueTasksCount(overdueTasksCount)
                .avgCaseProgress(avgCaseProgress)
                .caseProgressDistribution(caseProgressDistribution)
                .lastActivityDate(lastActivityDate)
                .daysSinceLastActivity(daysSinceLastActivity)
                .documentsUploaded(documentsUploaded)
                .chartData(chartData)
                .build();
    }

    private int progressBucket(Case c) {
        int p = c.getProgressPercent() != null ? c.getProgressPercent() : 0;
        if (p <= 25) return 1;
        if (p <= 50) return 2;
        if (p <= 75) return 3;
        return 4;
    }

    @Transactional(readOnly = true)
    public TeamSummaryDto getTeamSummary(Long supervisorId, LocalDate startDate, LocalDate endDate) {
        User supervisor = userRepository.findById(supervisorId).orElseThrow();
        List<User> workers = districtScopeService.workersInSupervisorDistrict(supervisor);

        List<SocialWorkerSummaryDto> memberSummaries = workers.stream()
                .map(w -> getSocialWorkerSummary(w.getId(), startDate, endDate))
                .collect(Collectors.toList());

        long teamTotalCases = memberSummaries.stream().mapToLong(SocialWorkerSummaryDto::getTotalActiveCases).sum();
        double teamAvgProgress = memberSummaries.isEmpty() ? 0 : memberSummaries.stream()
                .mapToDouble(s -> s.getAvgCaseProgress() != null ? s.getAvgCaseProgress() : 0)
                .average().orElse(0);
        double teamCompletionRate = memberSummaries.isEmpty() ? 0 : memberSummaries.stream()
                .mapToDouble(SocialWorkerSummaryDto::getInterventionCompletionRate)
                .average().orElse(0);

        SocialWorkerSummaryDto mostActiveWorker = memberSummaries.stream()
                .max(Comparator.comparingLong(SocialWorkerSummaryDto::getCaseEntriesMade))
                .orElse(null);
        SocialWorkerSummaryDto leastActiveWorker = memberSummaries.stream()
                .min(Comparator.comparingLong(SocialWorkerSummaryDto::getCaseEntriesMade))
                .orElse(null);
        List<SocialWorkerSummaryDto> workersWithNoActivity = memberSummaries.stream()
                .filter(s -> s.getDaysSinceLastActivity() > 7)
                .collect(Collectors.toList());

        return TeamSummaryDto.builder()
                .members(memberSummaries)
                .teamTotalCases(teamTotalCases)
                .teamAvgProgress(teamAvgProgress)
                .teamCompletionRate(teamCompletionRate)
                .mostActiveWorker(mostActiveWorker)
                .leastActiveWorker(leastActiveWorker)
                .workersWithNoActivity(workersWithNoActivity)
                .build();
    }

    @Transactional(readOnly = true)
    public OrgSummaryDto getOrgSummary(LocalDate startDate, LocalDate endDate) {
        DateRangeValidator.Result validated = DateRangeValidator.validateForQuery(startDate, endDate);
        if (validated.isNoDataInRange()) {
            return emptyOrgSummary(validated.getWarningMessage());
        }
        LocalDate validatedStart = validated.getStart();
        LocalDate validatedEnd = validated.getEnd();

        LocalDateTime start = validatedStart.atStartOfDay();
        LocalDateTime end = validatedEnd.atTime(LocalTime.MAX);

        Map<String, Long> totalUsersByRole = new LinkedHashMap<>();
        for (UserRole role : UserRole.values()) {
            totalUsersByRole.put(role.name(), userRepository.countByRole(role));
        }

        long totalActiveBeneficiaries = beneficiaryRepository.count();
        long newBeneficiariesInPeriod = beneficiaryRepository.countByCreatedAtBetween(start, end);

        long totalOpenCases = caseRepository.countByStatus(CaseStatus.OPEN);
        long totalInProgressCases = caseRepository.countByStatus(CaseStatus.IN_PROGRESS);
        long totalClosedCases = caseRepository.countByStatus(CaseStatus.CLOSED);
        long totalInterventionsCompleted = interventionRepository.countByStatus(InterventionStatus.COMPLETED);
        long totalInterventions = interventionRepository.countByDeletedAtIsNull();
        double totalInterventionCompletionRate = totalInterventions > 0 ? (totalInterventionsCompleted * 100.0 / totalInterventions) : 0;

        List<User> supervisors = userRepository.findByRole(UserRole.SUPERVISOR);
        List<SupervisorActivityDto> supervisorActivityList = new ArrayList<>();
        List<SupervisorActivityDto> inactiveList = new ArrayList<>();
        for (User sup : supervisors) {
            long reportCount = reportRepository.findByGeneratedBy_Id(sup.getId(), PageRequest.of(0, 1000)).getTotalElements();
            SupervisorActivityDto dto = SupervisorActivityDto.builder()
                    .userId(sup.getId())
                    .fullName(sup.getFullName())
                    .email(sup.getEmail())
                    .lastLoginAt(sup.getLastLoginAt())
                    .reportSubmissionCount(reportCount)
                    .build();
            supervisorActivityList.add(dto);
            if (sup.getLastLoginAt() == null || ChronoUnit.DAYS.between(sup.getLastLoginAt().toLocalDate(), LocalDate.now()) >= 7) {
                inactiveList.add(dto);
            }
        }

        List<User> allWorkers = userRepository.findByRole(UserRole.SOCIAL_WORKER);
        List<SocialWorkerSummaryDto> topPerforming = allWorkers.stream()
                .map(w -> getSocialWorkerSummary(w.getId(), validatedStart, validatedEnd))
                .sorted((a, b) -> Double.compare(b.getAvgCaseProgress() != null ? b.getAvgCaseProgress() : 0, a.getAvgCaseProgress() != null ? a.getAvgCaseProgress() : 0))
                .limit(3)
                .collect(Collectors.toList());

        return OrgSummaryDto.builder()
                .totalUsersByRole(totalUsersByRole)
                .totalActiveBeneficiaries(totalActiveBeneficiaries)
                .newBeneficiariesInPeriod(newBeneficiariesInPeriod)
                .totalOpenCases(totalOpenCases)
                .totalInProgressCases(totalInProgressCases)
                .totalClosedCases(totalClosedCases)
                .totalInterventionsCompleted(totalInterventionsCompleted)
                .totalInterventionCompletionRate(totalInterventionCompletionRate)
                .supervisorActivity(supervisorActivityList)
                .inactiveSupervisors(inactiveList)
                .topPerformingWorkers(topPerforming)
                .warningMessage(validated.getWarningMessage())
                .build();
    }

    private OrgSummaryDto emptyOrgSummary(String message) {
        Map<String, Long> emptyRoles = new LinkedHashMap<>();
        for (UserRole role : UserRole.values()) {
            emptyRoles.put(role.name(), 0L);
        }
        return OrgSummaryDto.builder()
                .totalUsersByRole(emptyRoles)
                .totalActiveBeneficiaries(0)
                .newBeneficiariesInPeriod(0)
                .totalOpenCases(0)
                .totalInProgressCases(0)
                .totalClosedCases(0)
                .totalInterventionsCompleted(0)
                .totalInterventionCompletionRate(0)
                .supervisorActivity(List.of())
                .inactiveSupervisors(List.of())
                .topPerformingWorkers(List.of())
                .warningMessage(message)
                .build();
    }

    @Transactional(readOnly = true)
    public BeneficiaryJourneyDto getBeneficiaryJourney(Long beneficiaryId, Long currentUserId, UserRole role) {
        if (currentUserId != null && role == UserRole.SOCIAL_WORKER) {
            Beneficiary b = beneficiaryRepository.findById(beneficiaryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Beneficiary", "id", beneficiaryId));
            if (b.getAssignedSocialWorker() == null || !b.getAssignedSocialWorker().getId().equals(currentUserId)) {
                throw new ForbiddenException("You can only view beneficiaries assigned to you.");
            }
        } else if (currentUserId != null && role == UserRole.SUPERVISOR) {
            Beneficiary b = beneficiaryRepository.findById(beneficiaryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Beneficiary", "id", beneficiaryId));
            if (b.getAssignedSocialWorker() == null
                    || b.getAssignedSocialWorker().getSupervisor() == null
                    || !b.getAssignedSocialWorker().getSupervisor().getId().equals(currentUserId)) {
                throw new ForbiddenException("You can only view beneficiaries assigned to your team.");
            }
            User supervisor = userRepository.findById(currentUserId).orElseThrow();
            String supDistrict = districtScopeService.resolveSupervisorDistrict(supervisor);
            if (supDistrict != null && b.getAssignedSocialWorker() != null
                    && !districtScopeService.matchesDistrict(b.getAssignedSocialWorker().getDistrict(), supDistrict)) {
                throw new ForbiddenException("This beneficiary is outside your assigned district.");
            }
        }
        return loadBeneficiaryJourney(beneficiaryId);
    }

    private BeneficiaryJourneyDto loadBeneficiaryJourney(Long beneficiaryId) {
        Beneficiary b = beneficiaryRepository.findById(beneficiaryId).orElseThrow();
        User worker = b.getAssignedSocialWorker();
        List<Case> cases = caseRepository.findByAssignedSocialWorker(worker, PageRequest.of(0, 100)).getContent().stream()
                .filter(c -> (c.getBeneficiaryIdentifier() != null && c.getBeneficiaryIdentifier().equals(b.getIdentifier()))
                        || (c.getBeneficiaryName() != null && c.getBeneficiaryName().equals(b.getFullName())))
                .collect(Collectors.toList());
        List<ReportCaseDto> caseDtos = cases.stream().map(this::toReportCaseDto).collect(Collectors.toList());
        List<ReportDiaryItemDto> allEntries = new ArrayList<>();
        List<ReportInterventionDto> allInterventions = new ArrayList<>();
        List<Document> allDocs = new ArrayList<>();
        for (Case c : cases) {
            caseEntryRepository.findByCaseRecord(c, PageRequest.of(0, 500, Sort.by("createdAt").ascending())).getContent()
                    .forEach(e -> allEntries.add(toDiaryDto(e)));
            interventionRepository.findByCaseRecord(c, PageRequest.of(0, 500)).getContent()
                    .forEach(i -> allInterventions.add(toReportInterventionDto(i)));
            documentRepository.findByCaseRecord(c, PageRequest.of(0, 500)).getContent().stream().filter(d -> d.getDeletedAt() == null).forEach(allDocs::add);
        }
        allEntries.sort(Comparator.comparing(ReportDiaryItemDto::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
        long totalDaysInSystem = b.getCreatedAt() != null ? ChronoUnit.DAYS.between(b.getCreatedAt().toLocalDate(), LocalDate.now()) : 0;
        Integer currentProgress = cases.isEmpty() ? null : cases.stream().filter(c -> c.getStatus() != CaseStatus.CLOSED).map(Case::getProgressPercent).filter(Objects::nonNull).findFirst().orElse(0);

        BeneficiaryProgressDto bp = BeneficiaryProgressDto.builder()
                .beneficiaryId(b.getId())
                .identifier(b.getIdentifier())
                .fullName(b.getFullName())
                .category(b.getCategory())
                .status(b.getStatus() != null ? b.getStatus().name() : null)
                .caseProgressPercent(currentProgress)
                .caseNumber(cases.isEmpty() ? null : cases.get(0).getCaseNumber())
                .caseId(cases.isEmpty() ? null : cases.get(0).getId())
                .interventionsCount((long) allInterventions.size())
                .completedInterventionsCount(allInterventions.stream().filter(i -> "COMPLETED".equals(i.getStatus())).count())
                .district(b.getDistrict())
                .build();

        List<ReportDocumentDto> docDtos = allDocs.stream().map(d -> ReportDocumentDto.builder()
                .id(d.getId())
                .fileName(d.getFileName())
                .createdAt(d.getCreatedAt())
                .build()).collect(Collectors.toList());

        UserBasicDto workerDto = worker != null ? UserBasicDto.builder()
                .id(worker.getId())
                .fullName(worker.getFullName())
                .email(worker.getEmail())
                .role(worker.getRole() != null ? worker.getRole().name() : null)
                .build() : null;

        return BeneficiaryJourneyDto.builder()
                .beneficiary(bp)
                .assignedWorker(workerDto)
                .allCases(caseDtos)
                .allCaseEntries(allEntries)
                .allInterventions(allInterventions)
                .allDocuments(docDtos)
                .totalDaysInSystem(totalDaysInSystem)
                .currentProgressPercent(currentProgress)
                .build();
    }

    @Transactional(readOnly = true)
    public List<DateValueDto> getCaseProgressOverTime(Long userId, String period) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(30);
        if ("WEEKLY".equals(period)) start = end.minusDays(7);
        else if ("MONTHLY".equals(period)) start = end.minusDays(30);
        else if ("YEARLY".equals(period)) start = end.minusDays(365);

        User user = userRepository.findById(userId).orElseThrow();
        List<Case> cases = caseRepository.findByAssignedSocialWorker(user, PageRequest.of(0, 500)).getContent();
        if (cases.isEmpty()) return Collections.emptyList();

        List<DateValueDto> result = new ArrayList<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            LocalDateTime dayStart = d.atStartOfDay();
            LocalDateTime dayEnd = d.atTime(LocalTime.MAX);
            List<Case> activeOnDay = cases.stream().filter(c -> {
                LocalDateTime created = c.getCreatedAt();
                return created != null && !created.isAfter(dayEnd) && (c.getClosedAt() == null || !c.getClosedAt().isBefore(dayStart));
            }).collect(Collectors.toList());
            double avg = activeOnDay.isEmpty() ? 0 : activeOnDay.stream().mapToInt(c -> c.getProgressPercent() != null ? c.getProgressPercent() : 0).average().orElse(0);
            result.add(DateValueDto.builder().date(d.toString()).value(avg).build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<LabelValueDto> getInterventionTypeDistribution(Long userId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        User user = userRepository.findById(userId).orElseThrow();
        var interventions = interventionRepository.findByPlannedBy(user, PageRequest.of(0, 5000)).getContent().stream()
                .filter(i -> i.getCaseRecord() != null && user.getId().equals(i.getCaseRecord().getAssignedSocialWorker() != null ? i.getCaseRecord().getAssignedSocialWorker().getId() : null))
                .filter(i -> i.getUpdatedAt() != null && !i.getUpdatedAt().isBefore(start) && !i.getUpdatedAt().isAfter(end))
                .collect(Collectors.toList());
        Map<String, Long> byType = interventions.stream().collect(Collectors.groupingBy(i -> i.getType() != null ? i.getType().name() : "OTHER", Collectors.counting()));
        return byType.entrySet().stream().map(e -> LabelValueDto.builder().label(e.getKey()).value(e.getValue()).build()).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DateValueDto> getDailyActivityData(Long userId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        List<CaseEntry> entries = caseEntryRepository.findByAssignedWorkerAndCreatedAtBetween(userId, start, end);
        Map<LocalDate, Long> byDay = entries.stream().collect(Collectors.groupingBy(e -> e.getCreatedAt().toLocalDate(), Collectors.counting()));
        List<DateValueDto> result = new ArrayList<>();
        for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
            result.add(DateValueDto.builder().date(d.toString()).value(byDay.getOrDefault(d, 0L).doubleValue()).build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<UnderperformerFlagDto> autoDetectUnderperformers(Long supervisorId) {
        User supervisor = userRepository.findById(supervisorId).orElseThrow();
        List<User> workers = districtScopeService.workersInSupervisorDistrict(supervisor);
        List<UnderperformerFlagDto> result = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(90);
        LocalDate end = today;

        for (User w : workers) {
            SocialWorkerSummaryDto summary = getSocialWorkerSummary(w.getId(), start, end);
            List<String> reasons = new ArrayList<>();
            if (summary.getDaysSinceLastActivity() > 7) reasons.add("LOW_ACTIVITY");
            if (summary.getOverdueTasksCount() > 3) reasons.add("MISSED_FOLLOWUPS");
            long overdueInterventions = countOverdueInterventionsForWorker(w.getId());
            if (overdueInterventions > 2) reasons.add("OVERDUE_INTERVENTIONS");
            if (!reasons.isEmpty()) {
                result.add(UnderperformerFlagDto.builder()
                        .workerId(w.getId())
                        .workerName(w.getFullName())
                        .reason(String.join(", ", reasons))
                        .daysSinceLastActivity(summary.getDaysSinceLastActivity())
                        .overdueTasksCount(summary.getOverdueTasksCount())
                        .overdueInterventionsCount(overdueInterventions)
                        .build());
            }
        }
        return result;
    }

    private long countOverdueInterventionsForWorker(Long workerId) {
        User user = userRepository.findById(workerId).orElseThrow();
        List<Case> cases = caseRepository.findByAssignedSocialWorker(user, PageRequest.of(0, 500)).getContent();
        LocalDateTime now = LocalDateTime.now();
        long count = 0;
        for (Case c : cases) {
            count += interventionRepository.findByCaseRecord(c, PageRequest.of(0, 500)).getContent().stream()
                    .filter(i -> i.getStatus() != InterventionStatus.COMPLETED && i.getPlannedEndDatetime() != null && i.getPlannedEndDatetime().isBefore(now))
                    .count();
        }
        return count;
    }

    private ReportCaseDto toReportCaseDto(Case c) {
        return ReportCaseDto.builder()
                .id(c.getId())
                .caseNumber(c.getCaseNumber())
                .title(c.getTitle())
                .status(c.getStatus() != null ? c.getStatus().name() : null)
                .progressPercent(c.getProgressPercent())
                .openedAt(c.getOpenedAt())
                .closedAt(c.getClosedAt())
                .build();
    }

    private ReportDiaryItemDto toDiaryDto(CaseEntry e) {
        Case c = e.getCaseRecord();
        return ReportDiaryItemDto.builder()
                .id(e.getId())
                .title(e.getTitle())
                .content(e.getContent())
                .type(e.getType() != null ? e.getType().name() : null)
                .status(e.getStatus() != null ? e.getStatus().name() : null)
                .createdAt(e.getCreatedAt())
                .caseNumber(c != null ? c.getCaseNumber() : null)
                .caseId(c != null ? c.getId() : null)
                .beneficiaryName(c != null ? c.getBeneficiaryName() : null)
                .build();
    }

    @Transactional(readOnly = true)
    public DistrictPerformanceSummaryDto getDistrictPerformance(String district, LocalDate startDate, LocalDate endDate) {
        if (district == null || district.isBlank()) {
            throw new IllegalArgumentException("District is required");
        }
        List<User> workers = userRepository.findByRoleAndDistrict(UserRole.SOCIAL_WORKER, district);
        List<Case> cases = new ArrayList<>();
        for (User w : workers) {
            cases.addAll(caseRepository.findCasesByWorkerDistrict(w, district));
        }
        long activeCases = cases.stream().filter(c -> c.getStatus() != CaseStatus.CLOSED).count();
        long closedCases = cases.stream().filter(c -> c.getStatus() == CaseStatus.CLOSED).count();
        double avgProgress = cases.stream()
                .mapToInt(c -> c.getProgressPercent() != null ? c.getProgressPercent() : 0)
                .average().orElse(0);
        long beneficiaries = beneficiaryRepository.countByDistrict(district);

        List<User> supervisors = userRepository.findByRoleAndAssignedDistrict(UserRole.SUPERVISOR, district);
        String supervisorName = supervisors.isEmpty() ? null : supervisors.get(0).getFullName();

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        double successRate = 0;
        long completed = 0;
        for (User w : workers) {
            completed += interventionRepository.countByWorkerAndStatusAndUpdatedAtBetween(
                    w.getId(), InterventionStatus.COMPLETED, start, end);
        }
        if (completed > 0) {
            successRate = Math.min(100, completed * 10.0 / Math.max(workers.size(), 1));
        }

        return DistrictPerformanceSummaryDto.builder()
                .district(district)
                .supervisorName(supervisorName)
                .totalWorkers(workers.size())
                .totalCases(cases.size())
                .activeCases(activeCases)
                .closedCases(closedCases)
                .beneficiaries(beneficiaries)
                .avgProgress(avgProgress)
                .successRate(successRate)
                .build();
    }

    @Transactional(readOnly = true)
    public TeamRealTimeStatsDto getTeamRealTimeStats(Long supervisorId) {
        User supervisor = userRepository.findById(supervisorId).orElseThrow();
        String district = districtScopeService.resolveSupervisorDistrict(supervisor);
        List<User> workers = districtScopeService.workersInSupervisorDistrict(supervisor);
        List<Long> workerIds = workers.stream().map(User::getId).toList();

        long beneficiaries = 0;
        long activeCases = 0;
        long completedInterventions = 0;

        if (!workerIds.isEmpty()) {
            for (User w : workers) {
                beneficiaries += beneficiaryRepository.countByAssignedSocialWorker(w);
            }
            List<Case> cases = caseRepository.findCasesBySupervisorDistrict(supervisorId, district);
            activeCases = cases.stream().filter(c -> c.getStatus() != CaseStatus.CLOSED).count();
            LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
            for (Long wid : workerIds) {
                completedInterventions += interventionRepository.countByWorkerAndStatusAndUpdatedAtBetween(
                        wid, InterventionStatus.COMPLETED, monthStart, LocalDateTime.now());
            }
        }

        int successRate = workers.isEmpty() ? 0
                : (int) Math.min(100, Math.round((completedInterventions * 100.0) / Math.max(workers.size(), 1)));

        return TeamRealTimeStatsDto.builder()
                .assignedDistrict(district)
                .totalBeneficiaries(beneficiaries)
                .activeCases(activeCases)
                .completedInterventions(completedInterventions)
                .successRate(successRate)
                .teamSize(workers.size())
                .build();
    }

    @Transactional(readOnly = true)
    public List<String> getAllDistricts() {
        Set<String> districts = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        userRepository.findDistinctDistricts().forEach(d -> districts.add(d));
        beneficiaryRepository.findDistinctDistricts().forEach(d -> districts.add(d));
        userRepository.findByRole(UserRole.SUPERVISOR).stream()
                .map(User::getAssignedDistrict)
                .filter(d -> d != null && !d.isBlank())
                .forEach(districts::add);
        return new ArrayList<>(districts);
    }

    private ReportInterventionDto toReportInterventionDto(Intervention i) {
        Case c = i.getCaseRecord();
        return ReportInterventionDto.builder()
                .id(i.getId())
                .interventionCode(i.getInterventionCode())
                .title(i.getTitle())
                .type(i.getType() != null ? i.getType().name() : null)
                .status(i.getStatus() != null ? i.getStatus().name() : null)
                .caseNumber(c != null ? c.getCaseNumber() : null)
                .caseId(c != null ? c.getId() : null)
                .beneficiaryName(c != null ? c.getBeneficiaryName() : null)
                .plannedStartDatetime(i.getPlannedStartDatetime())
                .createdAt(i.getCreatedAt())
                .location(i.getLocation())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CaseTrendDto> getCaseTrends(String period, LocalDate endDate) {
        LocalDate startDate = endDate.minusDays(30);
        int stepDays = 1;
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");
        
        if ("WEEKLY".equals(period)) {
            startDate = endDate.minusDays(7);
            stepDays = 1;
            formatter = DateTimeFormatter.ofPattern("EEE");
        } else if ("YEARLY".equals(period)) {
            startDate = endDate.minusDays(365);
            stepDays = 30;
            formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        }
        
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        
        List<Case> cases = caseRepository.findAll();
        List<CaseTrendDto> result = new ArrayList<>();
        
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            LocalDateTime dayStart = current.atStartOfDay();
            LocalDateTime dayEnd = current.plusDays(stepDays - 1).atTime(LocalTime.MAX);
            if (dayEnd.isAfter(end)) dayEnd = end;
            
            final LocalDateTime fDayStart = dayStart;
            final LocalDateTime fDayEnd = dayEnd;
            
            long opened = cases.stream()
                    .filter(c -> c.getCreatedAt() != null && !c.getCreatedAt().isBefore(fDayStart) && !c.getCreatedAt().isAfter(fDayEnd))
                    .count();
                    
            long closed = cases.stream()
                    .filter(c -> c.getStatus() == CaseStatus.CLOSED && c.getClosedAt() != null && !c.getClosedAt().isBefore(fDayStart) && !c.getClosedAt().isAfter(fDayEnd))
                    .count();
                    
            long active = cases.stream()
                    .filter(c -> {
                        LocalDateTime created = c.getCreatedAt();
                        return created != null && !created.isAfter(fDayEnd) && (c.getClosedAt() == null || !c.getClosedAt().isBefore(fDayStart));
                    }).count();
                    
            result.add(CaseTrendDto.builder()
                    .period(current.format(formatter))
                    .casesOpened(opened)
                    .casesClosed(closed)
                    .activeCases(active)
                    .build());
                    
            current = current.plusDays(stepDays);
        }
        
        return result;
    }

    @Transactional(readOnly = true)
    public List<MonthlyBreakdownDto> getMonthlyBreakdown(int year, LocalDate endDate) {
        List<Case> cases = caseRepository.findAll();
        List<Intervention> interventions = interventionRepository.findAll().stream()
                .filter(i -> i.getDeletedAt() == null).toList();
        List<MonthlyBreakdownDto> result = new ArrayList<>();
        
        for (int month = 1; month <= 12; month++) {
            LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0);
            LocalDateTime end = start.plusMonths(1).minusNanos(1);
            LocalDateTime limit = endDate.atTime(LocalTime.MAX);
            if (end.isAfter(limit)) {
                if (start.isAfter(limit)) break;
                end = limit;
            }
            
            final LocalDateTime fStart = start;
            final LocalDateTime fEnd = end;
            
            long opened = cases.stream().filter(c -> c.getCreatedAt() != null && !c.getCreatedAt().isBefore(fStart) && !c.getCreatedAt().isAfter(fEnd)).count();
            long closed = cases.stream().filter(c -> c.getStatus() == CaseStatus.CLOSED && c.getClosedAt() != null && !c.getClosedAt().isBefore(fStart) && !c.getClosedAt().isAfter(fEnd)).count();
            
            long totalInterventions = interventions.stream().filter(i -> i.getUpdatedAt() != null && !i.getUpdatedAt().isBefore(fStart) && !i.getUpdatedAt().isAfter(fEnd)).count();
            long completedInterventions = interventions.stream().filter(i -> i.getStatus() == InterventionStatus.COMPLETED && i.getUpdatedAt() != null && !i.getUpdatedAt().isBefore(fStart) && !i.getUpdatedAt().isAfter(fEnd)).count();
            
            double successRate = totalInterventions > 0 ? (completedInterventions * 100.0 / totalInterventions) : 0;
            
            result.add(MonthlyBreakdownDto.builder()
                    .month(start.format(DateTimeFormatter.ofPattern("MMM")))
                    .casesOpened(opened)
                    .casesClosed(closed)
                    .successRate(Math.round(successRate * 10.0) / 10.0)
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getInterventionSuccessByType(String period, LocalDate endDate) {
        LocalDate startDate = endDate.minusDays(30);
        if ("WEEKLY".equals(period)) startDate = endDate.minusDays(7);
        else if ("YEARLY".equals(period)) startDate = endDate.minusDays(365);
        
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        
        List<Intervention> interventions = interventionRepository.findAll().stream()
                .filter(i -> i.getDeletedAt() == null)
                .filter(i -> i.getUpdatedAt() != null && !i.getUpdatedAt().isBefore(start) && !i.getUpdatedAt().isAfter(end))
                .toList();
                
        Map<String, List<Intervention>> byType = interventions.stream()
                .collect(Collectors.groupingBy(i -> i.getType() != null ? i.getType().name() : "OTHER"));
                
        List<Map<String, Object>> result = new ArrayList<>();
        byType.forEach((type, list) -> {
            long completed = list.stream().filter(i -> i.getStatus() == InterventionStatus.COMPLETED).count();
            double percent = list.isEmpty() ? 0 : (completed * 100.0 / list.size());
            Map<String, Object> map = new HashMap<>();
            map.put("label", type);
            map.put("count", list.size());
            map.put("percent", Math.round(percent * 10.0) / 10.0);
            result.add(map);
        });
        result.sort((a, b) -> Double.compare((Double) b.get("percent"), (Double) a.get("percent")));
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCasesByPriority(LocalDate endDate) {
        LocalDateTime limit = endDate.atTime(LocalTime.MAX);
        List<Case> activeCases = caseRepository.findAll().stream()
                .filter(c -> c.getCreatedAt() != null && !c.getCreatedAt().isAfter(limit))
                .filter(c -> c.getStatus() != CaseStatus.CLOSED || c.getClosedAt() == null || c.getClosedAt().isAfter(limit))
                .toList();
        
        Map<String, Long> byPriority = activeCases.stream()
                .collect(Collectors.groupingBy(c -> c.getPriority() != null ? c.getPriority().name() : "MEDIUM", Collectors.counting()));
                
        List<Map<String, Object>> result = new ArrayList<>();
        byPriority.forEach((priority, count) -> {
            Map<String, Object> map = new HashMap<>();
            map.put("label", priority);
            map.put("value", count);
            result.add(map);
        });
        return result;
    }
    
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCasesByType(String period, LocalDate endDate) {
        LocalDate startDate = endDate.minusDays(30);
        if ("WEEKLY".equals(period)) startDate = endDate.minusDays(7);
        else if ("YEARLY".equals(period)) startDate = endDate.minusDays(365);
        
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        
        List<Case> cases = caseRepository.findAll().stream()
                .filter(c -> c.getCreatedAt() != null && !c.getCreatedAt().isBefore(start) && !c.getCreatedAt().isAfter(end))
                .toList();
                
        Map<String, Long> byType = cases.stream()
                .collect(Collectors.groupingBy(c -> c.getPriority() != null ? c.getPriority().name() : "MEDIUM", Collectors.counting()));
                
        List<Map<String, Object>> result = new ArrayList<>();
        byType.forEach((type, count) -> {
            Map<String, Object> map = new HashMap<>();
            map.put("label", type);
            map.put("count", count);
            result.add(map);
        });
        result.sort((a, b) -> Long.compare((Long) b.get("count"), (Long) a.get("count")));
        return result;
    }

    @Transactional(readOnly = true)
    public byte[] exportAnalyticsToExcel(String period) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Analytics " + period);
            
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Metric");
            header.createCell(1).setCellValue("Value");
            
            OrgSummaryDto summary = getOrgSummary(
                    "WEEKLY".equals(period) ? LocalDate.now().minusDays(7) : "YEARLY".equals(period) ? LocalDate.now().minusDays(365) : LocalDate.now().minusDays(30),
                    LocalDate.now()
            );
            
            int r = 1;
            Row row1 = sheet.createRow(r++);
            row1.createCell(0).setCellValue("Total Active Beneficiaries");
            row1.createCell(1).setCellValue(summary.getTotalActiveBeneficiaries());
            
            Row row2 = sheet.createRow(r++);
            row2.createCell(0).setCellValue("Total Open Cases");
            row2.createCell(1).setCellValue(summary.getTotalOpenCases());
            
            Row row3 = sheet.createRow(r++);
            row3.createCell(0).setCellValue("Total Closed Cases");
            row3.createCell(1).setCellValue(summary.getTotalClosedCases());
            
            Row row4 = sheet.createRow(r++);
            row4.createCell(0).setCellValue("Intervention Success Rate (%)");
            row4.createCell(1).setCellValue(summary.getTotalInterventionCompletionRate());
            
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate excel file", e);
        }
    }

    /**
     * Supervisor: export team analytics for the selected period to Excel.
     * Includes per-worker metrics used by the Team Analytics UI.
     */
    @Transactional(readOnly = true)
    public byte[] exportTeamAnalyticsToExcel(Long supervisorId, String period, LocalDate startDate, LocalDate endDate) {
        TeamSummaryDto team = getTeamSummary(supervisorId, startDate, endDate);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Team Analytics");

            int r = 0;
            Row titleRow = sheet.createRow(r++);
            titleRow.createCell(0).setCellValue("AfyaLink - Team Analytics");
            titleRow.createCell(1).setCellValue(period != null ? period.toUpperCase() : "");

            Row rangeRow = sheet.createRow(r++);
            rangeRow.createCell(0).setCellValue("Range Start");
            rangeRow.createCell(1).setCellValue(startDate != null ? startDate.toString() : "");
            rangeRow.createCell(2).setCellValue("Range End");
            rangeRow.createCell(3).setCellValue(endDate != null ? endDate.toString() : "");

            r++; // spacer

            Row kpi1 = sheet.createRow(r++);
            kpi1.createCell(0).setCellValue("Team Total Cases");
            kpi1.createCell(1).setCellValue(team.getTeamTotalCases());

            Row kpi2 = sheet.createRow(r++);
            kpi2.createCell(0).setCellValue("Team Avg Progress (%)");
            kpi2.createCell(1).setCellValue(team.getTeamAvgProgress());

            Row kpi3 = sheet.createRow(r++);
            kpi3.createCell(0).setCellValue("Team Completion Rate (%)");
            kpi3.createCell(1).setCellValue(team.getTeamCompletionRate());

            r++; // spacer before table

            Row header = sheet.createRow(r++);
            header.createCell(0).setCellValue("Worker");
            header.createCell(1).setCellValue("Sector");
            header.createCell(2).setCellValue("Cell");
            header.createCell(3).setCellValue("Active Cases");
            header.createCell(4).setCellValue("Entries");
            header.createCell(5).setCellValue("Interventions Completed");
            header.createCell(6).setCellValue("Avg Progress (%)");
            header.createCell(7).setCellValue("Last Activity (days)");

            List<SocialWorkerSummaryDto> members = team.getMembers() != null ? team.getMembers() : List.of();
            for (SocialWorkerSummaryDto m : members) {
                Row row = sheet.createRow(r++);
                row.createCell(0).setCellValue(m.getWorkerName() != null ? m.getWorkerName() : "");
                row.createCell(1).setCellValue(m.getSector() != null ? m.getSector() : "");
                row.createCell(2).setCellValue(m.getCell() != null ? m.getCell() : "");
                row.createCell(3).setCellValue(m.getTotalActiveCases());
                row.createCell(4).setCellValue(m.getCaseEntriesMade());
                row.createCell(5).setCellValue(m.getInterventionsCompleted());
                row.createCell(6).setCellValue(m.getAvgCaseProgress() != null ? m.getAvgCaseProgress() : 0);
                row.createCell(7).setCellValue(m.getDaysSinceLastActivity());
            }

            // Best-effort column widths
            for (int c = 0; c <= 7; c++) {
                sheet.autoSizeColumn(c);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate team analytics excel file", e);
        }
    }

    public List<SocialWorkerSummaryDto> getTopPerformers(LocalDate startDate, LocalDate endDate, String district) {
        // 1. Get ALL workers, optionally filtering by district
        List<User> workers = userRepository.findByRole(UserRole.SOCIAL_WORKER);
        if (district != null && !district.isEmpty()) {
            workers = workers.stream()
                .filter(w -> district.equals(w.getDistrict()))
                .collect(Collectors.toList());
        }

        // 2. Generate summary for each worker in the given time frame
        List<SocialWorkerSummaryDto> summaries = workers.stream()
                .map(w -> getSocialWorkerSummary(w.getId(), startDate, endDate))
                .collect(Collectors.toList());

        // 3. Sort by success rate, then total active cases
        summaries.sort((a, b) -> {
            // Primary sort: Completion Rate (Descending)
            int rateCompare = Double.compare(
                b.getInterventionCompletionRate(),
                a.getInterventionCompletionRate()
            );
            if (rateCompare != 0) return rateCompare;

            // Secondary sort: Total Active Cases (Descending)
            return Long.compare(b.getTotalActiveCases(), a.getTotalActiveCases());
        });

        // 4. Return top 5
        return summaries.stream().limit(5).collect(Collectors.toList());
    }
}
