package com.afyalink.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableAsync
@EnableJpaAuditing
public class AuditConfig {
    // Enables @CreationTimestamp and @UpdateTimestamp
    // and @CreatedDate / @LastModifiedDate from Spring Data
}
