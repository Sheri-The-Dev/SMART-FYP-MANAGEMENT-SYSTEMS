import api from './api';
import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';

// ==================== USER MANAGEMENT ====================

// Create new user
export const createUser = async (userData) => {
  const response = await api.post('/admin/users', userData);
  return response;
};

// Get all users with filters
export const getAllUsers = async (params = {}) => {
  const queryString = new URLSearchParams(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
  ).toString();
  
  const response = await api.get(`/admin/users${queryString ? `?${queryString}` : ''}`);
  return response;
};

// Get user by ID
export const getUserById = async (id) => {
  const response = await api.get(`/admin/users/${id}`);
  return response;
};

// Update user
export const updateUser = async (id, userData) => {
  const response = await api.put(`/admin/users/${id}`, userData);
  return response;
};

// Delete user
export const deleteUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response;
};

// ==================== PASSWORD RESET ====================

// Admin request password reset (send email)
export const adminRequestPasswordReset = async (id) => {
  const response = await api.post(`/admin/users/${id}/request-password-reset`);
  return response;
};

// Initiate security challenge
export const initiateSecurityChallenge = async (id) => {
  const response = await api.post(`/admin/users/${id}/initiate-security-challenge`);
  return response;
};

// Get security questions for challenge
export const getSecurityQuestions = async (token) => {
  const response = await api.get(`/admin/security-questions?token=${token}`);
  return response;
};

// Verify security answers
export const verifySecurityAnswers = async (token, answers) => {
  const response = await api.post('/admin/verify-security-answers', { token, answers });
  return response;
};

// Complete password reset after verification
export const completePasswordReset = async (token, newPassword) => {
  const response = await api.post('/admin/complete-password-reset', { token, newPassword });
  return response;
};

// ==================== AUDIT LOGS ====================

// Get audit logs
export const getAuditLogs = async (params = {}) => {
  const queryString = new URLSearchParams(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
  ).toString();
  
  const response = await api.get(`/admin/audit-logs${queryString ? `?${queryString}` : ''}`);
  return response;
};

// ==================== WORKLOAD MANAGEMENT ====================

// Get supervisor workload data
export const getWorkloadReport = async (format = 'json') => {
  if (format === 'csv') {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    // For CSV download, we need to handle it differently
    const response = await axios.get(`${API_BASE_URL}/admin/workload-report?format=csv`, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
  
  const response = await api.get('/admin/workload-report');
  return response;
};

// Get supervisor capacity alerts
export const getSupervisorAlerts = async () => {
  const response = await api.get('/admin/supervisor-alerts');
  return response;
};

// Reset supervisor workload
export const resetSupervisorWorkload = async (userId) => {
  const response = await api.put(`/admin/users/${userId}/reset-workload`);
  return response;
};

// Decrement supervisor workload
export const decrementSupervisorWorkload = async (userId) => {
  const response = await api.put(`/admin/users/${userId}/decrement-workload`);
  return response;
};

// ==================== DASHBOARD STATISTICS ====================

// Get dashboard statistics
export const getDashboardStats = async () => {
  const response = await api.get('/admin/dashboard-stats');
  return response;
};

// ==================== BULK OPERATIONS ====================

// Bulk delete users
export const bulkDeleteUsers = async (userIds) => {
  const response = await api.post('/admin/users/bulk-delete', { userIds });
  return response;
};

// Bulk update user status
export const bulkUpdateUserStatus = async (userIds, isActive) => {
  const response = await api.post('/admin/users/bulk-update-status', { userIds, isActive });
  return response;
};

// ==================== EXPORT FUNCTIONS ====================

// Export users to CSV
export const exportUsers = async (data = {}) => {
  const response = await api.post(`/admin/users/export`, data, {
    responseType: 'blob'
  });
  return response;
};

// Export audit logs to CSV
export const exportAuditLogs = async (params = {}) => {
  const queryString = new URLSearchParams(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
  ).toString();
  
  const response = await api.get(`/admin/audit-logs/export${queryString ? `?${queryString}` : ''}`, {
    responseType: 'blob'
  });
  return response;
};

// Export workload report
export const exportWorkloadReport = async (format = 'csv') => {
  const response = await api.get(`/admin/workload-report?format=${format}`, {
    responseType: 'blob'
  });
  return response;
};