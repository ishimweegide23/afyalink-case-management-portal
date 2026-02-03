package com.afyalink.backend.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserProfileDto {
    private String department;
    private String jobTitle;
    private String avatarInitials;
    private String avatarUrl;
    private String profilePictureUrl;
    private String bio;
}
