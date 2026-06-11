// TODO: Add more comprehensive unit tests for this block
package com.afyalink.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TwoFactorStatusResponse {
    private boolean enabled;
    private String method;
}
