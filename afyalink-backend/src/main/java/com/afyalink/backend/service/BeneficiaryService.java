package com.afyalink.backend.service;

import com.afyalink.backend.dto.beneficiary.BeneficiaryDto;
import com.afyalink.backend.dto.beneficiary.CreateBeneficiaryRequest;
import com.afyalink.backend.dto.beneficiary.ProfilePictureResult;
import com.afyalink.backend.dto.beneficiary.UpdateBeneficiaryRequest;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.dto.user.UserDto;
import com.afyalink.backend.enums.BeneficiaryStatus;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.enums.VulnerabilityLevel;
import com.afyalink.backend.exception.ForbiddenException;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.model.Beneficiary;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.BeneficiaryRepository;
import com.afyalink.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BeneficiaryService {

    private final BeneficiaryRepository beneficiaryRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final AuditLogService auditLogService;
    private final DistrictScopeService districtScopeService;

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public PageResponse<BeneficiaryDto> findAll(Long currentUserId, int page, int size, String sortBy, String direction) {
        User currentUser = userRepository.getReferenceById(currentUserId);
        UserRole role = currentUser.getRole();

        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Beneficiary> beneficiaryPage;

        if (role == UserRole.SOCIAL_WORKER) {
            String district = districtScopeService.resolveWorkerDistrict(currentUser);
            beneficiaryPage = beneficiaryRepository.findByWorkerInDistrict(currentUser, district, pageable);
        } else if (role == UserRole.ADMIN) {
            beneficiaryPage = beneficiaryRepository.findAll(pageable);
        } else if (role == UserRole.SUPERVISOR) {
            String district = districtScopeService.resolveSupervisorDistrict(currentUser);
            beneficiaryPage = beneficiaryRepository.findBySupervisorTeamInDistrict(currentUserId, district, pageable);
        } else {
            beneficiaryPage = beneficiaryRepository.findAll(pageable);
        }
        return PageResponse.of(beneficiaryPage.map(this::toDto));
    }

    @Transactional(readOnly = true)
    public PageResponse<BeneficiaryDto> search(Long currentUserId, String keyword,
                                               BeneficiaryStatus status, String category,
                                               VulnerabilityLevel vulnerability,
                                               int page, int size, String sortBy, String direction) {
        User currentUser = userRepository.getReferenceById(currentUserId);
        UserRole role = currentUser.getRole();

        if (role == UserRole.ADMIN) {
            return PageResponse.of(org.springframework.data.domain.Page.empty());
        }

        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Beneficiary> beneficiaryPage;
        if (role == UserRole.SUPERVISOR) {
            beneficiaryPage = beneficiaryRepository.searchBySupervisorTeam(
                    currentUserId,
                    StringUtils.hasText(keyword) ? keyword : null,
                    status,
                    StringUtils.hasText(category) ? category : null,
                    vulnerability,
                    pageable);
        } else {
            beneficiaryPage = beneficiaryRepository.search(
                    currentUser,
                    StringUtils.hasText(keyword) ? keyword : null,
                    status,
                    StringUtils.hasText(category) ? category : null,
                    vulnerability,
                    pageable);
        }
        return PageResponse.of(beneficiaryPage.map(this::toDto));
    }

    @Transactional(readOnly = true)
    public BeneficiaryDto findById(Long id, Long currentUserId) {
        Beneficiary beneficiary = beneficiaryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary", "id", id));
        User currentUser = userRepository.getReferenceById(currentUserId);
        UserRole role = currentUser.getRole();

        if (role == UserRole.ADMIN) {
            throw new ForbiddenException("Administrators do not access beneficiary details directly. Use Reports and Analytics.");
        }
        if (role == UserRole.SOCIAL_WORKER) {
            if (beneficiary.getAssignedSocialWorker() == null || !beneficiary.getAssignedSocialWorker().getId().equals(currentUserId)) {
                throw new ForbiddenException("You can only view beneficiaries assigned to you.");
            }
            String workerDistrict = districtScopeService.resolveWorkerDistrict(currentUser);
            if (workerDistrict != null && beneficiary.getDistrict() != null
                    && !districtScopeService.matchesDistrict(beneficiary.getDistrict(), workerDistrict)) {
                throw new ForbiddenException("This beneficiary is outside your assigned district.");
            }
        } else if (role == UserRole.SUPERVISOR) {
            if (beneficiary.getAssignedSocialWorker() == null
                    || beneficiary.getAssignedSocialWorker().getSupervisor() == null
                    || !beneficiary.getAssignedSocialWorker().getSupervisor().getId().equals(currentUserId)) {
                throw new ForbiddenException("You can only view beneficiaries assigned to your team.");
            }
        }
        return toDto(beneficiary);
    }

    @Transactional
    public BeneficiaryDto create(CreateBeneficiaryRequest request, Long currentUserId) {
        User currentUser = userRepository.getReferenceById(currentUserId);
        if (currentUser.getRole() != UserRole.SOCIAL_WORKER) {
            throw new ForbiddenException("Only social workers can register beneficiaries.");
        }

        String identifier = "BEN-" + String.format("%03d", nextSequenceNumber());
        Beneficiary beneficiary = Beneficiary.builder()
                .identifier(identifier)
                .fullName(request.getFullName())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .category(request.getCategory())
                .caseType(request.getCaseType())
                .status(BeneficiaryStatus.PENDING)
                .vulnerabilityLevel(request.getVulnerabilityLevel() != null ? request.getVulnerabilityLevel() : VulnerabilityLevel.MEDIUM)
                .district(request.getDistrict())
                .sector(request.getSector())
                .cell(request.getCell())
                .village(request.getVillage())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .guardianName(request.getGuardianName())
                .guardianPhone(request.getGuardianPhone())
                .guardianRelation(request.getGuardianRelation())
                .assignedSocialWorker(currentUser)
                .needs(needsToString(request.getNeeds()))
                .createdBy(currentUser)
                .build();
        beneficiary = beneficiaryRepository.save(beneficiary);
        auditLogService.log(currentUserId, "CREATE", "Beneficiary", String.valueOf(beneficiary.getId()), null, null);
        return toDto(beneficiary);
    }

    @Transactional
    public BeneficiaryDto update(Long id, UpdateBeneficiaryRequest request, Long currentUserId) {
        Beneficiary beneficiary = beneficiaryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary", "id", id));
        User currentUser = userRepository.getReferenceById(currentUserId);
        if (currentUser.getRole() != UserRole.SOCIAL_WORKER) {
            throw new ForbiddenException("Only social workers can update beneficiaries.");
        }
        if (!beneficiary.getAssignedSocialWorker().getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only update beneficiaries assigned to you.");
        }

        if (request.getFullName() != null) beneficiary.setFullName(request.getFullName());
        if (request.getDateOfBirth() != null) beneficiary.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) beneficiary.setGender(request.getGender());
        if (request.getCategory() != null) beneficiary.setCategory(request.getCategory());
        if (request.getCaseType() != null) beneficiary.setCaseType(request.getCaseType());
        if (request.getStatus() != null) beneficiary.setStatus(request.getStatus());
        if (request.getVulnerabilityLevel() != null) beneficiary.setVulnerabilityLevel(request.getVulnerabilityLevel());
        if (request.getDistrict() != null) beneficiary.setDistrict(request.getDistrict());
        if (request.getSector() != null) beneficiary.setSector(request.getSector());
        if (request.getCell() != null) beneficiary.setCell(request.getCell());
        if (request.getVillage() != null) beneficiary.setVillage(request.getVillage());
        if (request.getPhoneNumber() != null) beneficiary.setPhoneNumber(request.getPhoneNumber());
        if (request.getEmail() != null) beneficiary.setEmail(request.getEmail());
        if (request.getGuardianName() != null) beneficiary.setGuardianName(request.getGuardianName());
        if (request.getGuardianPhone() != null) beneficiary.setGuardianPhone(request.getGuardianPhone());
        if (request.getGuardianRelation() != null) beneficiary.setGuardianRelation(request.getGuardianRelation());
        if (request.getNeeds() != null) beneficiary.setNeeds(needsToString(request.getNeeds()));
        if (request.getProfilePicturePath() != null) beneficiary.setProfilePicturePath(request.getProfilePicturePath().isBlank() ? null : request.getProfilePicturePath());
        beneficiary.setUpdatedBy(currentUser);
        beneficiary = beneficiaryRepository.save(beneficiary);
        auditLogService.log(currentUserId, "UPDATE", "Beneficiary", String.valueOf(id), null, null);
        return toDto(beneficiary);
    }

    private long nextSequenceNumber() {
        return beneficiaryRepository.count() + 1;
    }

    private String needsToString(List<String> needs) {
        if (needs == null || needs.isEmpty()) return null;
        return String.join(",", needs);
    }

    private List<String> needsFromString(String s) {
        if (s == null || s.isBlank()) return Collections.emptyList();
        return List.of(s.split(","));
    }

    private UserDto userToDto(User u) {
        if (u == null) return null;
        try {
            return userService.findById(u.getId());
        } catch (ResourceNotFoundException e) {
            return null;
        }
    }

    @Transactional
    public BeneficiaryDto uploadProfilePicture(Long beneficiaryId, MultipartFile file, Long currentUserId) throws IOException {
        Beneficiary beneficiary = beneficiaryRepository.findById(beneficiaryId)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary", "id", beneficiaryId));
        User currentUser = userRepository.getReferenceById(currentUserId);
        if (currentUser.getRole() != UserRole.SOCIAL_WORKER) {
            throw new ForbiddenException("Only social workers can update beneficiary profile pictures.");
        }
        if (beneficiary.getAssignedSocialWorker() == null || !beneficiary.getAssignedSocialWorker().getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only update beneficiaries assigned to you.");
        }
        String ext = ".jpg";
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            int dot = originalFilename.lastIndexOf('.');
            if (dot > 0) {
                String e = originalFilename.substring(dot).toLowerCase();
                if (e.matches("\\.(jpg|jpeg|png|gif|webp)")) ext = e;
            }
        }
        String storedName = "beneficiary-" + beneficiaryId + "-" + UUID.randomUUID().toString().substring(0, 8) + ext;
        Path dir = Paths.get(uploadDir, "beneficiaries").toAbsolutePath().normalize();
        Files.createDirectories(dir);
        Path target = dir.resolve(storedName);
        file.transferTo(target.toFile());
        String relativePath = "beneficiaries/" + storedName;
        beneficiary.setProfilePicturePath(relativePath);
        beneficiary.setUpdatedBy(currentUser);
        beneficiary = beneficiaryRepository.save(beneficiary);
        auditLogService.log(currentUserId, "UPDATE", "Beneficiary", String.valueOf(beneficiaryId), null, null);
        return toDto(beneficiary);
    }

    @Transactional(readOnly = true)
    public ProfilePictureResult getProfilePictureWithType(Long beneficiaryId, Long currentUserId) throws IOException {
        Beneficiary beneficiary = beneficiaryRepository.findById(beneficiaryId)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary", "id", beneficiaryId));
        User currentUser = userRepository.getReferenceById(currentUserId);
        UserRole role = currentUser.getRole();
        if (role == UserRole.SOCIAL_WORKER && (beneficiary.getAssignedSocialWorker() == null || !beneficiary.getAssignedSocialWorker().getId().equals(currentUserId))) {
            throw new ForbiddenException("You can only view beneficiaries assigned to you.");
        }
        if (role == UserRole.SUPERVISOR && (beneficiary.getAssignedSocialWorker() == null
                || beneficiary.getAssignedSocialWorker().getSupervisor() == null
                || !beneficiary.getAssignedSocialWorker().getSupervisor().getId().equals(currentUserId))) {
            throw new ForbiddenException("You can only view beneficiaries assigned to your team.");
        }
        if (beneficiary.getProfilePicturePath() == null || beneficiary.getProfilePicturePath().isBlank()) {
            throw new ResourceNotFoundException("Profile picture", "beneficiaryId", beneficiaryId);
        }
        Path filePath = Paths.get(uploadDir).resolve(beneficiary.getProfilePicturePath()).normalize();
        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException("Profile picture", "beneficiaryId", beneficiaryId);
        }
        byte[] data = Files.readAllBytes(filePath);
        MediaType contentType = MediaType.IMAGE_JPEG;
        String path = filePath.toString().toLowerCase();
        if (path.endsWith(".png")) contentType = MediaType.IMAGE_PNG;
        else if (path.endsWith(".gif")) contentType = MediaType.IMAGE_GIF;
        else if (path.endsWith(".webp")) contentType = MediaType.parseMediaType("image/webp");
        return new ProfilePictureResult(data, contentType);
    }

    private BeneficiaryDto toDto(Beneficiary b) {
        String profilePictureUrl = (b.getProfilePicturePath() != null && !b.getProfilePicturePath().isBlank())
                ? "/api/beneficiaries/" + b.getId() + "/profile-picture" : null;
        return BeneficiaryDto.builder()
                .id(b.getId())
                .identifier(b.getIdentifier())
                .fullName(b.getFullName())
                .dateOfBirth(b.getDateOfBirth())
                .gender(b.getGender())
                .category(b.getCategory())
                .caseType(b.getCaseType())
                .status(b.getStatus())
                .vulnerabilityLevel(b.getVulnerabilityLevel())
                .district(b.getDistrict())
                .sector(b.getSector())
                .cell(b.getCell())
                .village(b.getVillage())
                .phoneNumber(b.getPhoneNumber())
                .email(b.getEmail())
                .guardianName(b.getGuardianName())
                .guardianPhone(b.getGuardianPhone())
                .guardianRelation(b.getGuardianRelation())
                .assignedSocialWorker(userToDto(b.getAssignedSocialWorker()))
                .needs(needsFromString(b.getNeeds()))
                .profilePictureUrl(profilePictureUrl)
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
