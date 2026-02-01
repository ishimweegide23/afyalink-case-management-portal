package com.afyalink.backend.dto.auth;

import lombok.Data;

@Data
public class TwoFactorVerifyRequest {
    private Long userId;
    private String code;
}
