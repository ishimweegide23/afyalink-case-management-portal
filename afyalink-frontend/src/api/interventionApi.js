import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const interventionApi = {
  getAll(params) {
    return axiosInstance.get(ENDPOINTS.INTERVENTIONS.BASE, { params });
  },

  getStats() {
    return axiosInstance.get(ENDPOINTS.INTERVENTIONS.STATS);
  },

  getMySchedule(params) {
    return axiosInstance.get(ENDPOINTS.INTERVENTIONS.MY_SCHEDULE, { params });
  },

  getById(id) {
    return axiosInstance.get(ENDPOINTS.INTERVENTIONS.BY_ID(id));
  },

  getByStatus(status, params) {
    return axiosInstance.get(ENDPOINTS.INTERVENTIONS.BY_STATUS(status), { params });
  },

  getByType(type, params) {
    return axiosInstance.get(ENDPOINTS.INTERVENTIONS.BY_TYPE(type), { params });
  },

  search(params) {
    return axiosInstance.get(ENDPOINTS.INTERVENTIONS.SEARCH, { params });
  },

  getByCase(caseId, params) {
    return axiosInstance.get(ENDPOINTS.INTERVENTIONS.BY_CASE(caseId), { params });
  },

  searchByCase(caseId, params) {
    return axiosInstance.get(ENDPOINTS.INTERVENTIONS.SEARCH_BY_CASE(caseId), { params });
  },

  create(data) {
    return axiosInstance.post(ENDPOINTS.INTERVENTIONS.BASE, data);
  },

  update(id, data) {
    return axiosInstance.put(ENDPOINTS.INTERVENTIONS.BY_ID(id), data);
  },

  remove(id) {
    return axiosInstance.delete(ENDPOINTS.INTERVENTIONS.BY_ID(id));
  },

  delete(id) {
    return axiosInstance.delete(ENDPOINTS.INTERVENTIONS.BY_ID(id));
  },

  getStaff(id) {
    return axiosInstance.get(ENDPOINTS.INTERVENTIONS.STAFF(id));
  },

  assignStaff(interventionId, userId, roleInIntervention) {
    return axiosInstance.post(ENDPOINTS.INTERVENTIONS.STAFF(interventionId), null, {
      params: { userId, roleInIntervention },
    });
  },

  removeStaff(interventionId, userId) {
    return axiosInstance.delete(ENDPOINTS.INTERVENTIONS.REMOVE_STAFF(interventionId, userId));
  },
};
