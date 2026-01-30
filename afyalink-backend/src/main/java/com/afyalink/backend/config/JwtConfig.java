package com.afyalink.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtConfig {
    private String secret = "afyalink_super_secret_key_change_in_production_2024";
    private long expiration = 86400000L;
}
