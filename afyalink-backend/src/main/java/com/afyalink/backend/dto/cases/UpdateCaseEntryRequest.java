package com.afyalink.backend.dto.cases;

import com.afyalink.backend.enums.CaseEntryStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class UpdateCaseEntryRequest {
    private String title;
    private String content;
    private CaseEntryStatus status;
    private LocalDateTime completedAt;
    private LocalDate dueDate;
    private LocalDate targetDate;
}
