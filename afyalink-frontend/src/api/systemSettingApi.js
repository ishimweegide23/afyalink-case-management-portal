import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const systemSettingApi = {
  getAll(params) {
    return axiosInstance.get(ENDPOINTS.SETTINGS.BASE, { params });
  },

  getByKey(key) {
    return axiosInstance.get(ENDPOINTS.SETTINGS.BY_KEY(key));
  },

  updateByKey(key, value) {
    return axiosInstance.put(ENDPOINTS.SETTINGS.BY_KEY(key), { value });
  },

  getCategory(category) {
    return axiosInstance.get(ENDPOINTS.SETTINGS.CATEGORY(category));
  },

  updateCategory(category, data) {
    return axiosInstance.put(ENDPOINTS.SETTINGS.CATEGORY(category), data);
  },

  searchCategory(category, params) {
    return axiosInstance.get(ENDPOINTS.SETTINGS.CATEGORY_SEARCH(category), { params });
  },

  search(params) {
    return axiosInstance.get(ENDPOINTS.SETTINGS.SEARCH, { params });
  },
};
