import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const analyticsApi = {
  getMySummary(params = {}) {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.MY_SUMMARY, { params });
  },
  getTeamSummary(params = {}) {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.TEAM_SUMMARY, { params });
  },
  getOrgSummary(params = {}) {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.ORG_SUMMARY, { params });
  },
  getWorkerSummary(workerId, params = {}) {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.WORKER(workerId), { params });
  },
  getBeneficiaryJourney(beneficiaryId) {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.BENEFICIARY(beneficiaryId));
  },
  getUnderperformers() {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.UNDERPERFORMERS);
  },

  getDistrictPerformance(district, params = {}) {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.DISTRICT_PERFORMANCE, {
      params: { district, ...params },
    });
  },

  getTeamRealTimeStats() {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.TEAM_REALTIME_STATS);
  },

  getAllDistricts() {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.DISTRICTS);
  },

  getOrgRecoveryProgress(params = {}) {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.ORG_RECOVERY_PROGRESS, { params });
  },

  // ── New endpoints for Organization Analytics dashboard ──

  getCaseTrends(params = {}) {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.CASE_TRENDS, { params });
  },

  getMonthlyBreakdown(params = {}) {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.MONTHLY_BREAKDOWN, { params });
  },

  getInterventionSuccessByType(params = {}) {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.INTERVENTION_SUCCESS, { params });
  },

  getCasesByPriority(params = {}) {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.CASES_BY_PRIORITY, { params });
  },

  getCasesByType(params = {}) {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.CASES_BY_TYPE, { params });
  },

  getAllDistrictsPerformance(params = {}) {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.DISTRICTS_PERFORMANCE, { params });
  },

  getWorkersUnderSupervisor(supervisorId, params = {}) {
    return axiosInstance.get(ENDPOINTS.ANALYTICS.SUPERVISOR_WORKERS(supervisorId), { params });
  },

  async exportAnalytics(params = {}) {
    const response = await axiosInstance.get(ENDPOINTS.ANALYTICS.EXPORT, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  async exportTeamAnalytics(params = {}) {
    const response = await axiosInstance.get(ENDPOINTS.ANALYTICS.TEAM_EXPORT, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Placeholder – returns null if not yet implemented on backend
  getBeneficiaryStats() {
    return Promise.resolve({ data: null });
  },
};
