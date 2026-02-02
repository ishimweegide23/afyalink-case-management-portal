package com.afyalink.backend.dto.beneficiary;

import com.afyalink.backend.enums.BeneficiaryStatus;
import com.afyalink.backend.enums.VulnerabilityLevel;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateBeneficiaryRequest {
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
    private List<String> needs;
    private String profilePicturePath; // set by backend on upload, optional for manual clear
}
