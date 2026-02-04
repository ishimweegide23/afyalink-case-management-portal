package com.afyalink.backend.model;

import com.afyalink.backend.enums.CasePriority;
import com.afyalink.backend.enums.InterventionStatus;
import com.afyalink.backend.enums.InterventionType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "interventions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Intervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private Case caseRecord;

    @Column(name = "intervention_code", unique = true, nullable = false)
    private String interventionCode;

    @Column(name = "title", nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private InterventionType type;

    @Column(name = "category")
    private String category;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority")
    @Builder.Default
    private CasePriority priority = CasePriority.MEDIUM;

    @Column(name = "location")
    private String location;

    @Column(name = "planned_start_datetime")
    private LocalDateTime plannedStartDatetime;

    @Column(name = "planned_end_datetime")
    private LocalDateTime plannedEndDatetime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private InterventionStatus status = InterventionStatus.PLANNED;

    @Column(name = "completion_notes", columnDefinition = "TEXT")
    private String completionNotes;

    @Column(name = "effectiveness_percent")
    private Integer effectivenessPercent;

    @Column(name = "effectiveness_star_rating")
    private Integer effectivenessStarRating;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "supervisor_comments", columnDefinition = "TEXT")
    private String supervisorComments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planned_by_id")
    private User plannedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @Column(name = "outcomes_planned", columnDefinition = "TEXT")
    private String outcomesPlanned;

    @Column(name = "outcomes_actual", columnDefinition = "TEXT")
    private String outcomesActual;

    @Column(name = "resources", columnDefinition = "TEXT")
    private String resources;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // Relationships
    @OneToMany(mappedBy = "intervention", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<InterventionStaff> staffAssignments;

    @OneToMany(mappedBy = "intervention", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Document> documents;

    @OneToMany(mappedBy = "relatedIntervention", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Notification> notifications;
}
