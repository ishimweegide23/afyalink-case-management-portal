package com.afyalink.backend.dto.message;

import com.afyalink.backend.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageableUserDto {
    private Long id;
    private String fullName;
    private String email;
    private UserRole role;
    private String avatarUrl;
}
