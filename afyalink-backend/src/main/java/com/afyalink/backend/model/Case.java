package com.afyalink.backend.model;

import com.afyalink.backend.enums.CasePriority;
import com.afyalink.backend.enums.CaseStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "cases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Case {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_number", unique = true, nullable = false)
    private String caseNumber;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "beneficiary_name", nullable = false)
    private String beneficiaryName;

    @Column(name = "beneficiary_identifier")
    private String beneficiaryIdentifier;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private CaseStatus status = CaseStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    @Builder.Default
    private CasePriority priority = CasePriority.MEDIUM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_social_worker_id")
    private User assignedSocialWorker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_id")
    private User updatedBy;

    @Column(name = "opened_at")
    private LocalDateTime openedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "next_follow_up_date")
    private LocalDate nextFollowUpDate;

    @Column(name = "progress_percent")
    @Builder.Default
    private Integer progressPercent = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @org.hibernate.annotations.Formula("(SELECT COUNT(*) FROM interventions i WHERE i.case_id = id)")
    private Integer interventionCount;

    @org.hibernate.annotations.Formula("(SELECT COUNT(*) FROM case_entries e WHERE e.case_id = id AND e.type = 'TASK')")
    private Integer totalTaskCount;

    @org.hibernate.annotations.Formula("(SELECT COUNT(*) FROM case_entries e WHERE e.case_id = id AND e.type = 'TASK' AND e.status = 'COMPLETED')")
    private Integer completedTaskCount;

    @org.hibernate.annotations.Formula("(SELECT COUNT(*) FROM documents d WHERE d.case_id = id)")
    private Integer documentCount;

    // Relationships
    @OneToMany(mappedBy = "caseRecord", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<CaseEntry> entries;

    @OneToMany(mappedBy = "caseRecord", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Intervention> interventions;

    @OneToMany(mappedBy = "caseRecord", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Document> documents;

    @OneToMany(mappedBy = "caseRecord", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Message> messages;

    @OneToMany(mappedBy = "relatedCase", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Notification> notifications;
}
