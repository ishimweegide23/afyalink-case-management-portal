package com.afyalink.backend.controller;

import com.afyalink.backend.dto.common.ApiResponse;
import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.dto.user.CreateUserRequest;
import com.afyalink.backend.dto.user.UpdateUserRequest;
import com.afyalink.backend.dto.user.UserDto;
import com.afyalink.backend.enums.UserRole;
import com.afyalink.backend.security.CustomUserDetailsService;
import com.afyalink.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final CustomUserDetailsService customUserDetailsService;

    private Long currentUserId() {
        return customUserDetailsService.getUserIdFromUserDetails(
                (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<UserDto>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        return ResponseEntity.ok(ApiResponse.success(userService.findAll(page, size, sortBy, direction)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser() {
        return ResponseEntity.ok(ApiResponse.success(userService.findById(currentUserId())));
    }

    @GetMapping("/supervisors/by-district")
    public ResponseEntity<ApiResponse<List<UserDto>>> getSupervisorsByDistrict(@RequestParam String district) {
        return ResponseEntity.ok(ApiResponse.success(userService.getSupervisorsByDistrict(district)));
    }

    @GetMapping("/workers/by-district")
    public ResponseEntity<ApiResponse<List<UserDto>>> getWorkersByDistrict(@RequestParam String district) {
        return ResponseEntity.ok(ApiResponse.success(userService.getWorkersByDistrict(district)));
    }

    @GetMapping("/workers/by-supervisor/{supervisorId}")
    public ResponseEntity<ApiResponse<List<UserDto>>> getWorkersBySupervisor(@PathVariable Long supervisorId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getWorkersBySupervisor(supervisorId)));
    }

    @PostMapping("/{workerId}/reassign/{newSupervisorId}")
    public ResponseEntity<ApiResponse<UserDto>> reassignSocialWorker(
            @PathVariable Long workerId,
            @PathVariable Long newSupervisorId) {
        return ResponseEntity.ok(ApiResponse.success(userService.reassignSocialWorker(workerId, newSupervisorId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.findById(id)));
    }

    @GetMapping("/{id}/profile-picture")
    public ResponseEntity<byte[]> getProfilePicture(@PathVariable Long id) throws IOException {
        var result = userService.getProfilePictureWithType(id, currentUserId());
        return ResponseEntity.ok()
                .contentType(result.contentType())
                .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                .body(result.data());
    }

    @PostMapping("/{id}/profile-picture")
    public ResponseEntity<ApiResponse<UserDto>> uploadProfilePicture(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(ApiResponse.success(
                userService.uploadProfilePicture(id, file, currentUserId())));
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<ApiResponse<PageResponse<UserDto>>> findByRole(
            @PathVariable UserRole role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        return ResponseEntity.ok(ApiResponse.success(userService.findByRole(role, page, size, sortBy, direction)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<UserDto>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        return ResponseEntity.ok(ApiResponse.success(userService.search(keyword, page, size, sortBy, direction)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserDto>> create(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userService.update(id, request, currentUserId())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted", null));
    }
}
