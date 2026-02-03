package com.afyalink.backend.dto.user;

import com.afyalink.backend.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String fullName;
    private String email;
    private UserRole role;
    private String phoneNumber;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    private UserProfileDto profile;

    private String province;
    private String district;
    private String sector;
    private String cell;
    private String village;
    private String assignedDistrict;
    private String assignedProvince;

    private Long supervisorId;
    private String supervisorName;
}
