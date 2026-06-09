import api from './api';

const committeeService = {
    // Fetch assigned groups for the committee member
    getMyAssignedGroups: async () => {
        const response = await api.get('/evaluation/committee/my-groups');
        return response;
    },

    // Submit committee marks for a student
    submitMarks: async (payload) => {
        const response = await api.post('/evaluation/committee/submit', payload);
        return response;
    },

    // Fetch committee evaluation data for a group (Old endpoint, kept for compatibility if needed)
    getGroupEvaluation: async (groupId, phase = 'FYP-I') => {
        const response = await api.get(`/evaluation/committee/group/${groupId}`, { params: { phase } });
        return response;
    },

    // Save committee marks (Old endpoint, kept for compatibility if needed)
    saveMarks: async (groupId, payload) => {
        const response = await api.post(`/evaluation/committee/group/${groupId}`, payload);
        return response;
    }
};

export default committeeService;
