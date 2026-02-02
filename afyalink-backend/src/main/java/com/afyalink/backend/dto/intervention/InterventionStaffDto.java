package com.afyalink.backend.dto.intervention;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InterventionStaffDto {
    private Long id;
    private Long interventionId;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private String roleInIntervention;
    /** Supervisor of this staff member when they are a social worker (for admin visibility). */
    private String supervisorName;
    private LocalDateTime assignedAt;
}
