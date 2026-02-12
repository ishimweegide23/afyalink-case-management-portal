import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const notificationApi = {
  getAll(params) {
    return axiosInstance.get(ENDPOINTS.NOTIFICATIONS.BASE, { params });
  },

  getUnread(params) {
    return axiosInstance.get(ENDPOINTS.NOTIFICATIONS.UNREAD, { params });
  },

  getUnreadCount() {
    return axiosInstance.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
  },

  getById(id) {
    return axiosInstance.get(ENDPOINTS.NOTIFICATIONS.BY_ID(id));
  },

  search(params) {
    return axiosInstance.get(ENDPOINTS.NOTIFICATIONS.SEARCH, { params });
  },

  markAsRead(id) {
    return axiosInstance.post(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  markAllAsRead() {
    return axiosInstance.post(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  },

  sendReminder(body) {
    return axiosInstance.post('/notifications/reminders', body);
  },
};
