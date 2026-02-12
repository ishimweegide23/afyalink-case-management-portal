import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const performanceApi = {
  getPerformanceMetrics(role, timeRange = 'week') {
    return axiosInstance.get(ENDPOINTS.PERFORMANCE.METRICS, {
      params: { role, timeRange },
    });
  },
  getSupervisorWorkload() {
    return axiosInstance.get(ENDPOINTS.PERFORMANCE.SUPERVISOR_WORKLOAD);
  },
  getPerformanceDetails(userId, timeRange = 'week') {
    return axiosInstance.get(ENDPOINTS.PERFORMANCE.DETAILS(userId), {
      params: { timeRange },
    });
  },
  reassignSocialWorker(socialWorkerId, newSupervisorId, reason) {
    return axiosInstance.post(ENDPOINTS.PERFORMANCE.REASSIGN, {
      socialWorkerId,
      newSupervisorId,
      reason,
    });
  },
};
