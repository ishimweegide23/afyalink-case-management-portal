package com.afyalink.backend.service;

import com.afyalink.backend.dto.report.*;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.CaseRepository;
import com.afyalink.backend.repository.ReportRepository;
import com.afyalink.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PerformanceService {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final CaseRepository caseRepository;
    private final PerformanceWarningService performanceWarningService;

    @Transactional(readOnly = true)
    public List<PerformanceMetricsDto> getPerformanceByRole(String role, String timeRange) {
        LocalDate[] range = timeRangeToDates(timeRange);
        LocalDate start = range[0];
        LocalDate end = range[1];

        if ("SUPERVISOR".equalsIgnoreCase(role)) {
            List<User> supervisors = userRepository.findByRole(UserRole.SUPERVISOR);
            return supervisors.stream()
                    .map(s -> buildSupervisorMetrics(s, start, end))
                    .sorted((a, b) -> Integer.compare(b.getMetrics().getOverallScore(), a.getMetrics().getOverallScore()))
                    .collect(Collectors.toList());
        } else {
            List<User> workers = userRepository.findByRole(UserRole.SOCIAL_WORKER);
            return workers.stream()
                    .map(w -> buildWorkerMetrics(w, start, end))
                    .sorted((a, b) -> Integer.compare(b.getMetrics().getOverallScore(), a.getMetrics().getOverallScore()))
                    .collect(Collectors.toList());
        }
    }

    @Transactional(readOnly = true)
    public List<SupervisorWorkloadDto> getSupervisorWorkload() {
        List<User> supervisors = userRepository.findByRole(UserRole.SUPERVISOR);
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(30);

        return supervisors.stream()
                .map(s -> buildSupervisorWorkload(s, start, end))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PerformanceDetailsDto getPerformanceDetails(Long userId, String timeRange) {
        User user = userRepository.findById(userId).orElseThrow();
        LocalDate[] range = timeRangeToDates(timeRange);
        LocalDate start = range[0];
        LocalDate end = range[1];

        if (user.getRole() == UserRole.SUPERVISOR) {
            return buildSupervisorDetails(user, start, end);
        } else {
            return buildWorkerDetails(user, start, end, timeRange);
        }
    }

    private PerformanceMetricsDto buildWorkerMetrics(User user, LocalDate start, LocalDate end) {
        if (user == null) return null;
        SocialWorkerSummaryDto summary = analyticsService.getSocialWorkerSummary(user.getId(), start, end);

        long reportsSubmitted = reportRepository.countSubmittedByUserInPeriod(user.getId(), start, end);
        int weeksInPeriod = Math.max(1, (int) ChronoUnit.WEEKS.between(start, end) + 1);
        int reportsExpected = weeksInPeriod;
        int reportSubmissionRate = reportsExpected > 0 ? (int) Math.round(100.0 * reportsSubmitted / reportsExpected) : 100;
        reportSubmissionRate = Math.min(100, reportSubmissionRate);

        long totalCases = summary.getTotalActiveCases() + summary.getClosedCasesInPeriod() + summary.getNewCasesInPeriod();
        long casesCompleted = summary.getClosedCasesInPeriod();
        int caseCompletionRate = totalCases > 0 ? (int) Math.round(100.0 * casesCompleted / totalCases) : 0;
        caseCompletionRate = Math.min(100, caseCompletionRate);

        int interventionSuccessRate = (int) Math.round(summary.getInterventionCompletionRate());
        interventionSuccessRate = Math.min(100, Math.max(0, interventionSuccessRate));

        double responseScore = Math.max(0, 100 - summary.getDaysSinceLastActivity() * 5);
        double overdueScore = Math.max(0, 100 - summary.getOverdueTasksCount() * 10);

        int overallScore = (int) Math.round(
                caseCompletionRate * 0.30 +
                        reportSubmissionRate * 0.25 +
                        interventionSuccessRate * 0.25 +
                        responseScore * 0.10 +
                        overdueScore * 0.10
        );
        overallScore = Math.min(100, Math.max(0, overallScore));

        MetricsDto metrics = MetricsDto.builder()
                .overallScore(overallScore)
                .casesAssigned((int) totalCases)
                .casesCompleted((int) casesCompleted)
                .caseCompletionRate(caseCompletionRate)
                .reportsExpected(reportsExpected)
                .reportsSubmitted((int) reportsSubmitted)
                .reportSubmissionRate(reportSubmissionRate)
                .interventionsCompleted((int) summary.getInterventionsCompleted())
                .interventionSuccessRate(interventionSuccessRate)
                .avgResponseTimeHours(summary.getDaysSinceLastActivity() * 24.0)
                .overdueTasks((int) summary.getOverdueTasksCount())
                .beneficiariesRegistered((int) summary.getNewBeneficiariesInPeriod())
                .teamSize(0)
                .build();

        return PerformanceMetricsDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .supervisorId(user.getSupervisor() != null ? user.getSupervisor().getId() : null)
                .metrics(metrics)
                .build();
    }

    private PerformanceMetricsDto buildSupervisorMetrics(User supervisor, LocalDate start, LocalDate end) {
        TeamSummaryDto teamSummary = analyticsService.getTeamSummary(supervisor.getId(), start, end);
        List<SocialWorkerSummaryDto> members = teamSummary.getMembers();

        int teamSize = members.size();
        double avgTeamScore = 0;
        int totalCasesAssigned = 0;
        int totalCasesCompleted = 0;
        int totalReportsSubmitted = 0;
        int totalReportsExpected = 0;
        int totalInterventions = 0;
        int totalInterventionSuccess = 0;
        int totalOverdueTasks = 0;

        for (SocialWorkerSummaryDto m : members) {
            long reportsSubmitted = reportRepository.countSubmittedByUserInPeriod(m.getUserId(), start, end);
            int weeksInPeriod = Math.max(1, (int) ChronoUnit.WEEKS.between(start, end) + 1);
            totalReportsExpected += weeksInPeriod;
            totalReportsSubmitted += reportsSubmitted;

            long totalCases = m.getTotalActiveCases() + m.getClosedCasesInPeriod() + m.getNewCasesInPeriod();
            totalCasesAssigned += totalCases;
            totalCasesCompleted += m.getClosedCasesInPeriod();
            totalInterventions += m.getInterventionsCompleted();
            totalInterventionSuccess += (int) Math.round(m.getInterventionCompletionRate() * m.getInterventionsCompleted() / 100.0);
            totalOverdueTasks += m.getOverdueTasksCount();
        }

        int caseCompletionRate = totalCasesAssigned > 0 ? (int) Math.round(100.0 * totalCasesCompleted / totalCasesAssigned) : 0;
        int reportSubmissionRate = totalReportsExpected > 0 ? (int) Math.round(100.0 * totalReportsSubmitted / totalReportsExpected) : 100;
        int interventionSuccessRate = totalInterventions > 0 ? (int) Math.round(100.0 * totalInterventionSuccess / totalInterventions) : 0;

        double overdueScore = Math.max(0, 100 - totalOverdueTasks * 5);
        double responseScore = 80;

        if (!members.isEmpty()) {
            long maxDays = members.stream().mapToLong(SocialWorkerSummaryDto::getDaysSinceLastActivity).max().orElse(0);
            responseScore = Math.max(0, 100 - maxDays * 3);
        }

        int overallScore = (int) Math.round(
                caseCompletionRate * 0.30 +
                        reportSubmissionRate * 0.25 +
                        interventionSuccessRate * 0.25 +
                        responseScore * 0.10 +
                        overdueScore * 0.10
        );
        overallScore = Math.min(100, Math.max(0, overallScore));

        for (SocialWorkerSummaryDto m : members) {
            PerformanceMetricsDto workerMetrics = buildWorkerMetrics(userRepository.findById(m.getUserId()).orElse(null), start, end);
            if (workerMetrics != null) {
                avgTeamScore += workerMetrics.getMetrics().getOverallScore();
            }
        }
        avgTeamScore = teamSize > 0 ? avgTeamScore / teamSize : 0;

        MetricsDto metrics = MetricsDto.builder()
                .overallScore(overallScore)
                .casesAssigned(totalCasesAssigned)
                .casesCompleted(totalCasesCompleted)
                .caseCompletionRate(caseCompletionRate)
                .reportsExpected(totalReportsExpected)
                .reportsSubmitted(totalReportsSubmitted)
                .reportSubmissionRate(reportSubmissionRate)
                .interventionsCompleted(totalInterventions)
                .interventionSuccessRate(interventionSuccessRate)
                .avgResponseTimeHours(0)
                .overdueTasks(totalOverdueTasks)
                .beneficiariesRegistered((int) members.stream().mapToLong(SocialWorkerSummaryDto::getNewBeneficiariesInPeriod).sum())
                .teamSize(teamSize)
                .build();

        return PerformanceMetricsDto.builder()
                .id(supervisor.getId())
                .fullName(supervisor.getFullName())
                .email(supervisor.getEmail())
                .role(supervisor.getRole() != null ? supervisor.getRole().name() : null)
                .metrics(metrics)
                .build();
    }

    private SupervisorWorkloadDto buildSupervisorWorkload(User supervisor, LocalDate start, LocalDate end) {
        TeamSummaryDto teamSummary = analyticsService.getTeamSummary(supervisor.getId(), start, end);
        List<SocialWorkerSummaryDto> members = teamSummary.getMembers();

        List<WorkerSummaryDto> workers = new ArrayList<>();
        double avgScore = 0;
        int activeCases = 0;

        for (SocialWorkerSummaryDto m : members) {
            User w = userRepository.findById(m.getUserId()).orElse(null);
            if (w != null) {
                PerformanceMetricsDto pm = buildWorkerMetrics(w, start, end);
                int score = pm != null ? pm.getMetrics().getOverallScore() : 0;
                workers.add(WorkerSummaryDto.builder()
                        .id(w.getId())
                        .fullName(w.getFullName())
                        .email(w.getEmail())
                        .overallScore(score)
                        .casesCompleted((int) m.getClosedCasesInPeriod())
                        .casesAssigned((int) (m.getTotalActiveCases() + m.getClosedCasesInPeriod() + m.getNewCasesInPeriod()))
                        .build());
                avgScore += score;
                activeCases += m.getTotalActiveCases();
            }
        }
        avgScore = workers.isEmpty() ? 0 : avgScore / workers.size();

        return SupervisorWorkloadDto.builder()
                .id(supervisor.getId())
                .fullName(supervisor.getFullName())
                .email(supervisor.getEmail())
                .teamSize(workers.size())
                .avgTeamPerformance(Math.round(avgScore * 10) / 10.0)
                .activeCases(activeCases)
                .workers(workers)
                .build();
    }

    private PerformanceDetailsDto buildWorkerDetails(User user, LocalDate start, LocalDate end, String timeRange) {
        PerformanceMetricsDto pm = buildWorkerMetrics(user, start, end);
        SocialWorkerSummaryDto summary = analyticsService.getSocialWorkerSummary(user.getId(), start, end);

        List<PerformanceWarningDto> allWarnings = performanceWarningService.getWarningsForUser(user.getId(), 50);
        List<PerformanceWarningDto> warningHistory = allWarnings.stream()
                .filter(w -> !"EXCELLENT_WORK".equals(w.getWarningType()))
                .collect(Collectors.toList());
        List<PerformanceWarningDto> complimentHistory = allWarnings.stream()
                .filter(w -> "EXCELLENT_WORK".equals(w.getWarningType()))
                .collect(Collectors.toList());

        return PerformanceDetailsDto.builder()
                .user(PerformanceMetricsDto.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .role(user.getRole() != null ? user.getRole().name() : null)
                        .metrics(pm != null ? pm.getMetrics() : null)
                        .build())
                .beneficiariesRegistered((int) summary.getNewBeneficiariesInPeriod())
                .totalBeneficiaries((int) summary.getTotalBeneficiaries())
                .casesAssigned((int) (summary.getTotalActiveCases() + summary.getClosedCasesInPeriod() + summary.getNewCasesInPeriod()))
                .casesActive((int) summary.getTotalActiveCases())
                .casesCompleted((int) summary.getClosedCasesInPeriod())
                .overdueTasks((int) summary.getOverdueTasksCount())
                .tasksCompleted((int) summary.getTasksCompleted())
                .interventionsPlanned((int) summary.getInterventionsPlanned())
                .interventionsCompleted((int) summary.getInterventionsCompleted())
                .interventionSuccessRate((int) Math.round(summary.getInterventionCompletionRate()))
                .reportsExpected(pm != null ? pm.getMetrics().getReportsExpected() : 0)
                .reportsSubmitted(pm != null ? pm.getMetrics().getReportsSubmitted() : 0)
                .reportSubmissionRate(pm != null ? pm.getMetrics().getReportSubmissionRate() : 0)
                .avgResponseHours(summary.getDaysSinceLastActivity() * 24.0)
                .warningHistory(warningHistory)
                .complimentHistory(complimentHistory)
                .trendData(analyticsService.getCaseProgressOverTime(user.getId(), timeRangeToPeriod(timeRange)))
                .build();
    }

    private PerformanceDetailsDto buildSupervisorDetails(User supervisor, LocalDate start, LocalDate end) {
        PerformanceMetricsDto pm = buildSupervisorMetrics(supervisor, start, end);
        SupervisorWorkloadDto workload = buildSupervisorWorkload(supervisor, start, end);

        return PerformanceDetailsDto.builder()
                .user(PerformanceMetricsDto.builder()
                        .id(supervisor.getId())
                        .fullName(supervisor.getFullName())
                        .email(supervisor.getEmail())
                        .role(supervisor.getRole() != null ? supervisor.getRole().name() : null)
                        .metrics(pm != null ? pm.getMetrics() : null)
                        .build())
                .beneficiariesRegistered(0)
                .totalBeneficiaries(0)
                .casesAssigned(pm != null ? pm.getMetrics().getCasesAssigned() : 0)
                .casesActive(workload.getActiveCases())
                .casesCompleted(pm != null ? pm.getMetrics().getCasesCompleted() : 0)
                .overdueTasks(pm != null ? pm.getMetrics().getOverdueTasks() : 0)
                .tasksCompleted(0)
                .interventionsPlanned(0)
                .interventionsCompleted(pm != null ? pm.getMetrics().getInterventionsCompleted() : 0)
                .interventionSuccessRate(pm != null ? pm.getMetrics().getInterventionSuccessRate() : 0)
                .reportsExpected(pm != null ? pm.getMetrics().getReportsExpected() : 0)
                .reportsSubmitted(pm != null ? pm.getMetrics().getReportsSubmitted() : 0)
                .reportSubmissionRate(pm != null ? pm.getMetrics().getReportSubmissionRate() : 0)
                .avgResponseHours(0)
                .warningHistory(new ArrayList<>())
                .complimentHistory(new ArrayList<>())
                .trendData(new ArrayList<>())
                .build();
    }

    private LocalDate[] timeRangeToDates(String timeRange) {
        LocalDate end = LocalDate.now();
        if (timeRange == null || timeRange.isBlank()) return new LocalDate[]{end.minusDays(7), end};
        return switch (timeRange.toLowerCase()) {
            case "week" -> new LocalDate[]{end.minusDays(7), end};
            case "month" -> new LocalDate[]{end.minusDays(30), end};
            case "quarter" -> new LocalDate[]{end.minusDays(90), end};
            default -> new LocalDate[]{end.minusDays(7), end};
        };
    }

    private String timeRangeToPeriod(String timeRange) {
        if ("month".equalsIgnoreCase(timeRange) || "quarter".equalsIgnoreCase(timeRange)) return "MONTHLY";
        return "WEEKLY";
    }
}
