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
public class SupervisorWorkloadDto {

    private Long id;
    private String fullName;
    private String email;
    private int teamSize;
    private double avgTeamPerformance;
    private int activeCases;
    private List<WorkerSummaryDto> workers;
}
