package com.afyalink.backend.dto.intervention;

import com.afyalink.backend.enums.CasePriority;
import com.afyalink.backend.enums.InterventionStatus;
import com.afyalink.backend.enums.InterventionType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UpdateInterventionRequest {
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
    private String outcomesPlanned;
    private String outcomesActual;
    private String resources;
    private Long approvedById;
}
