package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamSummaryDto {
    private List<SocialWorkerSummaryDto> members;
    private long teamTotalCases;
    private double teamAvgProgress;
    private double teamCompletionRate;
    private SocialWorkerSummaryDto mostActiveWorker;
    private SocialWorkerSummaryDto leastActiveWorker;
    private List<SocialWorkerSummaryDto> workersWithNoActivity;
}
