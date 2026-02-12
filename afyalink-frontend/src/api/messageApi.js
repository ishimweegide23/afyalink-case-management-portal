import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const messageApi = {
  getConversations() {
    return axiosInstance.get(ENDPOINTS.MESSAGES.CONVERSATIONS);
  },

  getMessageableUsers() {
    return axiosInstance.get(ENDPOINTS.MESSAGES.MESSAGEABLE_USERS);
  },

  createAllStaffGroup(data) {
    return axiosInstance.post(ENDPOINTS.MESSAGES.GROUPS_ALL_STAFF, data);
  },

  createTeamGroup(data) {
    return axiosInstance.post(ENDPOINTS.MESSAGES.GROUPS_TEAM, data);
  },

  renameGroup(conversationId, newGroupName) {
    return axiosInstance.put(ENDPOINTS.MESSAGES.GROUPS_RENAME, { conversationId, newGroupName });
  },

  updateGroupAvatar(conversationId, file) {
    const formData = new FormData();
    formData.append('conversationId', conversationId);
    formData.append('file', file);
    return axiosInstance.post(ENDPOINTS.MESSAGES.GROUPS_AVATAR, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  removeGroupAvatar(conversationId) {
    return axiosInstance.delete(`${ENDPOINTS.MESSAGES.GROUPS_AVATAR}?conversationId=${conversationId}`);
  },

  getById(id) {
    return axiosInstance.get(ENDPOINTS.MESSAGES.BY_ID(id));
  },

  getByConversation(conversationId, params) {
    return axiosInstance.get(ENDPOINTS.MESSAGES.BY_CONVERSATION(conversationId), { params });
  },

  getByCase(caseId, params) {
    return axiosInstance.get(ENDPOINTS.MESSAGES.BY_CASE(caseId), { params });
  },

  search(params) {
    return axiosInstance.get(ENDPOINTS.MESSAGES.SEARCH, { params });
  },

  searchConversation(conversationId, params) {
    return axiosInstance.get(ENDPOINTS.MESSAGES.SEARCH_CONVERSATION(conversationId), { params });
  },

  send(data) {
    return axiosInstance.post(ENDPOINTS.MESSAGES.BASE, data);
  },

  uploadAttachment(file) {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post(ENDPOINTS.MESSAGES.UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  remove(id) {
    return axiosInstance.delete(ENDPOINTS.MESSAGES.BY_ID(id));
  },
};
