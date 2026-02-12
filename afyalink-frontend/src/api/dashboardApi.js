import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const dashboardApi = {
  getTodaySummary() {
    return axiosInstance.get(ENDPOINTS.DASHBOARD.TODAY);
  },
};
