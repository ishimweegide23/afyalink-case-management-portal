package com.afyalink.backend.config;

import com.afyalink.backend.enums.CasePriority;
import com.afyalink.backend.enums.CaseStatus;
import com.afyalink.backend.enums.InterventionStatus;
import com.afyalink.backend.enums.InterventionType;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.model.Case;
import com.afyalink.backend.model.Intervention;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.CaseRepository;
import com.afyalink.backend.repository.InterventionRepository;
import com.afyalink.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;

import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Seeds sample interventions (and minimal user/case if missing) so the All Interventions page shows data.
 * Runs only when there are no interventions. Use profile "seed" or leave default to run on first startup.
 */
@Component
@Order(1)
@Slf4j
@RequiredArgsConstructor
public class InterventionSeedDataLoader implements ApplicationRunner {

    private final InterventionRepository interventionRepository;
    private final CaseRepository caseRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (interventionRepository.countByDeletedAtIsNull() > 0) {
            log.debug("Interventions already exist, skipping seed.");
            return;
        }
        log.info("No interventions found. Seeding sample data...");

        User planner = ensureAdminUser();
        Case caseRecord = ensureCase(planner);

        String code1 = "INT-SEED-" + System.currentTimeMillis();
        String code2 = "INT-SEED-" + (System.currentTimeMillis() + 1);
        String code3 = "INT-SEED-" + (System.currentTimeMillis() + 2);
        String code4 = "INT-SEED-" + (System.currentTimeMillis() + 3);
        String code5 = "INT-SEED-" + (System.currentTimeMillis() + 4);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1);
        LocalDateTime nextWeek = now.plusDays(7);

        saveIntervention(Intervention.builder()
                .caseRecord(caseRecord)
                .interventionCode(code1)
                .title("Home Visit - Family Follow-up")
                .type(InterventionType.HOME_VISIT)
                .category("Social Support")
                .description("Follow-up home visit to assess family stability and child welfare after initial assessment.")
                .priority(CasePriority.HIGH)
                .location("Gasabo District, Kigali")
                .plannedStartDatetime(tomorrow.toLocalDate().atStartOfDay().plusHours(9))
                .plannedEndDatetime(tomorrow.toLocalDate().atStartOfDay().plusHours(11))
                .durationMinutes(120)
                .status(InterventionStatus.PLANNED)
                .outcomesPlanned("Confirm safe environment; update care plan.")
                .resources("Transport, assessment forms")
                .plannedBy(planner)
                .build());

        saveIntervention(Intervention.builder()
                .caseRecord(caseRecord)
                .interventionCode(code2)
                .title("Medical Referral - Health Check")
                .type(InterventionType.MEDICAL)
                .category("Healthcare")
                .description("Coordinate and document medical referral for beneficiary health screening.")
                .priority(CasePriority.MEDIUM)
                .location("Health Center, Remera")
                .plannedStartDatetime(nextWeek.toLocalDate().atStartOfDay().plusHours(8))
                .plannedEndDatetime(nextWeek.toLocalDate().atStartOfDay().plusHours(10))
                .durationMinutes(120)
                .status(InterventionStatus.SCHEDULED)
                .outcomesPlanned("Completed referral; medical report on file.")
                .resources("Referral form, transport")
                .plannedBy(planner)
                .build());

        saveIntervention(Intervention.builder()
                .caseRecord(caseRecord)
                .interventionCode(code3)
                .title("Counseling Session - Psychosocial Support")
                .type(InterventionType.COUNSELING)
                .category("Psychosocial Support")
                .description("One-on-one counseling session to support emotional wellbeing.")
                .priority(CasePriority.MEDIUM)
                .location("Community Center")
                .plannedStartDatetime(now.minusHours(1))
                .plannedEndDatetime(now.plusHours(1))
                .durationMinutes(60)
                .status(InterventionStatus.IN_PROGRESS)
                .outcomesPlanned("Session completed; follow-up plan agreed.")
                .resources("Consent form, private room")
                .plannedBy(planner)
                .build());

        saveIntervention(Intervention.builder()
                .caseRecord(caseRecord)
                .interventionCode(code4)
                .title("Education Support - School Enrollment")
                .type(InterventionType.EDUCATION)
                .category("Academic Support")
                .description("Support beneficiary with school enrollment and material provision.")
                .priority(CasePriority.HIGH)
                .location("Local Primary School")
                .plannedStartDatetime(now.minusDays(2))
                .plannedEndDatetime(now.minusDays(2).plusHours(2))
                .durationMinutes(120)
                .status(InterventionStatus.COMPLETED)
                .completedAt(now.minusDays(2))
                .completionNotes("Enrollment completed. Materials provided.")
                .effectivenessPercent(90)
                .outcomesPlanned("Child enrolled; materials provided.")
                .outcomesActual("Child enrolled in P2; received books and uniform.")
                .resources("Enrollment forms, school supplies")
                .plannedBy(planner)
                .build());

        saveIntervention(Intervention.builder()
                .caseRecord(caseRecord)
                .interventionCode(code5)
                .title("Life Skills Training - Youth Group")
                .type(InterventionType.TRAINING)
                .category("Vocational")
                .description("Group training on basic life skills and vocational orientation.")
                .priority(CasePriority.MEDIUM)
                .location("Youth Center, Kicukiro")
                .plannedStartDatetime(nextWeek.plusDays(1).toLocalDate().atStartOfDay().plusHours(14))
                .durationMinutes(180)
                .status(InterventionStatus.PLANNED)
                .outcomesPlanned("Attendance recorded; feedback collected.")
                .resources("Training materials, venue")
                .plannedBy(planner)
                .build());

        log.info("Intervention seed data created successfully.");
    }

    private User ensureAdminUser() {
        return userRepository.findByEmail("admin@afyalink.rw")
                .orElseGet(() -> {
                    User admin = User.builder()
                            .fullName("System Admin")
                            .email("admin@afyalink.rw")
                            .passwordHash(passwordEncoder.encode("Admin@123"))
                            .role(UserRole.ADMIN)
                            .isActive(true)
                            .build();
                    return userRepository.save(admin);
                });
    }

    private Case ensureCase(User createdBy) {
        String caseNum = "CASE-SEED-" + UUID.randomUUID().toString().substring(0, 8);
        if (caseRepository.existsByCaseNumber(caseNum)) {
            return caseRepository.findByCaseNumber(caseNum).orElseThrow();
        }
        Case c = Case.builder()
                .caseNumber(caseNum)
                .title("Seed case for interventions demo")
                .beneficiaryName("Demo Beneficiary")
                .beneficiaryIdentifier("BEN-SEED-001")
                .status(CaseStatus.OPEN)
                .priority(CasePriority.MEDIUM)
                .createdBy(createdBy)
                .openedAt(LocalDateTime.now())
                .progressPercent(0)
                .build();
        return caseRepository.save(c);
    }

    private void saveIntervention(Intervention i) {
        interventionRepository.save(i);
    }
}
