package com.afyalink.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
@EnableJpaRepositories(basePackages = "com.afyalink.backend.repository")
@EnableConfigurationProperties
public class AfyalinkBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(AfyalinkBackendApplication.class, args);
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.boot.CommandLineRunner fixCheckConstraints(org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // Hibernate 6 generates CHECK constraints for enums which break when new enums are added.
                // We drop these constraints so the DB accepts the new enum values.
                jdbcTemplate.execute("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check");
                jdbcTemplate.execute("ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check");
                jdbcTemplate.execute("ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_report_type_check");
            } catch (Exception e) {
                // Ignore if it fails
            }
        };
    }
}
