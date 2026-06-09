import api from './api';
import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';

// ============================================
// PROPOSAL SERVICE - FIXED FOR BLOB DOWNLOADS
// ============================================
// All API calls for proposal management
// FIXED: Standardized to return response.data for consistent structure
// ============================================

const proposalService = {
  
  // ============================================
  // STUDENT APIs
  // ============================================
  
  // Create new proposal (draft)
  createProposal: async (proposalData) => {
    const response = await api.post('/proposals/create', proposalData);
    return response.data || response;
  },

  // Get my proposals
  getMyProposals: async () => {
    const response = await api.get('/proposals/my-proposals');
    return response.data || response;
  },

  // Get proposal details
  getProposalDetails: async (proposalId) => {
    const response = await api.get(`/proposals/${proposalId}`);
    return response.data || response;
  },

  // Update proposal
  updateProposal: async (proposalId, updateData) => {
    const response = await api.put(`/proposals/${proposalId}`, updateData);
    return response.data || response;
  },

  // Upload proposal PDF
  uploadProposalPDF: async (proposalId, file) => {
    const formData = new FormData();
    formData.append('proposal_pdf', file);
    
    const response = await api.post(`/proposals/${proposalId}/upload-pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data || response;
  },

  // Submit proposal to supervisor
  submitProposal: async (proposalId) => {
    const response = await api.post(`/proposals/${proposalId}/submit`);
    return response.data || response;
  },

  // Delete proposal
  deleteProposal: async (proposalId) => {
    const response = await api.delete(`/proposals/${proposalId}`);
    return response.data || response;
  },

  // ============================================
  // SUPERVISOR APIs
  // ============================================
  
  // Get proposals assigned to supervisor
  getSupervisorProposals: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/proposals/supervisor/assigned', { params });
    return response.data || response;
  },

  // Approve proposal
  approveProposal: async (proposalId) => {
    const response = await api.post(`/proposals/${proposalId}/approve`);
    return response.data || response;
  },

  // Reject proposal
  rejectProposal: async (proposalId, feedback) => {
    const response = await api.post(`/proposals/${proposalId}/reject`, { feedback });
    return response.data || response;
  },

  // Request revision
  requestRevision: async (proposalId, feedback) => {
    const response = await api.post(`/proposals/${proposalId}/request-revision`, { feedback });
    return response.data || response;
  },

  // ============================================
  // COMMON APIs
  // ============================================
  
  // Get available supervisors
  getAvailableSupervisors: async () => {
    const response = await api.get('/proposals/supervisors/available');
    return response;
  },

  // Download proposal template - FIXED: Uses direct axios to get blob
  downloadTemplate: async () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    
    const response = await axios.get(`${API_BASE_URL}/proposals/templates/download`, {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
    
    // Return the actual blob, not response.data
    return response.data;
  },

  // ============================================
  // ADMIN APIs
  // ============================================
  
  // Upload proposal template
  uploadTemplate: async (file, templateName) => {
    const formData = new FormData();
    formData.append('template', file);
    formData.append('template_name', templateName);
    
    const response = await api.post('/proposals/templates/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  // Delete template
  deleteTemplate: async (templateId) => {
    const response = await api.delete(`/proposals/templates/${templateId}`);
    return response;
  },

  // Get all proposals (admin)
  getAllProposals: async (filters = {}) => {
    const response = await api.get('/proposals/admin/all', { params: filters });
    return response;
  },

  // Get proposal analytics
  getProposalAnalytics: async () => {
    const response = await api.get('/proposals/admin/analytics');
    return response;
  },

  // Get proposal activity logs
  getProposalActivityLogs: async (proposalId) => {
    const response = await api.get(`/proposals/admin/activity-logs/${proposalId}`);
    return response;
  },

  // Delete proposal (admin full authority)
  adminDeleteProposal: async (proposalId) => {
    const response = await api.delete(`/proposals/admin/${proposalId}`);
    return response.data || response;
  },

  // Get current active template
  getCurrentTemplate: async () => {
    const response = await api.get('/proposals/templates/current');
    return response;
  },
};

export default proposalService;
