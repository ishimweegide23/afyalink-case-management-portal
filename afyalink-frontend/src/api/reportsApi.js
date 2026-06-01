// Ensure responsive layout on mobile devices
import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const reportsApi = {
  getCaseStats(params) {
    return axiosInstance.get('/cases', { params: { ...params, size: 1000 } });
  },
  getBeneficiaryStats(params) {
    return axiosInstance.get('/beneficiaries/search', { params: { ...params, size: 1000 } });
  },
  getInterventionStats(params) {
    return axiosInstance.get('/interventions', { params: { ...params, size: 1000 } });
  },
  getUserStats(params) {
    return axiosInstance.get('/users', { params: { ...params, size: 1000 } });
  },
  create(body) {
    return axiosInstance.post(ENDPOINTS.REPORTS_V2.BASE, body);
  },
  getMy(params = {}) {
    return axiosInstance.get(ENDPOINTS.REPORTS_V2.MY, { params });
  },
  getTeam(params = {}) {
    return axiosInstance.get(ENDPOINTS.REPORTS_V2.TEAM, { params });
  },
  getAll(params = {}) {
    return axiosInstance.get(ENDPOINTS.REPORTS_V2.ALL, { params });
  },
  getById(id) {
    return axiosInstance.get(ENDPOINTS.REPORTS_V2.BY_ID(id));
  },
  update(id, body) {
    return axiosInstance.put(ENDPOINTS.REPORTS_V2.BY_ID(id), body);
  },
  finalize(id) {
    return axiosInstance.patch(`/reports/${id}/finalize`);
  },
  submit(id) {
    return axiosInstance.patch(`/reports/${id}/submit`);
  },
  delete(id) {
    return axiosInstance.delete(ENDPOINTS.REPORTS_V2.BY_ID(id));
  },
  exportPdf(id) {
    return axiosInstance.get(ENDPOINTS.REPORTS_V2.EXPORT_PDF(id), { responseType: 'blob' });
  },
  exportExcel(id) {
    return axiosInstance.get(ENDPOINTS.REPORTS_V2.EXPORT_EXCEL(id), { responseType: 'blob' });
  },
  exportWord(id) {
    return axiosInstance.get(ENDPOINTS.REPORTS_V2.EXPORT_WORD(id), { responseType: 'blob' });
  },
  getSubmissionStatus(params) {
    return axiosInstance.get(ENDPOINTS.REPORTS_V2.ADMIN_SUBMISSION_STATUS, { params });
  },
  createCombinedReport(body) {
    return axiosInstance.post(ENDPOINTS.REPORTS_V2.ADMIN_CREATE_COMBINED, body);
  },
  createSupervisorTeamReport(body) {
    return axiosInstance.post(ENDPOINTS.REPORTS_V2.SUPERVISOR_TEAM, body);
  },
  provideFeedback(id, body) {
    return axiosInstance.post(`/reports/${id}/feedback`, body);
  },
  getOrganizationReportData(params) {
    return axiosInstance.get('/reports/admin/organization-report-data', { params });
  },
  // Create an organization report (admin only) — supports district filter, custom narrative, attachments
  createOrgReport(body) {
    return axiosInstance.post('/reports/admin/combined', body);
  },
  // Upload a file as a Document entity; returns { id, filePath, fileName, ... }
  uploadAttachment(formData) {
    return axiosInstance.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
