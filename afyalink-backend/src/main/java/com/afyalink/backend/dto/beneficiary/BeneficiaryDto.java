package com.afyalink.backend.dto.beneficiary;

import com.afyalink.backend.dto.user.UserDto;
import com.afyalink.backend.enums.BeneficiaryStatus;
import com.afyalink.backend.enums.VulnerabilityLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BeneficiaryDto {
    private Long id;
    private String identifier;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String category;
    private String caseType;
    private BeneficiaryStatus status;
    private VulnerabilityLevel vulnerabilityLevel;
    private String district;
    private String sector;
    private String cell;
    private String village;
    private String phoneNumber;
    private String email;
    private String guardianName;
    private String guardianPhone;
    private String guardianRelation;
    private UserDto assignedSocialWorker;
    private List<String> needs;
    private String profilePictureUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
