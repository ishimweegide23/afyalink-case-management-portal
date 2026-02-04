package com.afyalink.backend.model;

import com.afyalink.backend.enums.UserRole;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRole role;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "is_active", nullable = false)
    @JsonProperty("isActive")
    private boolean isActive = true;

    @Column(name = "province", length = 64)
    private String province;

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

    /** District a SUPERVISOR manages (team assignment scope). */
    @Column(name = "assigned_district", length = 64)
    private String assignedDistrict;

    @Column(name = "assigned_province", length = 64)
    private String assignedProvince;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "two_factor_enabled", nullable = false)
    private boolean twoFactorEnabled = false;

    @Column(name = "two_factor_method")
    private String twoFactorMethod = "EMAIL";

    @Column(name = "two_factor_verified_at")
    private LocalDateTime twoFactorVerifiedAt;

    // Relationships
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private UserProfile userProfile;

    @OneToMany(mappedBy = "assignedSocialWorker", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Case> assignedCases;

    @OneToMany(mappedBy = "assignedSocialWorker", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Beneficiary> assignedBeneficiaries;

    @OneToMany(mappedBy = "createdBy", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Case> createdCases;

    @OneToMany(mappedBy = "plannedBy", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Intervention> plannedInterventions;

    @OneToMany(mappedBy = "uploadedBy", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Document> uploadedDocuments;

    @OneToMany(mappedBy = "sender", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Message> sentMessages;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Notification> notifications;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<AuditLog> auditLogs;

    /** Supervisor for SOCIAL_WORKER; null for ADMIN/SUPERVISOR. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id")
    @JsonIgnore
    private User supervisor;

    @OneToMany(mappedBy = "supervisor", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<User> supervisedWorkers;
}
