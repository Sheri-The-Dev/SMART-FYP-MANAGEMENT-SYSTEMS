import api from './api';

// NOTE: api.js baseURL = 'http://localhost:5000/api'
// So all paths here are relative to /api — do NOT include /api prefix

export const getMyDefenseSchedule = async () => {
    const result = await api.get('/defense/my-schedule');
    return result?.data ?? null;
};

export const getScheduledDefenses = async () => {
    const result = await api.get('/defense/scheduled');
    return Array.isArray(result?.data) ? result.data : [];
};

export const submitEvaluation = async (evaluationData) => {
    const result = await api.post('/defense/evaluate', evaluationData);
    return result;
};