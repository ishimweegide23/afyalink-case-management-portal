package com.afyalink.backend.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserPreferencesDto {
    private boolean caseUpdates;
    private boolean caseAssignments;
    private boolean interventionReminders;
    private boolean taskDeadlines;
    private boolean weeklySummary;
    private boolean emailNotifications;
    private boolean smsNotifications;
    private boolean pushNotifications;
    private String language;
    private String theme;
    private String timezone;
    private String dateFormat;
    private boolean compactMode;
    private boolean animationsEnabled;
}
