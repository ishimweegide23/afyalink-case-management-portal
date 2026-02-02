package com.afyalink.backend.dto.dashboard;

import com.afyalink.backend.dto.cases.CaseDto;
import com.afyalink.backend.dto.intervention.InterventionDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TodaySummaryDto {
    private List<InterventionDto> todayInterventions;
    private List<InterventionDto> overdueInterventions;
    private List<CaseDto> casesWithoutInterventions;
    private List<OverdueTaskDto> overdueTasks;
    private List<CaseDto> overdueFollowUps;
    private List<ActivityLogDto> recentActivities;
    private TodayStatsDto stats;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class OverdueTaskDto {
        private Long taskId;
        private String taskTitle;
        private String dueDate;
        private Long caseId;
        private String caseNumber;
        private String beneficiaryName;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ActivityLogDto {
        private Long id;
        private String type;
        private String title;
        private String content;
        private String caseNumber;
        private String beneficiaryName;
        private String createdAt;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class TodayStatsDto {
        private int totalScheduledToday;
        private int completedToday;
        private int pendingToday;
        private int overdueTaskCount;
        private int casesNeedingIntervention;
        private int overdueFollowUpCount;
    }
}
