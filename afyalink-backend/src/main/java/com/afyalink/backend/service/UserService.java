package com.afyalink.backend.service;

import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.dto.common.ProfilePictureResult;
import com.afyalink.backend.dto.user.*;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.enums.NotificationType;
import com.afyalink.backend.exception.BadRequestException;
import com.afyalink.backend.exception.DuplicateResourceException;
import com.afyalink.backend.exception.ForbiddenException;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.model.User;
import com.afyalink.backend.model.UserProfile;
import com.afyalink.backend.repository.UserProfileRepository;
import com.afyalink.backend.repository.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final EntityManager entityManager;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public PageResponse<UserDto> findAll(int page, int size, String sortBy, String direction) {
        String safeSort = normalizeUserSortField(sortBy);
        Sort sort = Sort.by(Sort.Direction.fromString(direction), safeSort);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<User> userPage = userRepository.findAll(pageable);
        return PageResponse.of(userPage.map(this::toDto));
    }

    private static String normalizeUserSortField(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) return "id";
        return switch (sortBy.trim()) {
            case "createdAt", "created_at" -> "createdAt";
            case "fullName", "full_name" -> "fullName";
            case "lastLoginAt", "last_login_at" -> "lastLoginAt";
            case "email", "role", "id" -> sortBy.trim();
            default -> "id";
        };
    }

    @Transactional(readOnly = true)
    public UserDto findById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return toDto(user);
    }

    public PageResponse<UserDto> findByRole(UserRole role, int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<User> userPage = userRepository.findByRole(role, pageable);
        return PageResponse.of(userPage.map(this::toDto));
    }

    public PageResponse<UserDto> search(String keyword, int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<User> userPage = userRepository.searchUsers(keyword, pageable);
        return PageResponse.of(userPage.map(this::toDto));
    }

    @Transactional
    public UserDto create(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already in use");
        }
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .phoneNumber(request.getPhoneNumber())
                .isActive(true)
                .province(trimOrNull(request.getProvince()))
                .district(trimOrNull(request.getDistrict()))
                .sector(trimOrNull(request.getSector()))
                .cell(trimOrNull(request.getCell()))
                .village(trimOrNull(request.getVillage()))
                .build();

        applyRoleSpecificCreateFields(user, request);

        user = userRepository.saveAndFlush(user);
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setDepartment(request.getDepartment());
        profile.setJobTitle(request.getJobTitle());
        profile.setAvatarInitials(initialsFrom(user.getFullName()));
        entityManager.persist(profile);
        entityManager.flush();
        auditLogService.log(user.getId(), "CREATE", "User", String.valueOf(user.getId()), null, null);
        return toDto(user);
    }

    private void applyRoleSpecificCreateFields(User user, CreateUserRequest request) {
        if (request.getRole() == UserRole.SOCIAL_WORKER) {
            requireNonBlank(request.getDistrict(), "District is required for Social Worker");
            requireNonBlank(request.getSector(), "Sector is required for Social Worker");
            requireNonBlank(request.getCell(), "Cell is required for Social Worker");
            if (request.getSupervisorId() == null) {
                throw new BadRequestException("Supervisor is required for Social Worker");
            }
            User supervisor = userRepository.findById(request.getSupervisorId())
                    .orElseThrow(() -> new BadRequestException("Supervisor not found"));
            if (supervisor.getRole() != UserRole.SUPERVISOR) {
                throw new BadRequestException("Assigned user must be a SUPERVISOR");
            }
            validateSupervisorDistrictMatch(supervisor, request.getDistrict());
            user.setSupervisor(supervisor);
            notificationService.create(
                    supervisor.getId(),
                    NotificationType.SYSTEM_ANNOUNCEMENT,
                    "New Social Worker Assigned",
                    String.format(
                            "A new social worker '%s' has been assigned to your team in %s district.",
                            user.getFullName(),
                            user.getDistrict()),
                    null, null, null, null, null, null);
        }

        if (request.getRole() == UserRole.SUPERVISOR) {
            requireNonBlank(request.getDistrict(), "District is required for Supervisor");
            requireNonBlank(request.getSector(), "Sector is required for Supervisor");
            requireNonBlank(request.getAssignedDistrict(), "Assigned district is required for Supervisor");
            user.setAssignedDistrict(trimOrNull(request.getAssignedDistrict()));
            user.setAssignedProvince(trimOrNull(request.getAssignedProvince()));
        }
    }

    @Transactional
    public UserDto update(Long id, UpdateUserRequest request, Long currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        User currentUser = userRepository.getReferenceById(currentUserId);
        if (!currentUser.getId().equals(id) && currentUser.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("You can only update your own profile");
        }
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
        boolean updatingOther = !currentUser.getId().equals(id);

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());

        if (isAdmin && updatingOther) {
            if (request.getProvince() != null) user.setProvince(trimOrNull(request.getProvince()));
            if (request.getDistrict() != null) user.setDistrict(trimOrNull(request.getDistrict()));
            if (request.getSector() != null) user.setSector(trimOrNull(request.getSector()));
            if (request.getCell() != null) user.setCell(trimOrNull(request.getCell()));
            if (request.getVillage() != null) user.setVillage(trimOrNull(request.getVillage()));
            if (request.getAssignedDistrict() != null) user.setAssignedDistrict(trimOrNull(request.getAssignedDistrict()));
            if (request.getAssignedProvince() != null) user.setAssignedProvince(trimOrNull(request.getAssignedProvince()));

            if (user.getRole() == UserRole.SOCIAL_WORKER && request.getSupervisorId() != null) {
                User newSupervisor = userRepository.findById(request.getSupervisorId())
                        .orElseThrow(() -> new BadRequestException("Supervisor not found"));
                if (newSupervisor.getRole() != UserRole.SUPERVISOR) {
                    throw new BadRequestException("Assigned user must be a SUPERVISOR");
                }
                String workerDistrict = user.getDistrict();
                if (workerDistrict != null && !workerDistrict.isBlank()) {
                    validateSupervisorDistrictMatch(newSupervisor, workerDistrict);
                }
                User oldSupervisor = user.getSupervisor();
                if (oldSupervisor == null || !oldSupervisor.getId().equals(newSupervisor.getId())) {
                    user.setSupervisor(newSupervisor);
                    notifySupervisorReassignment(user, oldSupervisor, newSupervisor);
                }
            }
        }

        user = userRepository.save(user);
        UserProfile profile = userProfileRepository.findByUserId(id).orElse(null);
        if (profile != null) {
            if (request.getDepartment() != null) profile.setDepartment(request.getDepartment());
            if (request.getJobTitle() != null) profile.setJobTitle(request.getJobTitle());
            if (request.getAvatarInitials() != null) profile.setAvatarInitials(request.getAvatarInitials());
            if (request.getAvatarUrl() != null) profile.setAvatarUrl(request.getAvatarUrl().isBlank() ? null : request.getAvatarUrl());
            if (request.getBio() != null) profile.setBio(request.getBio().isBlank() ? null : request.getBio());
            userProfileRepository.save(profile);
        }
        auditLogService.log(user.getId(), "UPDATE", "User", String.valueOf(id), null, null);
        return toDto(userRepository.findById(id).orElseThrow());
    }

    @Transactional
    public void delete(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setActive(false);
        userRepository.save(user);
        auditLogService.log(id, "DEACTIVATE", "User", String.valueOf(id), null, null);
    }

    @Transactional
    public UserDto uploadProfilePicture(Long userId, MultipartFile file, Long currentUserId) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        User currentUser = userRepository.getReferenceById(currentUserId);
        if (!currentUser.getId().equals(userId)) {
            throw new ForbiddenException("You can only update your own profile picture");
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
        String storedName = "user-" + userId + "-" + UUID.randomUUID().toString().substring(0, 8) + ext;
        Path dir = Paths.get(uploadDir, "users").toAbsolutePath().normalize();
        Files.createDirectories(dir);
        Path target = dir.resolve(storedName);
        file.transferTo(target.toFile());
        String relativePath = "users/" + storedName;
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
            profile.setAvatarInitials(initialsFrom(user.getFullName()));
        }
        profile.setAvatarUrl(relativePath);
        userProfileRepository.save(profile);
        auditLogService.log(currentUserId, "UPDATE", "User", String.valueOf(userId), null, "profile picture");
        return toDto(userRepository.findById(userId).orElseThrow());
    }

    @Transactional(readOnly = true)
    public ProfilePictureResult getProfilePictureWithType(Long userId, Long currentUserId) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null || profile.getAvatarUrl() == null || profile.getAvatarUrl().isBlank()) {
            throw new ResourceNotFoundException("Profile picture", "userId", userId);
        }
        Path filePath = Paths.get(uploadDir).resolve(profile.getAvatarUrl()).normalize();
        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException("Profile picture", "userId", userId);
        }
        byte[] data;
        try {
            data = Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new ResourceNotFoundException("Profile picture", "userId", userId);
        }
        MediaType contentType = MediaType.IMAGE_JPEG;
        String path = filePath.toString().toLowerCase();
        if (path.endsWith(".png")) contentType = MediaType.IMAGE_PNG;
        else if (path.endsWith(".gif")) contentType = MediaType.IMAGE_GIF;
        else if (path.endsWith(".webp")) contentType = MediaType.parseMediaType("image/webp");
        return new ProfilePictureResult(data, contentType);
    }

    @Transactional
    public UserDto reassignSocialWorker(Long workerId, Long newSupervisorId) {
        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", workerId));
        if (worker.getRole() != UserRole.SOCIAL_WORKER) {
            throw new BadRequestException("User is not a Social Worker");
        }
        User newSupervisor = userRepository.findById(newSupervisorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", newSupervisorId));
        if (newSupervisor.getRole() != UserRole.SUPERVISOR) {
            throw new BadRequestException("Target user must be a SUPERVISOR");
        }
        if (worker.getDistrict() != null && !worker.getDistrict().isBlank()) {
            validateSupervisorDistrictMatch(newSupervisor, worker.getDistrict());
        }
        User oldSupervisor = worker.getSupervisor();
        worker.setSupervisor(newSupervisor);
        User saved = userRepository.save(worker);
        notifySupervisorReassignment(worker, oldSupervisor, newSupervisor);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getSupervisorsByDistrict(String district) {
        return userRepository.findByRoleAndAssignedDistrict(UserRole.SUPERVISOR, district)
                .stream()
                .filter(User::isActive)
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserDto> getWorkersByDistrict(String district) {
        return userRepository.findByRoleAndDistrict(UserRole.SOCIAL_WORKER, district)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserDto> getWorkersBySupervisor(Long supervisorId) {
        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", supervisorId));
        return userRepository.findBySupervisor(supervisor).stream().map(this::toDto).toList();
    }

    private void notifySupervisorReassignment(User worker, User oldSupervisor, User newSupervisor) {
        if (oldSupervisor != null && !oldSupervisor.getId().equals(newSupervisor.getId())) {
            notificationService.create(
                    oldSupervisor.getId(),
                    NotificationType.SYSTEM_ANNOUNCEMENT,
                    "Social Worker Reassigned",
                    String.format("Social worker '%s' has been reassigned to another supervisor.", worker.getFullName()),
                    null, null, null, null, null, null);
        }
        notificationService.create(
                newSupervisor.getId(),
                NotificationType.SYSTEM_ANNOUNCEMENT,
                "New Social Worker Assigned",
                String.format(
                        "Social worker '%s' has been assigned to your team. They work in %s district.",
                        worker.getFullName(),
                        worker.getDistrict() != null ? worker.getDistrict() : "unspecified"),
                null, null, null, null, null, null);
        notificationService.create(
                worker.getId(),
                NotificationType.SYSTEM_ANNOUNCEMENT,
                "Your Supervisor Has Changed",
                String.format(
                        "Your new supervisor is %s (%s district).",
                        newSupervisor.getFullName(),
                        newSupervisor.getAssignedDistrict() != null ? newSupervisor.getAssignedDistrict() : "unspecified"),
                null, null, null, null, null, null);
    }

    private static void validateSupervisorDistrictMatch(User supervisor, String workerDistrict) {
        if (supervisor.getAssignedDistrict() != null
                && !supervisor.getAssignedDistrict().equalsIgnoreCase(workerDistrict)) {
            throw new BadRequestException(String.format(
                    "Supervisor '%s' manages district '%s', but worker is in '%s'. "
                            + "Please select a supervisor from the same district.",
                    supervisor.getFullName(),
                    supervisor.getAssignedDistrict(),
                    workerDistrict));
        }
    }

    private static void requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }
    }

    private static String trimOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private UserDto toDto(User user) {
        UserProfileDto profileDto = null;
        UserProfile p = userProfileRepository.findByUserId(user.getId()).orElse(null);
        if (p != null) {
            String profilePictureUrl = (p.getAvatarUrl() != null && !p.getAvatarUrl().isBlank())
                    ? "/api/users/" + user.getId() + "/profile-picture" : null;
            profileDto = UserProfileDto.builder()
                    .department(p.getDepartment())
                    .jobTitle(p.getJobTitle())
                    .avatarInitials(p.getAvatarInitials())
                    .avatarUrl(p.getAvatarUrl())
                    .profilePictureUrl(profilePictureUrl)
                    .bio(p.getBio())
                    .build();
        }
        Long supervisorId = null;
        String supervisorName = null;
        if (user.getSupervisor() != null) {
            supervisorId = user.getSupervisor().getId();
            supervisorName = user.getSupervisor().getFullName();
        }

        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .phoneNumber(user.getPhoneNumber())
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .profile(profileDto)
                .province(user.getProvince())
                .district(user.getDistrict())
                .sector(user.getSector())
                .cell(user.getCell())
                .village(user.getVillage())
                .assignedDistrict(user.getAssignedDistrict())
                .assignedProvince(user.getAssignedProvince())
                .supervisorId(supervisorId)
                .supervisorName(supervisorName)
                .build();
    }

    private static String initialsFrom(String fullName) {
        if (fullName == null || fullName.isBlank()) return "?";
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) return parts[0].substring(0, 1).toUpperCase();
        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
    }
}
