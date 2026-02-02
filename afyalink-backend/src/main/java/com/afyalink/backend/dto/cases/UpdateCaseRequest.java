package com.afyalink.backend.dto.cases;

import com.afyalink.backend.enums.CasePriority;
import com.afyalink.backend.enums.CaseStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class UpdateCaseRequest {
    private String title;
    private String beneficiaryName;
    private String beneficiaryIdentifier;
    private CaseStatus status;
    private LocalDateTime closedAt;
    private CasePriority priority;
    private Long assignedSocialWorkerId;
    private LocalDate nextFollowUpDate;
    private Integer progressPercent;
}
