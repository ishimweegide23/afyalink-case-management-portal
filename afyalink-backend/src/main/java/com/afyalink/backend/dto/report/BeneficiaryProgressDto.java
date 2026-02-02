package com.afyalink.backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiaryProgressDto {
    private Long beneficiaryId;
    private String identifier;
    private String fullName;
    private String category;
    private String status;
    private Integer caseProgressPercent;
    private String caseNumber;
    private Long caseId;
    private long interventionsCount;
    private long completedInterventionsCount;
    private String district;
}
