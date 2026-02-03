package com.afyalink.backend.dto.user;

import com.afyalink.backend.enums.UserRole;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 6)
    private String password;

    @NotNull
    private UserRole role;

    private String phoneNumber;
    private String department;
    private String jobTitle;

    private String province;
    private String district;
    private String sector;
    private String cell;
    private String village;

    private String assignedDistrict;
    private String assignedProvince;

    private Long supervisorId;
}
