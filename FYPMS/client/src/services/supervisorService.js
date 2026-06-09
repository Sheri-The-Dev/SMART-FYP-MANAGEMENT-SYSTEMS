import api from './api';

const supervisorService = {

    // Fetch all groups + students for marks entry sidebar
    getStudentsForMarks: async (batchId, phase = 'FYP-I') => {
        const response = await api.get(`/supervisor/marks-entry/${batchId}`, { params: { phase } });
        return response;
    },

    // Save or submit marks for a single student
    saveMarks: async (payload) => {
        const response = await api.post('/supervisor/marks-entry/save', payload);
        return response;
    },

    // Module 10: Grade Summary for Admin/Coordinator
    getGradeSummary: async (batchId) => {
        const response = await api.get('/evaluation/grades/summary', { params: { batch_id: batchId } });
        return response.data || response;
    },
};

export default supervisorService;
