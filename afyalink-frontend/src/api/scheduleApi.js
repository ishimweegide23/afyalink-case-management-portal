import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const scheduleApi = {
  getSchedule(params = {}) {
    return axiosInstance.get(ENDPOINTS.SCHEDULE.ITEMS, { params });
  },
};
