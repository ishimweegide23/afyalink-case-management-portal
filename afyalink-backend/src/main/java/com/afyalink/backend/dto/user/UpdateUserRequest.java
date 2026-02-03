package com.afyalink.backend.dto.user;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String fullName;
    private String phoneNumber;
    private String department;
    private String jobTitle;
    private String avatarInitials;
    private String avatarUrl;
    private String bio;

    private String province;
    private String district;
    private String sector;
    private String cell;
    private String village;

    private String assignedDistrict;
    private String assignedProvince;

    private Long supervisorId;
}
