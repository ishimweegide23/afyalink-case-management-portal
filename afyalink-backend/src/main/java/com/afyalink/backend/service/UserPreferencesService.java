// Minor documentation updates for clarity
package com.afyalink.backend.service;

import com.afyalink.backend.dto.user.UserPreferencesDto;
import com.afyalink.backend.exception.ForbiddenException;
import com.afyalink.backend.model.User;
import com.afyalink.backend.model.UserPreferences;
import com.afyalink.backend.repository.UserPreferencesRepository;
import com.afyalink.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserPreferencesService {

    private final UserPreferencesRepository preferencesRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserPreferencesDto getPreferences(Long userId, Long currentUserId) {
        if (!userId.equals(currentUserId)) {
            throw new ForbiddenException("You can only view your own preferences");
        }
        return preferencesRepository.findByUserId(userId)
                .map(this::toDto)
                .orElse(defaultDto());
    }

    @Transactional
    public UserPreferencesDto updatePreferences(Long userId, UserPreferencesDto dto, Long currentUserId) {
        if (!userId.equals(currentUserId)) {
            throw new ForbiddenException("You can only update your own preferences");
        }
        User user = userRepository.getReferenceById(userId);
        UserPreferences prefs = preferencesRepository.findByUserId(userId).orElse(null);
        if (prefs == null) {
            prefs = UserPreferences.builder().user(user).build();
        }
        prefs.setCaseUpdates(dto.isCaseUpdates());
        prefs.setCaseAssignments(dto.isCaseAssignments());
        prefs.setInterventionReminders(dto.isInterventionReminders());
        prefs.setTaskDeadlines(dto.isTaskDeadlines());
        prefs.setWeeklySummary(dto.isWeeklySummary());
        prefs.setEmailNotifications(dto.isEmailNotifications());
        prefs.setSmsNotifications(dto.isSmsNotifications());
        prefs.setPushNotifications(dto.isPushNotifications());
        if (dto.getLanguage() != null) prefs.setLanguage(dto.getLanguage());
        if (dto.getTheme() != null) prefs.setTheme(dto.getTheme());
        if (dto.getTimezone() != null) prefs.setTimezone(dto.getTimezone());
        if (dto.getDateFormat() != null) prefs.setDateFormat(dto.getDateFormat());
        prefs.setCompactMode(dto.isCompactMode());
        prefs.setAnimationsEnabled(dto.isAnimationsEnabled());
        prefs = preferencesRepository.save(prefs);
        return toDto(prefs);
    }

    private UserPreferencesDto toDto(UserPreferences p) {
        return UserPreferencesDto.builder()
                .caseUpdates(p.isCaseUpdates())
                .caseAssignments(p.isCaseAssignments())
                .interventionReminders(p.isInterventionReminders())
                .taskDeadlines(p.isTaskDeadlines())
                .weeklySummary(p.isWeeklySummary())
                .emailNotifications(p.isEmailNotifications())
                .smsNotifications(p.isSmsNotifications())
                .pushNotifications(p.isPushNotifications())
                .language(p.getLanguage())
                .theme(p.getTheme())
                .timezone(p.getTimezone())
                .dateFormat(p.getDateFormat())
                .compactMode(p.isCompactMode())
                .animationsEnabled(p.isAnimationsEnabled())
                .build();
    }

    private UserPreferencesDto defaultDto() {
        return UserPreferencesDto.builder()
                .caseUpdates(true)
                .caseAssignments(true)
                .interventionReminders(true)
                .taskDeadlines(true)
                .weeklySummary(true)
                .emailNotifications(true)
                .smsNotifications(false)
                .pushNotifications(true)
                .language("en")
                .theme("light")
                .timezone("Africa/Kigali")
                .dateFormat("DD/MM/YYYY")
                .compactMode(false)
                .animationsEnabled(true)
                .build();
    }
}
