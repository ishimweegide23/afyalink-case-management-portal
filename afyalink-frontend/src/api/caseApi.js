import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const caseApi = {
  getAll(params) {
    return axiosInstance.get(ENDPOINTS.CASES.BASE, { params });
  },

  getById(id) {
    return axiosInstance.get(ENDPOINTS.CASES.BY_ID(id));
  },

  getByStatus(status, params) {
    return axiosInstance.get(ENDPOINTS.CASES.BY_STATUS(status), { params });
  },

  search(params) {
    return axiosInstance.get(ENDPOINTS.CASES.SEARCH, { params });
  },

  create(data) {
    return axiosInstance.post(ENDPOINTS.CASES.BASE, data);
  },

  update(id, data) {
    return axiosInstance.put(ENDPOINTS.CASES.BY_ID(id), data);
  },

  remove(id) {
    return axiosInstance.delete(ENDPOINTS.CASES.BY_ID(id));
  },
};
