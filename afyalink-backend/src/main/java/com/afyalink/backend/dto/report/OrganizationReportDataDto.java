// Verified method logic and removed dead code
package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationReportDataDto {
    private int totalSocialWorkers;
    private int totalSupervisors;
    private long totalBeneficiariesServed;
    private long totalCasesManaged;
    // Named to match frontend field names
    private long activeCases;
    private long closedCases;
    private double overallSuccessRate;
    private double overallComplianceRate;

    private List<DistrictPerformanceDto> districtPerformance;
    private List<ChartDataPoint> casesByPriority;
    private List<ChartDataPoint> casesByStatus;
    private List<ChartDataPoint> monthlyCaseTrend;
    
    private List<StaffPerformanceDto> topPerformers;
    private List<InterventionStatsDto> interventionStats;
    private List<ComplianceStatsDto> complianceStats;

    // Optional Year-Over-Year data if requested
    private Map<String, YoYMetric> yoyMetrics;
    
    private List<SuccessStoryDto> successStories;

    private long interventionsCompleted;
    private List<ChartDataPoint> beneficiaryRecoveryBands;
    private List<ChartDataPoint> recoveryProgressTrend;
    private List<ChartDataPoint> casesByCategory;
    private List<String> alerts;
    private String topDistrictByCases;
    private String topDistrictByBeneficiaries;
    private double averageBeneficiaryProgress;
    private Map<String, Double> periodComparison;

  /** User-facing warning when the selected range was adjusted or has no records */
    private String warningMessage;
    /** True when the entire selected period is before system start — all metrics are zero */
    private boolean noDataInRange;

    public long getTotalActiveCases() {
        return activeCases;
    }

    public long getTotalClosedCases() {
        return closedCases;
    }

    public long getTotalInterventionsCompleted() {
        return interventionsCompleted;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DistrictPerformanceDto {
        private String district;
        private String supervisorName;
        private long beneficiaries;
        private long cases;
        private long activeCases;
        private long closedCases;
        private double successRate;
        private double complianceRate;
        private int socialWorkersCount;
        private int rank;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartDataPoint {
        private String label;
        private Number value;
        private String color;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StaffPerformanceDto {
        private Long userId;
        private String name;
        private String district;
        private long casesManaged;
        private double successRate;
        private String recognition;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterventionStatsDto {
        private String type;
        private long count;
        private double successRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComplianceStatsDto {
        private String month;
        private int submitted;
        private int total;
        private double rate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class YoYMetric {
        private double currentYearValue;
        private double previousYearValue;
        private double percentageChange;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuccessStoryDto {
        private String id;
        private String title;
        private String beneficiaryName;
        private String description;
        private String impact;
        private String base64Image;
    }
}
