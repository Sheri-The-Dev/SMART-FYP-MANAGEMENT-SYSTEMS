import api from './api';

// Login
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response;
};

// Logout
export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response;
};

// Request password reset
export const requestPasswordReset = async (email) => {
  const response = await api.post('/auth/request-password-reset', { email });
  return response;
};

// Validate reset token
export const validateResetToken = async (token) => {
  const response = await api.get(`/auth/validate-reset-token?token=${token}`);
  return response;
};

// Reset password
export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/auth/reset-password', { token, newPassword });
  return response;
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post('/auth/change-password', { 
    currentPassword, 
    newPassword 
  });
  return response;
};

// Get user profile
export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response;
};