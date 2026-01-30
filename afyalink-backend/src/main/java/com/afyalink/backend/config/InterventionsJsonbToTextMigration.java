package com.afyalink.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-time migration: alter interventions JSONB columns to TEXT so plain strings
 * (e.g. from seed data) can be stored without "invalid input syntax for type json" errors.
 */
@Component
@Order(0)
@Slf4j
@RequiredArgsConstructor
public class InterventionsJsonbToTextMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        if (!tableExists("interventions")) {
            log.debug("Table interventions does not exist yet; migration skipped.");
            return;
        }
        alterToTextIfJsonb("outcomes_planned");
        alterToTextIfJsonb("outcomes_actual");
        alterToTextIfJsonb("resources");
    }

    private boolean tableExists(String tableName) {
        try {
            Integer n = jdbcTemplate.queryForObject(
                "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ?",
                Integer.class, tableName);
            return n != null;
        } catch (Exception e) {
            return false;
        }
    }

    private void alterToTextIfJsonb(String columnName) {
        try {
            String type = jdbcTemplate.queryForObject(
                "SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'interventions' AND column_name = ?",
                String.class, columnName);
            if (type == null || "text".equalsIgnoreCase(type)) {
                log.trace("interventions.{} already TEXT", columnName);
                return;
            }
            if ("jsonb".equalsIgnoreCase(type) || "json".equalsIgnoreCase(type)) {
                jdbcTemplate.execute(
                    "ALTER TABLE interventions ALTER COLUMN " + columnName + " TYPE TEXT USING " + columnName + "::text");
                log.info("interventions.{} migrated from {} to TEXT", columnName, type);
            }
        } catch (Exception e) {
            log.warn("Could not migrate interventions.{} to TEXT: {}", columnName, e.getMessage());
        }
    }
}
