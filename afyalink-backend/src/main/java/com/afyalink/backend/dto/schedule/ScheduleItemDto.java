package com.afyalink.backend.dto.schedule;

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
public class ScheduleItemDto {
    public static final String TYPE_INTERVENTION = "INTERVENTION";
    public static final String TYPE_TASK = "TASK";

    private String type;
    private Long id;
    private String title;
    private LocalDateTime scheduleDateTime;
    private LocalDateTime endDateTime;
    private String status;
    private Long caseId;
    private String caseNumber;
    private String beneficiaryName;
    private Integer durationMinutes;
    private String location;
    private String interventionCode;
    private String content;
    /** For TASK items linked to an intervention. */
    private Long relatedInterventionId;
}
