import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const warningsApi = {
  create(body) {
    return axiosInstance.post(ENDPOINTS.WARNINGS.BASE, body);
  },
  getReceived(params = {}) {
    return axiosInstance.get(ENDPOINTS.WARNINGS.RECEIVED, { params });
  },
  getSent(params = {}) {
    return axiosInstance.get(ENDPOINTS.WARNINGS.SENT, { params });
  },
  getUnreadCount() {
    return axiosInstance.get(ENDPOINTS.WARNINGS.UNREAD_COUNT);
  },
  resolve(id) {
    return axiosInstance.patch(ENDPOINTS.WARNINGS.RESOLVE(id));
  },
  getWorkerHistory(workerId) {
    return axiosInstance.get(ENDPOINTS.WARNINGS.WORKER(workerId));
  },
};
