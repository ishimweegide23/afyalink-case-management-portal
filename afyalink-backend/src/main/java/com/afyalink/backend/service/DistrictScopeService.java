package com.afyalink.backend.service;

import com.afyalink.backend.model.User;
import com.afyalink.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DistrictScopeService {

    private final UserRepository userRepository;

    public String resolveSupervisorDistrict(User supervisor) {
        if (supervisor == null) {
            return null;
        }
        if (supervisor.getAssignedDistrict() != null && !supervisor.getAssignedDistrict().isBlank()) {
            return supervisor.getAssignedDistrict().trim();
        }
        if (supervisor.getDistrict() != null && !supervisor.getDistrict().isBlank()) {
            return supervisor.getDistrict().trim();
        }
        return null;
    }

    public String resolveWorkerDistrict(User worker) {
        if (worker == null) {
            return null;
        }
        if (worker.getDistrict() != null && !worker.getDistrict().isBlank()) {
            return worker.getDistrict().trim();
        }
        return null;
    }

    public boolean matchesDistrict(String a, String b) {
        if (a == null || a.isBlank() || b == null || b.isBlank()) {
            return true;
        }
        return a.trim().equalsIgnoreCase(b.trim());
    }

    public List<User> workersInSupervisorDistrict(User supervisor) {
        if (supervisor == null) {
            return List.of();
        }
        String district = resolveSupervisorDistrict(supervisor);
        if (district == null || district.isBlank()) {
            List<User> all = userRepository.findBySupervisor(supervisor);
            return all != null ? all : List.of();
        }
        return userRepository.findWorkersBySupervisorAndDistrict(supervisor.getId(), district);
    }

    public List<Long> workerIdsInSupervisorDistrict(User supervisor) {
        return workersInSupervisorDistrict(supervisor).stream().map(User::getId).toList();
    }
}
