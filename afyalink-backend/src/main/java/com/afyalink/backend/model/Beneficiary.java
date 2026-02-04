package com.afyalink.backend.model;

import com.afyalink.backend.enums.BeneficiaryStatus;
import com.afyalink.backend.enums.VulnerabilityLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "beneficiaries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Beneficiary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "identifier", unique = true, nullable = false, length = 32)
    private String identifier;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "category", length = 64)
    private String category;

    @Column(name = "case_type", length = 64)
    private String caseType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private BeneficiaryStatus status = BeneficiaryStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "vulnerability_level")
    @Builder.Default
    private VulnerabilityLevel vulnerabilityLevel = VulnerabilityLevel.MEDIUM;

    @Column(name = "district", length = 64)
    private String district;

    @Column(name = "sector", length = 64)
    private String sector;

    @Column(name = "cell", length = 64)
    private String cell;

    @Column(name = "village", length = 64)
    private String village;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "phone_number", length = 32)
    private String phoneNumber;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "guardian_name", length = 255)
    private String guardianName;

    @Column(name = "guardian_phone", length = 32)
    private String guardianPhone;

    @Column(name = "guardian_relation", length = 64)
    private String guardianRelation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_social_worker_id", nullable = false)
    private User assignedSocialWorker;

    @Column(name = "needs", columnDefinition = "TEXT")
    private String needs; // comma-separated list, e.g. "Education,Healthcare,Nutrition"

    @Column(name = "profile_picture_path", length = 512)
    private String profilePicturePath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_id")
    private User updatedBy;
}
