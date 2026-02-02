package com.afyalink.backend.dto.intervention;

import com.afyalink.backend.dto.user.UserDto;
import com.afyalink.backend.enums.CasePriority;
import com.afyalink.backend.enums.InterventionStatus;
import com.afyalink.backend.enums.InterventionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InterventionDto {
    private Long id;
    private Long caseId;
    private String caseNumber;
    private String caseBeneficiaryName;
    private String interventionCode;
    private String title;
    private InterventionType type;
    private String category;
    private String description;
    private CasePriority priority;
    private String location;
    private LocalDateTime plannedStartDatetime;
    private LocalDateTime plannedEndDatetime;
    private Integer durationMinutes;
    private InterventionStatus status;
    private LocalDateTime completedAt;
    private String completionNotes;
    private Integer effectivenessPercent;
    private Integer effectivenessStarRating;
    private String supervisorComments;
    private UserDto plannedBy;
    private UserDto approvedBy;
    private String outcomesPlanned;
    private String outcomesActual;
    private String resources;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** Assigned staff with supervisor info (for admin visibility). */
    private List<InterventionStaffDto> assignedStaff;
}
