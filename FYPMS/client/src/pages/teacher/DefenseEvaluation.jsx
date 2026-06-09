import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, ArrowLeft, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getScheduledDefenses, submitEvaluation } from '../../services/defenseService';
import EvaluationModal from '../../components/teacher/EvaluationModal';
import Header from '../../components/layout/Header';
import Loading from '../../components/common/Loading';
import { useToast } from '../../components/common/Toast';

const DefenseEvaluation = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [defenses, setDefenses] = useState([]);
    const [selectedDefense, setSelectedDefense] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchScheduledDefenses();
    }, [user]);

    const fetchScheduledDefenses = async () => {
        try {
            setIsLoading(true);
            setError('');
            const data = await getScheduledDefenses();
            // data is { success, data: [...] } from service
            setDefenses(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load scheduled defenses:', err);
            setError(err?.message || 'Failed to load scheduled defenses');
            setDefenses([]);
        } finally {
            setIsLoading(false);
        }
    };

    const openEvaluationModal = (defense) => {
        setSelectedDefense(defense);
    };

    const closeEvaluationModal = () => {
        setSelectedDefense(null);
    };

    const handleSubmitEvaluation = async (evaluationData) => {
        try {
            const response = await submitEvaluation(evaluationData);
            if (response.success) {
                toast.success('Evaluation submitted successfully');
                // Refresh list
                fetchScheduledDefenses();
                closeEvaluationModal();
            }
        } catch (err) {
            console.error('Evaluation submission failed:', err);
            toast.error('Submission failed: ' + (err.message || 'Unknown error'));
        }
    };

    if (isLoading) return <Loading fullScreen text="Loading defense schedule..." />;

    return (
        <div className="min-h-screen bg-slate-50">
            <Header title="Defense Evaluation" />

            <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                                title="Back to Dashboard"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Today's Proposal Defense Evaluations</h1>
                        </div>
                        <p className="text-gray-500 ml-10">
                            Welcome, <span className="font-semibold text-[#193869]">{user?.username}</span>. Manage and evaluate today's scheduled proposal defenses.
                        </p>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl"
                    >
                        <AlertCircle className="flex-shrink-0" />
                        <p className="font-medium text-sm">{error}</p>
                    </motion.div>
                )}

                {/* Empty State */}
                {!error && defenses.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm"
                    >
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-10 h-10 text-[#193869] opacity-50" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700">No proposal defenses scheduled for today</h3>
                        <p className="text-gray-400 mt-2 max-w-sm mx-auto">
                            The coordinator hasn't assigned any groups to you for today's proposal defense session yet.
                        </p>
                    </motion.div>
                )}

                {/* Defense List */}
                {defenses.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {defenses.map((defense, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={defense.id}
                                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#193869] group-hover:w-2 transition-all"></div>

                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-[#193869] mb-2 uppercase tracking-wider">
                                            {defense.groupName}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 leading-snug group-hover:text-[#193869] transition-colors">
                                            {defense.project}
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                                            <Users size={14} />
                                            Lead: {defense.leadName}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => openEvaluationModal(defense)}
                                        className="bg-[#193869] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#234e92] hover:shadow-lg transition-all flex items-center gap-2"
                                    >
                                        <CheckCircle size={16} /> Evaluate
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-auto">
                                    <div className="flex items-center gap-2.5 text-sm font-medium text-gray-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <Clock className="w-4 h-4 text-indigo-500" />
                                        {defense.scheduledTime.split(' at ')[1] || 'TBD'}
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm font-medium text-gray-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <MapPin className="w-4 h-4 text-rose-500" />
                                        <span className="truncate">{defense.venue || 'No Venue Set'}</span>
                                    </div>
                                </div>

                                {/* Submission Status indicators */}
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-3">
                                    <div className={`flex items-center gap-1.5 text-xs font-bold ${defense.proposalUrl ? 'text-emerald-600' : 'text-amber-500'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${defense.proposalUrl ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                                        {defense.proposalUrl ? 'Proposal PDF ready' : 'PDF Missing'}
                                    </div>
                                    <div className={`flex items-center gap-1.5 text-xs font-bold ${defense.presentationUrl ? 'text-emerald-600' : 'text-amber-500'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${defense.presentationUrl ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                                        {defense.presentationUrl ? 'PPTX ready' : 'PPTX Missing'}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Evaluation Modal */}
            {selectedDefense && (
                <EvaluationModal
                    defense={selectedDefense}
                    onClose={closeEvaluationModal}
                    onSubmit={handleSubmitEvaluation}
                />
            )}
        </div>
    );
};

export default DefenseEvaluation;