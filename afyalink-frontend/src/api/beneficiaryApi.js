import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import { API_BASE_URL } from '../utils/constants';

export const beneficiaryApi = {
  getAll(params) {
    return axiosInstance.get(ENDPOINTS.BENEFICIARIES.BASE, { params });
  },

  search(params) {
    return axiosInstance.get(ENDPOINTS.BENEFICIARIES.SEARCH, { params });
  },

  getById(id) {
    return axiosInstance.get(ENDPOINTS.BENEFICIARIES.BY_ID(id));
  },

  create(data) {
    return axiosInstance.post(ENDPOINTS.BENEFICIARIES.BASE, data);
  },

  update(id, data) {
    return axiosInstance.put(ENDPOINTS.BENEFICIARIES.BY_ID(id), data);
  },

  uploadProfilePicture(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post(`${ENDPOINTS.BENEFICIARIES.BASE}/${id}/profile-picture`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getProfilePictureUrl(id) {
    return `${API_BASE_URL}/api/beneficiaries/${id}/profile-picture?t=${Date.now()}`;
  },
};
