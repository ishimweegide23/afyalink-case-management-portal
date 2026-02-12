import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const documentApi = {
  upload(file, caseId, interventionId) {
    const formData = new FormData();
    formData.append('file', file);
    if (caseId) formData.append('caseId', caseId);
    if (interventionId) formData.append('interventionId', interventionId);
    return axiosInstance.post(ENDPOINTS.DOCUMENTS.BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getById(id) {
    return axiosInstance.get(ENDPOINTS.DOCUMENTS.BY_ID(id));
  },

  getByCase(caseId, params) {
    return axiosInstance.get(ENDPOINTS.DOCUMENTS.BY_CASE(caseId), { params });
  },

  getByIntervention(interventionId, params) {
    return axiosInstance.get(ENDPOINTS.DOCUMENTS.BY_INTERVENTION(interventionId), { params });
  },

  search(params) {
    return axiosInstance.get(ENDPOINTS.DOCUMENTS.SEARCH, { params });
  },

  archive(id, archived) {
    return axiosInstance.patch(ENDPOINTS.DOCUMENTS.ARCHIVE(id), null, {
      params: { archived },
    });
  },

  remove(id) {
    return axiosInstance.delete(ENDPOINTS.DOCUMENTS.BY_ID(id));
  },

  /** Download file bytes with JWT auth (for images/PDFs in UI). */
  async downloadBlob(id) {
    const res = await axiosInstance.get(ENDPOINTS.DOCUMENTS.DOWNLOAD(id), {
      responseType: 'blob',
    });
    return res.data;
  },

  /** Trigger browser download of a document. */
  async downloadFile(id, fileName) {
    const blob = await this.downloadBlob(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `document-${id}`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};
