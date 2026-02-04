package com.afyalink.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "report_type", nullable = false, length = 50)
    private String reportType; // DAILY, WEEKLY, MONTHLY, YEARLY, BENEFICIARY_COMPLETION, CUSTOM

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "narrative", columnDefinition = "TEXT")
    private String narrative;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, FINAL, SUBMITTED, ARCHIVED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by_id", nullable = false)
    private User generatedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id")
    private User targetUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_case_id")
    private Case relatedCase;

    @Column(name = "attachment_count", nullable = false, columnDefinition = "integer default 0")
    @Builder.Default
    private Integer attachmentCount = 0;

    @Column(name = "photo_count", nullable = false, columnDefinition = "integer default 0")
    @Builder.Default
    private Integer photoCount = 0;

    @Column(name = "location", length = 255)
    private String location;

    /** WEEKLY, MONTHLY, YEARLY for ORGANIZATION reports */
    @Column(name = "org_period_type", length = 20)
    private String orgPeriodType;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "supervisor_feedback", columnDefinition = "TEXT")
    private String supervisorFeedback;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
