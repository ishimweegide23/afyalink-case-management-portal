package com.afyalink.backend.dto.cases;

import com.afyalink.backend.dto.user.UserDto;
import com.afyalink.backend.enums.CasePriority;
import com.afyalink.backend.enums.CaseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseDto {
    private Long id;
    private String caseNumber;
    private String title;
    private String beneficiaryName;
    private String beneficiaryIdentifier;
    private CaseStatus status;
    private CasePriority priority;
    private UserDto assignedSocialWorker;
    /** Supervisor of assigned social worker (for admin visibility). */
    private String assignedSocialWorkerSupervisorName;
    private Long assignedSocialWorkerSupervisorId;
    private UserDto createdBy;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private LocalDate nextFollowUpDate;
    private Integer progressPercent;
    private Integer interventionCount;
    private Integer totalTaskCount;
    private Integer completedTaskCount;
    private Integer documentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
