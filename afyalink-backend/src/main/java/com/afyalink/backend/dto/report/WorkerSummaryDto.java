package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerSummaryDto {

    private Long id;
    private String fullName;
    private String email;
    private int overallScore;
    private int casesCompleted;
    private int casesAssigned;
}
