import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import { API_BASE_URL } from '../utils/constants';

export const userApi = {
  getAll(params) {
    return axiosInstance.get(ENDPOINTS.USERS.BASE, { params });
  },

  getMe() {
    return axiosInstance.get(ENDPOINTS.USERS.ME);
  },

  getById(id) {
    return axiosInstance.get(ENDPOINTS.USERS.BY_ID(id));
  },

  getByRole(role, params) {
    return axiosInstance.get(ENDPOINTS.USERS.BY_ROLE(role), { params });
  },

  search(params) {
    return axiosInstance.get(ENDPOINTS.USERS.SEARCH, { params });
  },

  create(data) {
    return axiosInstance.post(ENDPOINTS.USERS.BASE, data);
  },

  update(id, data) {
    return axiosInstance.put(ENDPOINTS.USERS.BY_ID(id), data);
  },

  remove(id) {
    return axiosInstance.delete(ENDPOINTS.USERS.BY_ID(id));
  },

  uploadProfilePicture(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post(`${ENDPOINTS.USERS.BASE}/${id}/profile-picture`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getProfilePictureUrl(id) {
    return `${API_BASE_URL}/api/users/${id}/profile-picture?t=${Date.now()}`;
  },

  getPreferences() {
    return axiosInstance.get(ENDPOINTS.USERS.ME_PREFERENCES);
  },

  updatePreferences(data) {
    return axiosInstance.put(ENDPOINTS.USERS.ME_PREFERENCES, data);
  },

  getSupervisorsByDistrict(district) {
    return axiosInstance.get(ENDPOINTS.USERS.SUPERVISORS_BY_DISTRICT, { params: { district } });
  },

  getWorkersByDistrict(district) {
    return axiosInstance.get(ENDPOINTS.USERS.WORKERS_BY_DISTRICT, { params: { district } });
  },

  getWorkersBySupervisor(supervisorId) {
    return axiosInstance.get(ENDPOINTS.USERS.WORKERS_BY_SUPERVISOR(supervisorId));
  },

  reassignSocialWorker(workerId, newSupervisorId) {
    return axiosInstance.post(ENDPOINTS.USERS.REASSIGN(workerId, newSupervisorId));
  },
};
