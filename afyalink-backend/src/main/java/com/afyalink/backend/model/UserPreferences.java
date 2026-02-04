package com.afyalink.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_preferences", uniqueConstraints = @UniqueConstraint(columnNames = "user_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreferences {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "case_updates")
    @Builder.Default
    private boolean caseUpdates = true;

    @Column(name = "case_assignments")
    @Builder.Default
    private boolean caseAssignments = true;

    @Column(name = "intervention_reminders")
    @Builder.Default
    private boolean interventionReminders = true;

    @Column(name = "task_deadlines")
    @Builder.Default
    private boolean taskDeadlines = true;

    @Column(name = "weekly_summary")
    @Builder.Default
    private boolean weeklySummary = true;

    @Column(name = "email_notifications")
    @Builder.Default
    private boolean emailNotifications = true;

    @Column(name = "sms_notifications")
    @Builder.Default
    private boolean smsNotifications = false;

    @Column(name = "push_notifications")
    @Builder.Default
    private boolean pushNotifications = true;

    @Column(name = "language", length = 5)
    @Builder.Default
    private String language = "en";

    @Column(name = "theme", length = 20)
    @Builder.Default
    private String theme = "light";

    @Column(name = "timezone", length = 50)
    private String timezone;

    @Column(name = "date_format", length = 20)
    private String dateFormat;

    @Column(name = "compact_mode")
    @Builder.Default
    private boolean compactMode = false;

    @Column(name = "animations_enabled")
    @Builder.Default
    private boolean animationsEnabled = true;
}
