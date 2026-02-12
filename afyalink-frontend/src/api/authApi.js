import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const authApi = {
  login(email, password) {
    return axiosInstance.post(ENDPOINTS.AUTH.LOGIN, { email, password });
  },

  register(data) {
    return axiosInstance.post(ENDPOINTS.AUTH.REGISTER, {
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      role: data.role,
      phoneNumber: data.phoneNumber || null,
      department: data.department || null,
      jobTitle: data.jobTitle || null,
    });
  },

  changePassword(currentPassword, newPassword) {
    return axiosInstance.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });
  },

  forgotPassword(email) {
    return axiosInstance.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  verifyOtp(email, otp) {
    return axiosInstance.post(ENDPOINTS.AUTH.VERIFY_OTP, { email, otp });
  },

  resetPassword(email, otp, newPassword) {
    return axiosInstance.post(ENDPOINTS.AUTH.RESET_PASSWORD, { email, otp, newPassword });
  },

  // 2FA Endpoints
  sendTwoFactorLoginOtp(userId) {
    return axiosInstance.post(`/2fa/send-login-otp?userId=${userId}`);
  },

  verifyTwoFactorLogin(userId, code) {
    return axiosInstance.post('/2fa/verify-login', { userId, code });
  },

  sendTwoFactorSetupOtp() {
    return axiosInstance.post('/2fa/send-setup-otp');
  },

  enableTwoFactor(code) {
    return axiosInstance.post('/2fa/enable', { code });
  },

  disableTwoFactor() {
    return axiosInstance.post('/2fa/disable');
  },

  getTwoFactorStatus() {
    return axiosInstance.get('/2fa/status');
  },
};
