package com.afyalink.backend.dto.intervention;

import com.afyalink.backend.enums.CasePriority;
import com.afyalink.backend.enums.InterventionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateInterventionRequest {
    @NotNull(message = "Case ID is required")
    private Long caseId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Type is required")
    private InterventionType type;

    private String category;
    private String description;
    private CasePriority priority;
    private String location;
    private LocalDateTime plannedStartDatetime;
    private LocalDateTime plannedEndDatetime;
    private Integer durationMinutes;
    private String outcomesPlanned;
    private String resources;
}
