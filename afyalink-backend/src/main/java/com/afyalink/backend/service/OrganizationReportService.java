package com.afyalink.backend.service;

import com.afyalink.backend.dto.report.OrganizationReportDataDto;
import com.afyalink.backend.util.DateRangeValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.temporal.ChronoUnit;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import java.sql.Timestamp;

@Service
@RequiredArgsConstructor
public class OrganizationReportService {

    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public OrganizationReportDataDto buildOrganizationReportData(LocalDate periodStart, LocalDate periodEnd) {
        return buildOrganizationReportData(periodStart, periodEnd, null);
    }

    @Transactional(readOnly = true)
    public OrganizationReportDataDto buildOrganizationReportData(LocalDate periodStart, LocalDate periodEnd, String districtFilter) {
        DateRangeValidator.Result validated = DateRangeValidator.validateForQuery(periodStart, periodEnd);
        if (validated.isNoDataInRange()) {
            return emptyOrganizationReportData(validated.getWarningMessage());
        }
        periodStart = validated.getStart();
        periodEnd = validated.getEnd();

        OrganizationReportDataDto dto = new OrganizationReportDataDto();
        String dist = (districtFilter != null && !districtFilter.isBlank()) ? districtFilter : null;

        dto.setTotalSocialWorkers(countActiveUsersByDistrict("SOCIAL_WORKER", dist));
        dto.setTotalSupervisors(countActiveUsersByDistrict("SUPERVISOR", dist));
        dto.setTotalBeneficiariesServed(countBeneficiariesFiltered(periodStart, periodEnd, dist));

        Object[] caseStats = getCaseStatsFiltered(periodStart, periodEnd, dist);
        dto.setTotalCasesManaged(toLong(caseStats[0]));
        dto.setActiveCases(toLong(caseStats[1]));
        dto.setClosedCases(toLong(caseStats[2]));

        dto.setOverallSuccessRate(getSuccessRateFiltered(periodStart, periodEnd, dist));
        dto.setOverallComplianceRate(getComplianceRateFiltered(periodStart, periodEnd, dist));

        List<OrganizationReportDataDto.DistrictPerformanceDto> districtPerf = getDistrictPerformance(periodStart, periodEnd);
        if (dist != null) {
            districtPerf = districtPerf.stream()
                    .filter(d -> dist.equalsIgnoreCase(d.getDistrict()))
                    .collect(Collectors.toList());
        }
        dto.setDistrictPerformance(districtPerf);

        dto.setCasesByPriority(getCasesByPriorityFiltered(periodStart, periodEnd, dist));
        dto.setCasesByStatus(getCasesByStatusFiltered(periodStart, periodEnd, dist));
        dto.setTopPerformers(getTopPerformersFiltered(periodStart, periodEnd, dist));
        dto.setInterventionStats(getInterventionStatsFiltered(periodStart, periodEnd, dist));
        dto.setMonthlyCaseTrend(getMonthlyCaseTrendFiltered(periodStart, periodEnd, dist));
        dto.setComplianceStats(getComplianceStats(periodStart, periodEnd));
        dto.setYoyMetrics(getYoyMetrics(periodStart, periodEnd));
        dto.setSuccessStories(getSuccessStories(periodStart, periodEnd));
        dto.setInterventionsCompleted(countInterventionsFiltered(periodStart, periodEnd, dist));
        dto.setBeneficiaryRecoveryBands(getRecoveryBandsFiltered(periodStart, periodEnd, dist));
        dto.setRecoveryProgressTrend(getRecoveryProgressTrend(periodStart, periodEnd));
        dto.setCasesByCategory(getCasesByCategoryFiltered(periodStart, periodEnd, dist));
        dto.setAlerts(buildAlerts(dto, periodStart, periodEnd));
        dto.setAverageBeneficiaryProgress(getAverageBeneficiaryProgress(periodStart, periodEnd));
        dto.setPeriodComparison(getPeriodComparison(periodStart, periodEnd));

        if (dto.getDistrictPerformance() != null && !dto.getDistrictPerformance().isEmpty()) {
            dto.getDistrictPerformance().stream()
                    .max(java.util.Comparator.comparingLong(OrganizationReportDataDto.DistrictPerformanceDto::getCases))
                    .ifPresent(d -> dto.setTopDistrictByCases(d.getDistrict()));
            dto.getDistrictPerformance().stream()
                    .max(java.util.Comparator.comparingLong(OrganizationReportDataDto.DistrictPerformanceDto::getBeneficiaries))
                    .ifPresent(d -> dto.setTopDistrictByBeneficiaries(d.getDistrict()));
        }
        return dto;
    }

    private long toLong(Object o) { return o != null ? ((Number) o).longValue() : 0L; }

    private OrganizationReportDataDto emptyOrganizationReportData(String warning) {
        OrganizationReportDataDto dto = new OrganizationReportDataDto();
        dto.setAlerts(warning != null ? List.of(warning) : List.of());
        return dto;
    }

    private int countActiveUsers(String role) {
        Query q = entityManager.createNativeQuery("SELECT COUNT(*) FROM users WHERE role = :role AND is_active = true");
        q.setParameter("role", role);
        return ((Number) q.getSingleResult()).intValue();
    }

    private int countActiveUsersByDistrict(String role, String district) {
        if (district == null) return countActiveUsers(role);
        Query q = entityManager.createNativeQuery(
            "SELECT COUNT(*) FROM users WHERE role = :role AND is_active = true AND (district = :dist OR assigned_district = :dist)");
        q.setParameter("role", role); q.setParameter("dist", district);
        return ((Number) q.getSingleResult()).intValue();
    }

    private long countBeneficiariesFiltered(LocalDate start, LocalDate end, String district) {
        if (district == null) return countBeneficiaries(start, end);
        Query q = entityManager.createNativeQuery(
            "SELECT COUNT(DISTINCT c.beneficiary_identifier) FROM cases c " +
            "JOIN users u ON c.assigned_social_worker_id = u.id " +
            "WHERE (c.created_at IS NULL OR c.created_at <= :end) AND u.district = :dist");
        q.setParameter("end", end.atTime(23,59,59)); q.setParameter("dist", district);
        return ((Number) q.getSingleResult()).longValue();
    }

    private Object[] getCaseStatsFiltered(LocalDate start, LocalDate end, String district) {
        String join = district != null ? " JOIN users u ON c.assigned_social_worker_id = u.id " : "";
        String where = district != null ? " AND u.district = :dist" : "";
        Query q = entityManager.createNativeQuery(
            "SELECT COUNT(c.id), SUM(CASE WHEN c.status!='CLOSED' THEN 1 ELSE 0 END), SUM(CASE WHEN c.status='CLOSED' THEN 1 ELSE 0 END) " +
            "FROM cases c" + join +
            " WHERE (c.created_at IS NULL OR c.created_at<=:end) AND (c.closed_at IS NULL OR c.closed_at>=:start)" + where);
        q.setParameter("start", start.atStartOfDay()); q.setParameter("end", end.atTime(23,59,59));
        if (district != null) q.setParameter("dist", district);
        return (Object[]) q.getSingleResult();
    }

    private double getSuccessRateFiltered(LocalDate start, LocalDate end, String district) {
        String join = district != null ? " JOIN cases c ON c.id=i.case_id JOIN users u ON u.id=c.assigned_social_worker_id" : "";
        String where = district != null ? " AND u.district=:dist" : "";
        Query q = entityManager.createNativeQuery(
            "SELECT AVG(i.effectiveness_percent) FROM interventions i" + join +
            " WHERE i.status='COMPLETED' AND i.created_at>=:start AND i.created_at<=:end" + where);
        q.setParameter("start", start.atStartOfDay()); q.setParameter("end", end.atTime(23,59,59));
        if (district != null) q.setParameter("dist", district);
        Object r = q.getSingleResult(); return r != null ? ((Number)r).doubleValue() : 0.0;
    }

    private double getComplianceRateFiltered(LocalDate start, LocalDate end, String district) {
        String join = district != null ? " JOIN cases c ON c.id=i.case_id JOIN users u ON u.id=c.assigned_social_worker_id" : "";
        String where = district != null ? " AND u.district=:dist" : "";
        Query q = entityManager.createNativeQuery(
            "SELECT (SUM(CASE WHEN i.status='COMPLETED' THEN 1 ELSE 0 END)*100.0)/NULLIF(COUNT(*),0) FROM interventions i" + join +
            " WHERE i.created_at>=:start AND i.created_at<=:end" + where);
        q.setParameter("start", start.atStartOfDay()); q.setParameter("end", end.atTime(23,59,59));
        if (district != null) q.setParameter("dist", district);
        Object r = q.getSingleResult(); return r != null ? ((Number)r).doubleValue() : 0.0;
    }

    private long countInterventionsFiltered(LocalDate start, LocalDate end, String district) {
        String join = district != null ? " JOIN cases c ON c.id=i.case_id JOIN users u ON u.id=c.assigned_social_worker_id" : "";
        String where = district != null ? " AND u.district=:dist" : "";
        Query q = entityManager.createNativeQuery(
            "SELECT COUNT(i.id) FROM interventions i" + join +
            " WHERE i.created_at>=:start AND i.created_at<=:end" + where);
        q.setParameter("start", start.atStartOfDay()); q.setParameter("end", end.atTime(23,59,59));
        if (district != null) q.setParameter("dist", district);
        return ((Number) q.getSingleResult()).longValue();
    }

    private List<OrganizationReportDataDto.ChartDataPoint> getCasesByPriorityFiltered(LocalDate start, LocalDate end, String district) {
        String join = district != null ? " JOIN users u ON c.assigned_social_worker_id=u.id" : "";
        String where = district != null ? " AND u.district=:dist" : "";
        Query q = entityManager.createNativeQuery(
            "SELECT c.priority, COUNT(*) FROM cases c" + join +
            " WHERE (c.created_at IS NULL OR c.created_at<=:end) AND (c.closed_at IS NULL OR c.closed_at>=:start)" + where + " GROUP BY c.priority");
        q.setParameter("start", start.atStartOfDay()); q.setParameter("end", end.atTime(23,59,59));
        if (district != null) q.setParameter("dist", district);
        List<OrganizationReportDataDto.ChartDataPoint> res = new ArrayList<>();
        for (Object[] r : (List<Object[]>) q.getResultList()) {
            String p = (String) r[0]; res.add(new OrganizationReportDataDto.ChartDataPoint(p, ((Number)r[1]).longValue(), getColorForPriority(p))); }
        return res;
    }

    private List<OrganizationReportDataDto.ChartDataPoint> getCasesByStatusFiltered(LocalDate start, LocalDate end, String district) {
        String join = district != null ? " JOIN users u ON c.assigned_social_worker_id=u.id" : "";
        String where = district != null ? " AND u.district=:dist" : "";
        Query q = entityManager.createNativeQuery(
            "SELECT c.status, COUNT(*) FROM cases c" + join +
            " WHERE (c.created_at IS NULL OR c.created_at<=:end) AND (c.closed_at IS NULL OR c.closed_at>=:start)" + where + " GROUP BY c.status");
        q.setParameter("start", start.atStartOfDay()); q.setParameter("end", end.atTime(23,59,59));
        if (district != null) q.setParameter("dist", district);
        List<OrganizationReportDataDto.ChartDataPoint> res = new ArrayList<>();
        for (Object[] r : (List<Object[]>) q.getResultList()) {
            String s = (String) r[0]; res.add(new OrganizationReportDataDto.ChartDataPoint(s, ((Number)r[1]).longValue(), getColorForStatus(s))); }
        return res;
    }

    private List<OrganizationReportDataDto.StaffPerformanceDto> getTopPerformersFiltered(LocalDate start, LocalDate end, String district) {
        String distWhere = district != null ? " AND u.district=:dist" : "";
        Query q = entityManager.createNativeQuery(
            "SELECT u.id, u.full_name, u.district, " +
            "COUNT(DISTINCT c.id) AS cases_managed, " +
            "COALESCE(AVG(CASE WHEN i.status='COMPLETED' AND i.updated_at>=:start AND i.updated_at<=:end THEN i.effectiveness_percent END), 0) AS success_rate " +
            "FROM users u " +
            "LEFT JOIN cases c ON c.assigned_social_worker_id=u.id " +
            "  AND (c.created_at IS NULL OR c.created_at<=:end) AND (c.closed_at IS NULL OR c.closed_at>=:start) " +
            "LEFT JOIN interventions i ON i.case_id=c.id AND i.deleted_at IS NULL " +
            "WHERE u.role='SOCIAL_WORKER' AND u.is_active=true" + distWhere +
            " GROUP BY u.id,u.full_name,u.district " +
            "ORDER BY success_rate DESC NULLS LAST, cases_managed DESC LIMIT 10");
        q.setParameter("start", start.atStartOfDay());
        q.setParameter("end", end.atTime(23, 59, 59));
        if (district != null) q.setParameter("dist", district);
        List<OrganizationReportDataDto.StaffPerformanceDto> list = new ArrayList<>();
        for (Object[] r : (List<Object[]>) q.getResultList()) {
            long casesManaged = r[3] != null ? ((Number) r[3]).longValue() : 0L;
            double sr = r[4] != null ? ((Number) r[4]).doubleValue() : 0.0;
            String recognition = sr >= 90 ? "Top Performer" : sr >= 80 ? "Excellent" : sr >= 60 ? "Good" : "Needs Improvement";
            list.add(new OrganizationReportDataDto.StaffPerformanceDto(
                ((Number) r[0]).longValue(), (String) r[1], (String) r[2], casesManaged, sr, recognition));
        }
        return list;
    }

    private List<OrganizationReportDataDto.InterventionStatsDto> getInterventionStatsFiltered(LocalDate start, LocalDate end, String district) {
        String join = district != null ? " JOIN cases c ON c.id=i.case_id JOIN users u ON u.id=c.assigned_social_worker_id" : "";
        String where = district != null ? " AND u.district=:dist" : "";
        Query q = entityManager.createNativeQuery(
            "SELECT i.type, COUNT(i.id), AVG(i.effectiveness_percent) FROM interventions i" + join +
            " WHERE i.created_at>=:start AND i.created_at<=:end" + where + " GROUP BY i.type");
        q.setParameter("start", start.atStartOfDay()); q.setParameter("end", end.atTime(23,59,59));
        if (district != null) q.setParameter("dist", district);
        List<OrganizationReportDataDto.InterventionStatsDto> list = new ArrayList<>();
        for (Object[] r : (List<Object[]>) q.getResultList())
            list.add(new OrganizationReportDataDto.InterventionStatsDto((String)r[0], ((Number)r[1]).longValue(), r[2]!=null?((Number)r[2]).doubleValue():0.0));
        return list;
    }

    private List<OrganizationReportDataDto.ChartDataPoint> getMonthlyCaseTrendFiltered(LocalDate start, LocalDate end, String district) {
        String join = district != null ? " JOIN users u ON c.assigned_social_worker_id=u.id" : "";
        String where = district != null ? " AND u.district=:dist" : "";
        Query q = entityManager.createNativeQuery(
            "SELECT c.created_at FROM cases c" + join +
            " WHERE c.created_at>=:start AND c.created_at<=:end" + where);
        q.setParameter("start", start.atStartOfDay()); q.setParameter("end", end.atTime(23,59,59));
        if (district != null) q.setParameter("dist", district);
        Map<Integer,Long> counts = new HashMap<>();
        for (Object t : q.getResultList()) {
            LocalDateTime ldt = t instanceof Timestamp ? ((Timestamp)t).toLocalDateTime() : t instanceof LocalDateTime ? (LocalDateTime)t : null;
            if (ldt != null) counts.merge(ldt.getMonthValue(), 1L, Long::sum);
        }
        List<OrganizationReportDataDto.ChartDataPoint> list = new ArrayList<>();
        for (int i=1;i<=12;i++) list.add(new OrganizationReportDataDto.ChartDataPoint(
            Month.of(i).getDisplayName(TextStyle.SHORT,Locale.ENGLISH), counts.getOrDefault(i,0L), "#3b82f6"));
        return list;
    }

    private List<OrganizationReportDataDto.ChartDataPoint> getRecoveryBandsFiltered(LocalDate start, LocalDate end, String district) {
        String join = district != null ? " JOIN users u ON c.assigned_social_worker_id=u.id" : "";
        String where = district != null ? " AND u.district=:dist" : "";
        Query q = entityManager.createNativeQuery(
            "SELECT SUM(CASE WHEN COALESCE(c.progress_percent,0) BETWEEN 0 AND 25 THEN 1 ELSE 0 END)," +
            "SUM(CASE WHEN COALESCE(c.progress_percent,0) BETWEEN 26 AND 50 THEN 1 ELSE 0 END)," +
            "SUM(CASE WHEN COALESCE(c.progress_percent,0) BETWEEN 51 AND 75 THEN 1 ELSE 0 END)," +
            "SUM(CASE WHEN COALESCE(c.progress_percent,0) BETWEEN 76 AND 100 THEN 1 ELSE 0 END) FROM cases c" + join +
            " WHERE (c.created_at IS NULL OR c.created_at<=:end) AND (c.closed_at IS NULL OR c.closed_at>=:start)" + where);
        q.setParameter("start", start.atStartOfDay()); q.setParameter("end", end.atTime(23,59,59));
        if (district != null) q.setParameter("dist", district);
        Object[] row = (Object[]) q.getSingleResult();
        String[] labels={"0-25%","26-50%","51-75%","76-100%"}; String[] colors={"#ef4444","#f59e0b","#3b82f6","#10b981"};
        List<OrganizationReportDataDto.ChartDataPoint> bands = new ArrayList<>();
        for (int i=0;i<4;i++) bands.add(new OrganizationReportDataDto.ChartDataPoint(labels[i], row[i]!=null?((Number)row[i]).longValue():0L, colors[i]));
        return bands;
    }

    private List<OrganizationReportDataDto.ChartDataPoint> getCasesByCategoryFiltered(LocalDate start, LocalDate end, String district) {
        String join = district != null ? " JOIN users u ON c.assigned_social_worker_id=u.id" : "";
        String where = district != null ? " AND u.district=:dist" : "";
        Query q = entityManager.createNativeQuery(
            "SELECT COALESCE(c.title,'OTHER'), COUNT(*) FROM cases c" + join +
            " WHERE (c.created_at IS NULL OR c.created_at<=:end) AND (c.closed_at IS NULL OR c.closed_at>=:start)" + where +
            " GROUP BY c.title LIMIT 20");
        q.setParameter("start", start.atStartOfDay()); q.setParameter("end", end.atTime(23,59,59));
        if (district != null) q.setParameter("dist", district);
        List<OrganizationReportDataDto.ChartDataPoint> res = new ArrayList<>();
        for (Object[] r : (List<Object[]>) q.getResultList())
            res.add(new OrganizationReportDataDto.ChartDataPoint((String)r[0], ((Number)r[1]).longValue(), "#6366f1"));
        return res;
    }

    /** Beneficiaries enrolled in the system by end of period (real cohort served). */
    private long countBeneficiaries(LocalDate start, LocalDate end) {
        Query q = entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM beneficiaries WHERE created_at IS NULL OR created_at <= :end");
        q.setParameter("end", end.atTime(23, 59, 59));
        return ((Number) q.getSingleResult()).longValue();
    }

    /** Cases that existed during the reporting period (opened on or before end, not closed before start). */
    private Object[] getCaseStats(LocalDate start, LocalDate end) {
        Query q = entityManager.createNativeQuery(
                "SELECT COUNT(*) as total, " +
                "SUM(CASE WHEN status != 'CLOSED' THEN 1 ELSE 0 END) as active, " +
                "SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed " +
                "FROM cases WHERE (created_at IS NULL OR created_at <= :end) " +
                "AND (closed_at IS NULL OR closed_at >= :start)");
        q.setParameter("start", start.atStartOfDay());
        q.setParameter("end", end.atTime(23, 59, 59));
        return (Object[]) q.getSingleResult();
    }

    private long countInterventionsInPeriod(LocalDate start, LocalDate end) {
        Query q = entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM interventions WHERE created_at >= :start AND created_at <= :end");
        q.setParameter("start", start.atStartOfDay());
        q.setParameter("end", end.atTime(23, 59, 59));
        return ((Number) q.getSingleResult()).longValue();
    }

    private double getOverallSuccessRate(LocalDate start, LocalDate end) {
        Query q = entityManager.createNativeQuery("SELECT AVG(effectiveness_percent) FROM interventions WHERE status = 'COMPLETED' AND created_at >= :start AND created_at <= :end");
        q.setParameter("start", start.atStartOfDay());
        q.setParameter("end", end.atTime(23, 59, 59));
        Object res = q.getSingleResult();
        return res != null ? ((Number) res).doubleValue() : 0.0;
    }

    private double getOverallComplianceRate(LocalDate start, LocalDate end) {
        Query q = entityManager.createNativeQuery("SELECT (SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(*), 0) FROM interventions WHERE created_at >= :start AND created_at <= :end");
        q.setParameter("start", start.atStartOfDay());
        q.setParameter("end", end.atTime(23, 59, 59));
        Object res = q.getSingleResult();
        return res != null ? ((Number) res).doubleValue() : 0.0;
    }

    private List<OrganizationReportDataDto.DistrictPerformanceDto> getDistrictPerformance(LocalDate start, LocalDate end) {
        Query dq = entityManager.createNativeQuery(
            "SELECT u.district, COUNT(DISTINCT c.beneficiary_identifier) as beneficiaries, COUNT(DISTINCT c.id) as total_cases, " +
            "COUNT(DISTINCT CASE WHEN c.status != 'CLOSED' THEN c.id END) as active_cases, " +
            "COUNT(DISTINCT CASE WHEN c.status = 'CLOSED' THEN c.id END) as closed_cases " +
            "FROM cases c " +
            "JOIN users u ON c.assigned_social_worker_id = u.id " +
            "WHERE (c.created_at IS NULL OR c.created_at <= :end) AND (c.closed_at IS NULL OR c.closed_at >= :start) " +
            "GROUP BY u.district"
        );
        dq.setParameter("start", start.atStartOfDay());
        dq.setParameter("end", end.atTime(23, 59, 59));
        List<Object[]> dResults = dq.getResultList();

        Query sq = entityManager.createNativeQuery(
            "SELECT u.district, AVG(i.effectiveness_percent) FROM interventions i " +
            "JOIN cases c ON c.id = i.case_id JOIN users u ON u.id = c.assigned_social_worker_id " +
            "WHERE i.status = 'COMPLETED' AND i.created_at >= :start AND i.created_at <= :end GROUP BY u.district"
        );
        sq.setParameter("start", start.atStartOfDay());
        sq.setParameter("end", end.atTime(23, 59, 59));
        Map<String, Double> successMap = new HashMap<>();
        for (Object[] row : (List<Object[]>) sq.getResultList()) {
            successMap.put((String) row[0], row[1] != null ? ((Number) row[1]).doubleValue() : 0.0);
        }

        Query wq = entityManager.createNativeQuery("SELECT district, COUNT(*) FROM users WHERE role = 'SOCIAL_WORKER' AND is_active = true GROUP BY district");
        Map<String, Integer> workerMap = new HashMap<>();
        for (Object[] row : (List<Object[]>) wq.getResultList()) {
            workerMap.put(row[0] != null ? (String) row[0] : "Unknown", ((Number) row[1]).intValue());
        }

        Query supQ = entityManager.createNativeQuery(
                "SELECT assigned_district, full_name FROM users WHERE role = 'SUPERVISOR' AND is_active = true AND assigned_district IS NOT NULL");
        Map<String, String> supervisorByDistrict = new HashMap<>();
        for (Object[] row : (List<Object[]>) supQ.getResultList()) {
            if (row[0] != null) {
                supervisorByDistrict.put((String) row[0], (String) row[1]);
            }
        }

        List<OrganizationReportDataDto.DistrictPerformanceDto> list = new ArrayList<>();
        int rank = 1;
        for (Object[] r : dResults) {
            String dist = r[0] != null ? (String) r[0] : "Unknown";
            double succ = successMap.getOrDefault(dist, 0.0);
            list.add(OrganizationReportDataDto.DistrictPerformanceDto.builder()
                .district(dist)
                .supervisorName(supervisorByDistrict.get(dist))
                .beneficiaries(((Number) r[1]).longValue())
                .cases(((Number) r[2]).longValue())
                .activeCases(((Number) r[3]).longValue())
                .closedCases(((Number) r[4]).longValue())
                .successRate(Math.round(succ))
                .complianceRate(succ > 0 ? Math.min(100.0, succ + 10.0) : 0.0)
                .socialWorkersCount(workerMap.getOrDefault(dist, 0))
                .rank(rank++)
                .build());
        }
        list.sort((a, b) -> Double.compare(b.getSuccessRate(), a.getSuccessRate()));
        for (int i = 0; i < list.size(); i++) list.get(i).setRank(i + 1);
        return list;
    }

    private List<OrganizationReportDataDto.ChartDataPoint> getCasesByPriority(LocalDate start, LocalDate end) {
        Query q = entityManager.createNativeQuery(
                "SELECT priority, COUNT(*) FROM cases WHERE (created_at IS NULL OR created_at <= :end) " +
                "AND (closed_at IS NULL OR closed_at >= :start) GROUP BY priority");
        q.setParameter("start", start.atStartOfDay());
        q.setParameter("end", end.atTime(23, 59, 59));
        List<Object[]> rows = q.getResultList();
        List<OrganizationReportDataDto.ChartDataPoint> res = new ArrayList<>();
        for (Object[] r : rows) {
            String p = (String) r[0];
            res.add(new OrganizationReportDataDto.ChartDataPoint(p, ((Number) r[1]).longValue(), getColorForPriority(p)));
        }
        return res;
    }

    private List<OrganizationReportDataDto.ChartDataPoint> getCasesByStatus(LocalDate start, LocalDate end) {
        Query q = entityManager.createNativeQuery(
                "SELECT status, COUNT(*) FROM cases WHERE (created_at IS NULL OR created_at <= :end) " +
                "AND (closed_at IS NULL OR closed_at >= :start) GROUP BY status");
        q.setParameter("start", start.atStartOfDay());
        q.setParameter("end", end.atTime(23, 59, 59));
        List<Object[]> rows = q.getResultList();
        List<OrganizationReportDataDto.ChartDataPoint> res = new ArrayList<>();
        for (Object[] r : rows) {
            String s = (String) r[0];
            res.add(new OrganizationReportDataDto.ChartDataPoint(s, ((Number) r[1]).longValue(), getColorForStatus(s)));
        }
        return res;
    }

    private List<OrganizationReportDataDto.StaffPerformanceDto> getTopPerformers(LocalDate start, LocalDate end) {
        return getTopPerformersFiltered(start, end, null);
    }

    private List<OrganizationReportDataDto.InterventionStatsDto> getInterventionStats(LocalDate start, LocalDate end) {
        Query q = entityManager.createNativeQuery(
                "SELECT type, COUNT(*), AVG(effectiveness_percent) FROM interventions " +
                "WHERE created_at >= :start AND created_at <= :end GROUP BY type");
        q.setParameter("start", start.atStartOfDay());
        q.setParameter("end", end.atTime(23, 59, 59));
        List<Object[]> rows = q.getResultList();
        List<OrganizationReportDataDto.InterventionStatsDto> list = new ArrayList<>();
        for (Object[] r : rows) {
            list.add(new OrganizationReportDataDto.InterventionStatsDto(
                (String) r[0], ((Number) r[1]).longValue(), r[2] != null ? ((Number) r[2]).doubleValue() : 0.0
            ));
        }
        return list;
    }

    private List<OrganizationReportDataDto.ChartDataPoint> getMonthlyCaseTrend(LocalDate start, LocalDate end) {
        Query q = entityManager.createNativeQuery("SELECT created_at FROM cases WHERE created_at >= :start AND created_at <= :end");
        q.setParameter("start", start.atStartOfDay());
        q.setParameter("end", end.atTime(23, 59, 59));
        List<?> dates = q.getResultList();
        
        Map<Integer, Long> counts = new HashMap<>();
        for (Object t : dates) {
            LocalDateTime ldt;
            if (t instanceof Timestamp) {
                ldt = ((Timestamp) t).toLocalDateTime();
            } else if (t instanceof LocalDateTime) {
                ldt = (LocalDateTime) t;
            } else {
                continue;
            }
            int m = ldt.getMonthValue();
            counts.put(m, counts.getOrDefault(m, 0L) + 1);
        }
        
        List<OrganizationReportDataDto.ChartDataPoint> list = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            String mName = Month.of(i).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            list.add(new OrganizationReportDataDto.ChartDataPoint(mName, counts.getOrDefault(i, 0L), "#3b82f6"));
        }
        return list;
    }

    private List<OrganizationReportDataDto.ComplianceStatsDto> getComplianceStats(LocalDate start, LocalDate end) {
        Query q = entityManager.createNativeQuery(
            "SELECT created_at, status FROM reports WHERE created_at >= :start AND created_at <= :end AND report_type != 'ORGANIZATION'"
        );
        q.setParameter("start", start.atStartOfDay());
        q.setParameter("end", end.atTime(23, 59, 59));
        List<Object[]> rows = q.getResultList();
        
        Map<Integer, Integer> totalMap = new HashMap<>();
        Map<Integer, Integer> subMap = new HashMap<>();
        
        for (Object[] r : rows) {
            Object obj = r[0];
            LocalDateTime ldt = null;
            if (obj instanceof Timestamp) {
                ldt = ((Timestamp) obj).toLocalDateTime();
            } else if (obj instanceof LocalDateTime) {
                ldt = (LocalDateTime) obj;
            }
            if (ldt == null) continue;
            
            String status = (String) r[1];
            int m = ldt.getMonthValue();
            totalMap.put(m, totalMap.getOrDefault(m, 0) + 1);
            if ("FINAL".equals(status) || "SUBMITTED".equals(status) || "APPROVED".equals(status)) {
                subMap.put(m, subMap.getOrDefault(m, 0) + 1);
            }
        }
        
        List<OrganizationReportDataDto.ComplianceStatsDto> list = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            String mName = Month.of(i).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            int total = totalMap.getOrDefault(i, 0);
            int sub = subMap.getOrDefault(i, 0);
            
            double rate = total == 0 ? 0 : (sub * 100.0) / total;
            list.add(new OrganizationReportDataDto.ComplianceStatsDto(mName, sub, total, rate));
        }
        return list;
    }

    private Map<String, OrganizationReportDataDto.YoYMetric> getYoyMetrics(LocalDate start, LocalDate end) {
        LocalDate prevStart = start.minusYears(1);
        LocalDate prevEnd = end.minusYears(1);

        double curBen = countBeneficiaries(start, end);
        double prevBen = countBeneficiaries(prevStart, prevEnd);
        double curCases = ((Number) getCaseStats(start, end)[0]).doubleValue();
        double prevCases = ((Number) getCaseStats(prevStart, prevEnd)[0]).doubleValue();
        double curInts = countInterventionsInPeriod(start, end);
        double prevInts = countInterventionsInPeriod(prevStart, prevEnd);
        double curSucc = getOverallSuccessRate(start, end);
        double prevSucc = getOverallSuccessRate(prevStart, prevEnd);
        
        double curWorkers = countActiveUsers("SOCIAL_WORKER");
        double prevWorkers = curWorkers;

        Map<String, OrganizationReportDataDto.YoYMetric> map = new HashMap<>();
        map.put("beneficiaries", new OrganizationReportDataDto.YoYMetric(curBen, prevBen, calcChange(curBen, prevBen)));
        map.put("cases", new OrganizationReportDataDto.YoYMetric(curCases, prevCases, calcChange(curCases, prevCases)));
        map.put("interventions", new OrganizationReportDataDto.YoYMetric(curInts, prevInts, calcChange(curInts, prevInts)));
        map.put("success_rate", new OrganizationReportDataDto.YoYMetric(curSucc, prevSucc, curSucc - prevSucc));
        map.put("social_workers", new OrganizationReportDataDto.YoYMetric(curWorkers, prevWorkers, calcChange(curWorkers, prevWorkers)));
        return map;
    }

    private double calcChange(double cur, double prev) {
        if (prev == 0) return cur > 0 ? 100.0 : 0.0;
        return ((cur - prev) / prev) * 100.0;
    }

    private List<OrganizationReportDataDto.SuccessStoryDto> getSuccessStories(LocalDate start, LocalDate end) {
        try {
            Query q = entityManager.createNativeQuery(
                "SELECT i.id, i.title, b.full_name, i.description, i.outcomes_actual " +
                "FROM interventions i " +
                "JOIN cases c ON c.id = i.case_id " +
                "JOIN beneficiaries b ON b.identifier = c.beneficiary_identifier " +
                "WHERE i.status = 'COMPLETED' AND COALESCE(i.effectiveness_percent, 0) >= 80 " +
                "AND i.created_at >= :start AND i.created_at <= :end " +
                "ORDER BY i.effectiveness_percent DESC NULLS LAST LIMIT 5"
            );
            q.setParameter("start", start.atStartOfDay());
            q.setParameter("end", end.atTime(23, 59, 59));
            List<Object[]> rows = q.getResultList();
            List<OrganizationReportDataDto.SuccessStoryDto> list = new ArrayList<>();
            for (Object[] r : rows) {
                String bname = r[2] != null ? r[2].toString().trim() : "";
                String impact = r[4] != null ? r[4].toString() : "";
                if (impact.isBlank() && r[3] != null) {
                    impact = r[3].toString();
                }
                list.add(new OrganizationReportDataDto.SuccessStoryDto(
                        r[0].toString(),
                        r[1] != null ? (String) r[1] : "Intervention",
                        bname,
                        r[3] != null ? (String) r[3] : "",
                        impact,
                        null
                ));
            }
            return list;
        } catch (Exception e) {
            return List.of();
        }
    }

    private String getColorForPriority(String priority) {
        if (priority == null) return "#9ca3af";
        switch (priority.toUpperCase()) {
            case "HIGH": return "#ef4444";
            case "MEDIUM": return "#f59e0b";
            case "LOW": return "#10b981";
            default: return "#9ca3af";
        }
    }

    private String getColorForStatus(String status) {
        if (status == null) return "#9ca3af";
        switch (status.toUpperCase()) {
            case "OPEN": return "#3b82f6";
            case "IN_PROGRESS": return "#8b5cf6";
            case "CLOSED": return "#10b981";
            default: return "#9ca3af";
        }
    }

    private List<OrganizationReportDataDto.ChartDataPoint> getBeneficiaryRecoveryBands(LocalDate start, LocalDate end) {
        Query q = entityManager.createNativeQuery(
                "SELECT " +
                "SUM(CASE WHEN COALESCE(c.progress_percent, 0) BETWEEN 0 AND 25 THEN 1 ELSE 0 END), " +
                "SUM(CASE WHEN COALESCE(c.progress_percent, 0) BETWEEN 26 AND 50 THEN 1 ELSE 0 END), " +
                "SUM(CASE WHEN COALESCE(c.progress_percent, 0) BETWEEN 51 AND 75 THEN 1 ELSE 0 END), " +
                "SUM(CASE WHEN COALESCE(c.progress_percent, 0) BETWEEN 76 AND 100 THEN 1 ELSE 0 END) " +
                "FROM cases c WHERE (c.created_at IS NULL OR c.created_at <= :end) AND (c.closed_at IS NULL OR c.closed_at >= :start)");
        q.setParameter("start", start.atStartOfDay());
        q.setParameter("end", end.atTime(23, 59, 59));
        Object[] row = (Object[]) q.getSingleResult();
        List<OrganizationReportDataDto.ChartDataPoint> bands = new ArrayList<>();
        String[] labels = {"0-25%", "26-50%", "51-75%", "76-100%"};
        String[] colors = {"#ef4444", "#f59e0b", "#3b82f6", "#10b981"};
        for (int i = 0; i < 4; i++) {
            long v = row[i] != null ? ((Number) row[i]).longValue() : 0;
            bands.add(new OrganizationReportDataDto.ChartDataPoint(labels[i], v, colors[i]));
        }
        return bands;
    }

    private List<OrganizationReportDataDto.ChartDataPoint> getRecoveryProgressTrend(LocalDate start, LocalDate end) {
        long days = ChronoUnit.DAYS.between(start, end) + 1;
        List<OrganizationReportDataDto.ChartDataPoint> trend = new ArrayList<>();
        if (days <= 14) {
            for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
                trend.add(new OrganizationReportDataDto.ChartDataPoint(
                        d.toString(), avgProgressOnDate(d), "#0d9488"));
            }
        } else if (days <= 90) {
            for (LocalDate d = start; !d.isAfter(end); d = d.plusWeeks(1)) {
                LocalDate weekEnd = d.plusDays(6).isAfter(end) ? end : d.plusDays(6);
                trend.add(new OrganizationReportDataDto.ChartDataPoint(
                        d + " to " + weekEnd, avgProgressBetween(d, weekEnd), "#0d9488"));
            }
        } else {
            for (int m = 1; m <= 12; m++) {
                if (m < start.getMonthValue() && start.getYear() == end.getYear()) continue;
                if (m > end.getMonthValue() && start.getYear() == end.getYear()) break;
                LocalDate ms = LocalDate.of(start.getYear(), m, 1);
                if (ms.isBefore(start)) ms = start;
                LocalDate me = ms.withDayOfMonth(ms.lengthOfMonth());
                if (me.isAfter(end)) me = end;
                if (!ms.isAfter(end)) {
                    trend.add(new OrganizationReportDataDto.ChartDataPoint(
                            Month.of(m).getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                            avgProgressBetween(ms, me), "#0d9488"));
                }
            }
        }
        return trend;
    }

    private double avgProgressOnDate(LocalDate date) {
        Query q = entityManager.createNativeQuery(
                "SELECT AVG(COALESCE(progress_percent, 0)) FROM cases WHERE (created_at IS NULL OR created_at <= :end)");
        q.setParameter("end", date.atTime(23, 59, 59));
        Object res = q.getSingleResult();
        return res != null ? ((Number) res).doubleValue() : 0.0;
    }

    private double avgProgressBetween(LocalDate start, LocalDate end) {
        Query q = entityManager.createNativeQuery(
                "SELECT AVG(COALESCE(progress_percent, 0)) FROM cases WHERE created_at >= :start AND created_at <= :end");
        q.setParameter("start", start.atStartOfDay());
        q.setParameter("end", end.atTime(23, 59, 59));
        Object res = q.getSingleResult();
        return res != null ? Math.round(((Number) res).doubleValue() * 10) / 10.0 : 0.0;
    }

    private double getAverageBeneficiaryProgress(LocalDate start, LocalDate end) {
        return avgProgressBetween(start, end);
    }

    private List<OrganizationReportDataDto.ChartDataPoint> getCasesByCategory(LocalDate start, LocalDate end) {
        Query q = entityManager.createNativeQuery(
                "SELECT COALESCE(b.case_type, c.title, 'OTHER'), COUNT(*) FROM cases c " +
                "LEFT JOIN beneficiaries b ON b.identifier = c.beneficiary_identifier " +
                "WHERE (c.created_at IS NULL OR c.created_at <= :end) AND (c.closed_at IS NULL OR c.closed_at >= :start) " +
                "GROUP BY COALESCE(b.case_type, c.title, 'OTHER')");
        q.setParameter("start", start.atStartOfDay());
        q.setParameter("end", end.atTime(23, 59, 59));
        List<Object[]> rows = q.getResultList();
        List<OrganizationReportDataDto.ChartDataPoint> res = new ArrayList<>();
        for (Object[] r : rows) {
            res.add(new OrganizationReportDataDto.ChartDataPoint((String) r[0], ((Number) r[1]).longValue(), "#6366f1"));
        }
        return res;
    }

    private Map<String, Double> getPeriodComparison(LocalDate start, LocalDate end) {
        long periodDays = ChronoUnit.DAYS.between(start, end) + 1;
        LocalDate prevEnd = start.minusDays(1);
        LocalDate prevStart = prevEnd.minusDays(periodDays - 1);
        Map<String, Double> comp = new HashMap<>();
        comp.put("interventionsChange", calcChange(
                countInterventionsInPeriod(start, end),
                countInterventionsInPeriod(prevStart, prevEnd)));
        comp.put("successRateChange", getOverallSuccessRate(start, end) - getOverallSuccessRate(prevStart, prevEnd));
        comp.put("casesChange", calcChange(
                ((Number) getCaseStats(start, end)[0]).longValue(),
                ((Number) getCaseStats(prevStart, prevEnd)[0]).longValue()));
        comp.put("beneficiariesChange", calcChange(countBeneficiaries(start, end), countBeneficiaries(prevStart, prevEnd)));
        return comp;
    }

    private List<String> buildAlerts(OrganizationReportDataDto dto, LocalDate start, LocalDate end) {
        List<String> alerts = new ArrayList<>();
        if (dto.getDistrictPerformance() != null) {
            for (OrganizationReportDataDto.DistrictPerformanceDto d : dto.getDistrictPerformance()) {
                if (d.getSuccessRate() < 70) {
                    alerts.add(d.getDistrict() + " district success rate is " + Math.round(d.getSuccessRate())
                            + "% — intervention training recommended.");
                }
            }
        }
        Query overdueQ = entityManager.createNativeQuery(
                "SELECT u.full_name FROM reports r JOIN users u ON u.id = r.generated_by_id " +
                "WHERE r.status NOT IN ('SUBMITTED', 'APPROVED', 'FINAL') " +
                "AND r.report_type NOT IN ('ORGANIZATION', 'SUPERVISOR_TEAM') " +
                "AND r.period_end >= :start AND r.period_end <= :end LIMIT 5");
        overdueQ.setParameter("start", start);
        overdueQ.setParameter("end", end);
        for (Object name : (List<?>) overdueQ.getResultList()) {
            alerts.add("Pending report from: " + name);
        }
        if (dto.getOverallComplianceRate() < 80) {
            alerts.add("Organization report compliance is below 80% for the period.");
        }
        return alerts;
    }
}
