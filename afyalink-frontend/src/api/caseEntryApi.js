import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const caseEntryApi = {
  getAll(caseId, params) {
    return axiosInstance.get(ENDPOINTS.CASE_ENTRIES.BASE(caseId), { params });
  },

  getById(caseId, id) {
    return axiosInstance.get(ENDPOINTS.CASE_ENTRIES.BY_ID(caseId, id));
  },

  search(caseId, params) {
    return axiosInstance.get(ENDPOINTS.CASE_ENTRIES.SEARCH(caseId), { params });
  },

  getOverdueTasks(caseId) {
    return axiosInstance.get(ENDPOINTS.CASE_ENTRIES.OVERDUE(caseId));
  },

  create(caseId, data) {
    return axiosInstance.post(ENDPOINTS.CASE_ENTRIES.BASE(caseId), data);
  },

  update(caseId, id, data) {
    return axiosInstance.put(ENDPOINTS.CASE_ENTRIES.BY_ID(caseId, id), data);
  },

  remove(caseId, id) {
    return axiosInstance.delete(ENDPOINTS.CASE_ENTRIES.BY_ID(caseId, id));
  },
};
