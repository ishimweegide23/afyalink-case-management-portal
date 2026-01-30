package com.afyalink.backend.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Runs on application startup to apply PostgreSQL CHECK constraints for completion dates
 * to ensure that cases, interventions, and case entries cannot be completed in the future.
 */
@Component
@Order(2) // Runs after seeding data to ensure initial data doesn't violate any rules
@Slf4j
public class DatabaseConstraintRunner implements ApplicationRunner {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("Applying database date-validation CHECK constraints...");

        // Constraint 1: Intervention completion date validation
        try {
            entityManager.createNativeQuery("ALTER TABLE interventions DROP CONSTRAINT IF EXISTS chk_intervention_completed_at").executeUpdate();
            entityManager.createNativeQuery("ALTER TABLE interventions ADD CONSTRAINT chk_intervention_completed_at CHECK (status != 'COMPLETED' OR completed_at <= CURRENT_TIMESTAMP)").executeUpdate();
            log.info("Successfully applied database constraint: chk_intervention_completed_at");
        } catch (Exception e) {
            log.error("Failed to apply check constraint chk_intervention_completed_at. Ensure completed_at column exists.", e);
        }

        // Constraint 2: Case closure date validation
        try {
            entityManager.createNativeQuery("ALTER TABLE cases DROP CONSTRAINT IF EXISTS chk_case_closed_at").executeUpdate();
            entityManager.createNativeQuery("ALTER TABLE cases ADD CONSTRAINT chk_case_closed_at CHECK (status != 'CLOSED' OR closed_at <= CURRENT_TIMESTAMP)").executeUpdate();
            log.info("Successfully applied database constraint: chk_case_closed_at");
        } catch (Exception e) {
            log.error("Failed to apply check constraint chk_case_closed_at.", e);
        }

        // Constraint 3: CaseEntry completion date validation
        try {
            entityManager.createNativeQuery("ALTER TABLE case_entries DROP CONSTRAINT IF EXISTS chk_case_entry_completed_at").executeUpdate();
            entityManager.createNativeQuery("ALTER TABLE case_entries ADD CONSTRAINT chk_case_entry_completed_at CHECK (status != 'COMPLETED' OR completed_at <= CURRENT_TIMESTAMP)").executeUpdate();
            log.info("Successfully applied database constraint: chk_case_entry_completed_at");
        } catch (Exception e) {
            log.error("Failed to apply check constraint chk_case_entry_completed_at.", e);
        }
    }
}
