package com.afyalink.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Stores system configuration as key-value pairs scoped by category.
 * Categories align with the frontend System Configuration tabs:
 * organization, security, notifications, email, data, integration, appearance, localization.
 */
@Entity
@Table(
    name = "system_settings",
    uniqueConstraints = @UniqueConstraint(columnNames = { "category", "key" })
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Category of the setting (e.g. organization, security, notifications, email, data, integration, appearance, localization).
     * Nullable for backward compatibility with existing flat key-value rows.
     */
    @Column(name = "category", length = 64)
    private String category;

    @Column(name = "key", nullable = false, length = 255)
    private String key;

    @Column(name = "value", columnDefinition = "TEXT")
    private String value;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_id")
    private User updatedBy;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Category names matching the frontend System Configuration tabs. */
    public static final String CAT_ORGANIZATION = "organization";
    public static final String CAT_SECURITY = "security";
    public static final String CAT_NOTIFICATIONS = "notifications";
    public static final String CAT_EMAIL = "email";
    public static final String CAT_DATA = "data";
    public static final String CAT_INTEGRATION = "integration";
    public static final String CAT_APPEARANCE = "appearance";
    public static final String CAT_LOCALIZATION = "localization";
}
