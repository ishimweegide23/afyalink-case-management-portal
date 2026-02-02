package com.afyalink.backend.dto.cases;

import com.afyalink.backend.dto.user.UserDto;
import com.afyalink.backend.enums.CaseEntryStatus;
import com.afyalink.backend.enums.CaseEntryType;
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
public class CaseEntryDto {
    private Long id;
    private Long caseId;
    private CaseEntryType type;
    private String title;
    private String content;
    private CaseEntryStatus status;
    private LocalDate dueDate;
    private LocalDate targetDate;
    private LocalDateTime completedAt;
    private Long relatedInterventionId;
    private UserDto author;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
