import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const auditLogApi = {
  getAll(params) {
    return axiosInstance.get(ENDPOINTS.AUDIT_LOGS.BASE, { params });
  },

  search(params) {
    return axiosInstance.get(ENDPOINTS.AUDIT_LOGS.SEARCH, { params });
  },

  getStats() {
    return axiosInstance.get(`${ENDPOINTS.AUDIT_LOGS.BASE}/stats`);
  },

  export(params) {
    return axiosInstance.get(`${ENDPOINTS.AUDIT_LOGS.BASE}/export`, {
      params,
      responseType: 'blob',
    });
  },
};
