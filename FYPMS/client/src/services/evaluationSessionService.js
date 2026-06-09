import api from './api';

const evaluationSessionService = {
  // Get all evaluation sessions for a batch
  getAllSessions: async (batchId) => {
    const response = await api.get(`/evaluation-sessions?batch_id=${batchId}`);
    return response.data || response;
  },

  // Create a new evaluation session
  createSession: async (sessionData) => {
    const response = await api.post('/evaluation-sessions', sessionData);
    return response.data || response;
  },

  // Update an existing evaluation session
  updateSession: async (id, sessionData) => {
    const response = await api.put(`/evaluation-sessions/${id}`, sessionData);
    return response.data || response;
  },

  // Delete an evaluation session
  deleteSession: async (id) => {
    const response = await api.delete(`/evaluation-sessions/${id}`);
    return response.data || response;
  },

  // Get groups (proposals) for a batch that haven't been scheduled for evaluation yet
  getUnscheduledGroups: async (batchId) => {
    // This uses the existing presentations/unscheduled-groups endpoint but can be customized later if needed
    // or we can use the specific one mentioned in the task
    const response = await api.get(`/presentations/unscheduled-groups?batch_id=${batchId}`);
    return response.data || response;
  },

  // Get committee members (all users with role 'Committee')
  getCommitteeMembers: async () => {
    const response = await api.get('/admin/users?role=Committee');
    return response.data || response;
  }
};

export default evaluationSessionService;
