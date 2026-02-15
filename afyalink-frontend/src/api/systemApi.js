import axiosInstance from './axiosInstance';

export const systemApi = {
  getServerDate() {
    return axiosInstance.get('/system/date');
  },
};
