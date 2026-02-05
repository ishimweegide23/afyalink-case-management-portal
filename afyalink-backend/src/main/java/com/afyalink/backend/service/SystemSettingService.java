package com.afyalink.backend.service;

import com.afyalink.backend.dto.common.PageResponse;
import com.afyalink.backend.dto.system.SystemSettingDto;
import com.afyalink.backend.exception.ResourceNotFoundException;
import com.afyalink.backend.model.SystemSetting;
import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.SystemSettingRepository;
import com.afyalink.backend.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public SystemSettingDto getByKey(String key) {
        SystemSetting s = systemSettingRepository.findByKeyAndCategoryIsNull(key)
                .or(() -> systemSettingRepository.findByKey(key))
                .orElseThrow(() -> new ResourceNotFoundException("SystemSetting", "key", key));
        return toDto(s);
    }

    public String getValueByKey(String key) {
        return systemSettingRepository.findByKeyAndCategoryIsNull(key)
                .or(() -> systemSettingRepository.findByKey(key))
                .map(SystemSetting::getValue)
                .orElse(null);
    }

    /**
     * Returns all settings in a category as a map (key -> value). Values are parsed to Boolean, Number, List, or String.
     * Matches the frontend prototype structure (e.g. organization, security, notifications, email, data, integration, appearance, localization).
     */
    public Map<String, Object> getByCategory(String category) {
        List<SystemSetting> list = systemSettingRepository.findByCategory(category);
        Map<String, Object> result = new LinkedHashMap<>();
        for (SystemSetting s : list) {
            result.put(s.getKey(), parseValue(s.getValue()));
        }
        return result;
    }

    /**
     * Saves all key-value pairs for a category. Values are stored as strings (including booleans and numbers).
     * Merges with existing: keys in the map are upserted; keys not in the map are left unchanged.
     * Pass null or empty map to leave category unchanged.
     */
    @Transactional
    public Map<String, Object> setByCategory(String category, Map<String, Object> settings, Long updatedById) {
        if (settings == null || settings.isEmpty()) {
            return getByCategory(category);
        }
        User updatedBy = userRepository.getReferenceById(updatedById);
        for (Map.Entry<String, Object> entry : settings.entrySet()) {
            String key = entry.getKey();
            if (key == null || key.isBlank()) continue;
            String value = serializeValue(entry.getValue());
            SystemSetting setting = systemSettingRepository.findByCategoryAndKey(category, key).orElse(null);
            if (setting == null) {
                setting = SystemSetting.builder()
                        .category(category)
                        .key(key)
                        .value(value)
                        .updatedBy(updatedBy)
                        .build();
            } else {
                setting.setValue(value);
                setting.setUpdatedBy(updatedBy);
            }
            systemSettingRepository.save(setting);
        }
        auditLogService.log(updatedById, "UPDATE", "SystemSetting", "category:" + category, null, null);
        return getByCategory(category);
    }

    @Transactional(readOnly = true)
    public PageResponse<SystemSettingDto> findAll(int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<SystemSetting> settingPage = systemSettingRepository.findAll(pageable);
        return PageResponse.of(settingPage.map(this::toDto));
    }

    @Transactional(readOnly = true)
    public PageResponse<SystemSettingDto> findByCategory(String category, int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(systemSettingRepository.findByCategory(category, pageable).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public PageResponse<SystemSettingDto> search(String keyword, int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(systemSettingRepository.searchSettings(keyword, pageable).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public PageResponse<SystemSettingDto> searchByCategory(String category, String keyword, int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(systemSettingRepository.searchByCategory(category, keyword, pageable).map(this::toDto));
    }

    @Transactional
    public SystemSettingDto set(String key, String value, Long updatedById) {
        User updatedBy = userRepository.getReferenceById(updatedById);
        SystemSetting setting = systemSettingRepository.findByKeyAndCategoryIsNull(key)
                .or(() -> systemSettingRepository.findByKey(key))
                .orElse(null);
        if (setting == null) {
            setting = SystemSetting.builder()
                    .category(null)
                    .key(key)
                    .value(value)
                    .updatedBy(updatedBy)
                    .build();
        } else {
            setting.setValue(value);
            setting.setUpdatedBy(updatedBy);
        }
        setting = systemSettingRepository.save(setting);
        auditLogService.log(updatedById, "UPDATE", "SystemSetting", key, null, null);
        return toDto(setting);
    }

    private Object parseValue(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        if ("true".equalsIgnoreCase(trimmed)) return true;
        if ("false".equalsIgnoreCase(trimmed)) return false;
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
                return objectMapper.readValue(trimmed, new TypeReference<List<Object>>() {});
            } catch (JsonProcessingException e) {
                return value;
            }
        }
        try {
            return Long.parseLong(trimmed);
        } catch (NumberFormatException e) {
            // ignore
        }
        try {
            return Double.parseDouble(trimmed);
        } catch (NumberFormatException e) {
            // ignore
        }
        return value;
    }

    private String serializeValue(Object value) {
        if (value == null) return "";
        if (value instanceof Boolean || value instanceof Number) return value.toString();
        if (value instanceof List || value instanceof Map) {
            try {
                return objectMapper.writeValueAsString(value);
            } catch (JsonProcessingException e) {
                return value.toString();
            }
        }
        return value.toString();
    }

    private SystemSettingDto toDto(SystemSetting s) {
        return SystemSettingDto.builder()
                .id(s.getId())
                .category(s.getCategory())
                .key(s.getKey())
                .value(s.getValue())
                .updatedById(s.getUpdatedBy() != null ? s.getUpdatedBy().getId() : null)
                .updatedByName(s.getUpdatedBy() != null ? s.getUpdatedBy().getFullName() : null)
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
