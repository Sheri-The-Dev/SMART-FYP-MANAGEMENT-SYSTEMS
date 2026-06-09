import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download, CheckCircle, ChevronRight, AlertCircle, MessageSquare, Tag } from 'lucide-react';

const QUICK_FEEDBACK_TAGS = [
    'Increase Scope',
    'Improve UI',
    'Refine Objectives',
    'Enhance Methodology',
    'Fix Architecture',
    'Improve Defense Presentation',
    'Expand Background',
    'Better Documentation',
    'Clarify Flow',
    'Strengthen Evaluation'
];

const EvaluationModal = ({ defense, onClose, onSubmit }) => {
    const [selectedTags, setSelectedTags] = useState([]);
    const [verdict, setVerdict] = useState('');
    const [feedback, setFeedback] = useState('');
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = async () => {
        const newErrors = {};
        if (!verdict) newErrors.verdict = 'Please select a final verdict.';
        if (verdict === 'rejected' && !feedback.trim())
            newErrors.feedback = 'Written feedback is mandatory for rejections.';
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit({
                defenseId:      defense.id,
                proposalId:     defense.proposalId,
                presentationId: defense.presentationId,
                verdict,
                feedback,
                tags: selectedTags,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const getVerdictColor = () => {
        switch (verdict) {
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'approved_with_changes': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#193869] to-[#234e92] p-6 text-white flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-5 h-5 text-blue-300" />
                            <h2 className="text-xl font-bold tracking-tight">Evaluate Proposal Defense</h2>
                        </div>
                        <p className="text-blue-100 text-sm opacity-90">{defense.project}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-7 custom-scrollbar">
                    
                    {/* Project Context Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Batch</span>
                            <span className="text-sm font-bold text-slate-700">{defense.groupName}</span>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Lead Student</span>
                            <span className="text-sm font-bold text-slate-700 truncate block">{defense.leadName}</span>
                        </div>
                    </div>

                    {/* Module 7 Submissions (Files) */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={14} /> Submission Artifacts (Module 7)
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            {defense.proposalUrl ? (
                                <a 
                                    href={defense.proposalUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-4 py-3 bg-white border border-blue-100 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
                                >
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                                        <FileText size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-gray-800 leading-tight">View Proposal PDF</p>
                                        <p className="text-[10px] text-gray-500 lowercase">template-03.pdf</p>
                                    </div>
                                </a>
                            ) : (
                                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl opacity-60">
                                    <FileText size={18} className="text-gray-400" />
                                    <p className="text-xs font-bold text-gray-400">PDF Not Submitted</p>
                                </div>
                            )}

                            {defense.presentationUrl ? (
                                <a 
                                    href={defense.presentationUrl} 
                                    download
                                    className="flex items-center gap-3 px-4 py-3 bg-white border border-amber-100 rounded-xl hover:border-amber-300 hover:shadow-md transition-all group"
                                >
                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
                                        <Download size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-gray-800 leading-tight">Download PPTX</p>
                                        <p className="text-[10px] text-gray-500 lowercase">defense_presentation.pptx</p>
                                    </div>
                                </a>
                            ) : (
                                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl opacity-60">
                                    <Download size={18} className="text-gray-400" />
                                    <p className="text-xs font-bold text-gray-400">PPTX Not Submitted</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Feedback Tags as interactive chips */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Tag size={14} /> Interactive Feedback Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_FEEDBACK_TAGS.map(tag => {
                                const isActive = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                                            isActive 
                                            ? 'bg-[#193869] border-[#193869] text-white shadow-md' 
                                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        {isActive && <CheckCircle size={10} className="inline mr-1" />}
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Verdict Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <ChevronRight size={14} /> Final Verdict
                        </label>
                        <div className={`p-1 rounded-2xl border-2 transition-all ${getVerdictColor()}`}>
                            <div className="grid grid-cols-3 gap-1">
                                <VerdictOption 
                                    label="Approved" 
                                    active={verdict === 'approved'} 
                                    onClick={() => { setVerdict('approved'); setErrors({}); }}
                                    color="bg-emerald-500"
                                />
                                <VerdictOption 
                                    label="Approved with Changes" 
                                    active={verdict === 'approved_with_changes'} 
                                    onClick={() => { setVerdict('approved_with_changes'); setErrors({}); }}
                                    color="bg-amber-500"
                                />
                                <VerdictOption 
                                    label="Rejected" 
                                    active={verdict === 'rejected'} 
                                    onClick={() => { setVerdict('rejected'); setErrors({}); }}
                                    color="bg-red-500"
                                />
                            </div>
                        </div>
                        {errors.verdict && (
                            <p className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1">
                                <AlertCircle size={12} /> {errors.verdict}
                            </p>
                        )}
                    </div>

                    {/* Written Feedback */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare size={14} /> Detailed Comments 
                            {verdict === 'rejected' && <span className="text-red-500 lowercase">(Required)</span>}
                        </label>
                        <textarea
                            className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-gray-300 text-sm ${
                                errors.feedback ? 'border-red-200' : 'border-gray-100 focus:border-[#193869]'
                            }`}
                            placeholder="Write your constructive feedback for the students here..."
                            rows={4}
                            value={feedback}
                            onChange={(e) => { setFeedback(e.target.value); setErrors(p => ({ ...p, feedback: '' })); }}
                        />
                        {errors.feedback && (
                            <p className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1">
                                <AlertCircle size={12} /> {errors.feedback}
                            </p>
                        )}
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 font-bold text-gray-500 hover:text-gray-800 transition-colors"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className={`px-10 py-3 rounded-2xl font-black text-sm text-white shadow-lg transition-all duration-300 transform active:scale-95 ${
                            submitting ? 'bg-gray-400 cursor-not-allowed' :
                            verdict === 'rejected' ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-200' :
                            verdict === 'approved_with_changes' ? 'bg-amber-600 hover:bg-amber-700 hover:shadow-amber-200' :
                            verdict === 'approved' ? 'bg-[#193869] hover:bg-[#234e92] hover:shadow-blue-200' :
                            'bg-gray-400'
                        }`}
                    >
                        {submitting ? 'Processing...' : verdict === 'rejected' ? 'Submit Rejection' : 'Submit Evaluation'}
                    </button>
                </div>

            </motion.div>
        </div>
    );
};

const VerdictOption = ({ label, active, onClick, color }) => (
    <button
        onClick={onClick}
        type="button"
        className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
            active 
            ? `${color} text-white shadow-inner scale-100` 
            : 'bg-white text-gray-400 hover:text-gray-600'
        }`}
    >
        {label}
    </button>
);

export default EvaluationModal;