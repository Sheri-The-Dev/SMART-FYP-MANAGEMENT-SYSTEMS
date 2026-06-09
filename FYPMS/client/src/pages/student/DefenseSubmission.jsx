import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, Clock, MapPin, Upload, FileText, 
    CheckCircle, AlertCircle, ArrowLeft, Info, Download 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getMyDefenseSchedule } from '../../services/defenseService';
import api from '../../services/api';
import Header from '../../components/layout/Header';
import Loading from '../../components/common/Loading';
import { useToast } from '../../components/common/Toast';

const DefenseSubmission = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [pdfFile, setPdfFile] = useState(null);
    const [pptxFile, setPptxFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) loadSchedule();
    }, [user]);

    const loadSchedule = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getMyDefenseSchedule(); 
            setSchedule(data);
        } catch (err) {
            console.error('Failed to fetch schedule:', err);
            setError(err?.message || 'Failed to load your defense schedule.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (type === 'pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            return toast.error('Please upload a PDF file for the proposal document.');
        }
        if (type === 'pptx' && !file.name.toLowerCase().endsWith('.pptx') && !file.name.toLowerCase().endsWith('.ppt')) {
            return toast.error('Please upload a PPTX or PPT file for the proposal defense slides.');
        }

        if (type === 'pdf') setPdfFile(file);
        else setPptxFile(file);
    };

    const uploadSingleFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('proposal_id', String(schedule.proposalId || schedule.proposal_id));
        
        // presentation_id is required by backend for grouping
        if (schedule.presentationId || schedule.presentation_id) {
            formData.append('presentation_id', String(schedule.presentationId || schedule.presentation_id));
        }

        return api.post('/defense/submit', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    };

    const handleSubmit = async () => {
        if (!pdfFile && !pptxFile) {
            return toast.error('Please select at least one file to upload.');
        }

        setIsSubmitting(true);
        try {
            const uploadPromises = [];
            if (pdfFile) uploadPromises.push(uploadSingleFile(pdfFile));
            if (pptxFile) uploadPromises.push(uploadSingleFile(pptxFile));
            
            await Promise.all(uploadPromises);
            
            toast.success('Files submitted successfully!');
            setPdfFile(null);
            setPptxFile(null);
            await loadSchedule(); // Refresh status
        } catch (err) {
            toast.error(err?.message || 'Submission failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <Loading fullScreen text="Checking your defense status..." />;

    return (
        <div className="min-h-screen bg-slate-50">
            <Header title="Proposal Defense Submission" />
            
            <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                
                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Proposal Defense Submission</h1>
                        </div>
                        <p className="text-gray-500 ml-10 italic">Module 4: Schedule & File Uploads</p>
                    </div>
                    {schedule && (
                        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 ${
                            schedule.submissionStatus === 'evaluated' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            schedule.submissionStatus === 'submitted' || schedule.submissionStatus === 'evaluated' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                            Status: {schedule.submissionStatus?.replace('_', ' ') || 'Pending'}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3">
                        <AlertCircle className="flex-shrink-0" />
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                )}

                {/* Case 1: No Schedule Found */}
                {!loading && !schedule && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center space-y-6"
                    >
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                            <Calendar className="w-10 h-10 text-[#193869] opacity-40" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-800">No Defense Scheduled Yet</h3>
                            <p className="text-gray-500 max-w-md mx-auto italic">
                                Your proposal has not been scheduled for a defense yet. The coordinator will assign you a date and venue once the schedule is finalized.
                            </p>
                        </div>
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-left max-w-md mx-auto">
                            <h4 className="text-sm font-bold text-[#193869] mb-1 flex items-center gap-2">
                                <Info size={14} /> Next Steps:
                            </h4>
                            <ul className="text-xs text-gray-600 space-y-1 ml-6 list-disc">
                                <li>Ensure your proposal is approved by your supervisor.</li>
                                <li>Complete the PPTX slides for your proposal defense.</li>
                                <li>Check this page regularly for updates.</li>
                            </ul>
                        </div>
                    </motion.div>
                )}

                {/* Case 2: Schedule Exists */}
                {schedule && (
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                        
                        {/* Schedule Info Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-[#193869] to-[#234e92] p-6 text-white">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-300" /> Defense Event Details
                                </h3>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Project Title</span>
                                    <p className="font-bold text-gray-800 leading-tight truncate">{schedule.project_title || schedule.project}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</span>
                                    <p className="font-bold text-gray-800">
                                        {schedule.presentation_date ? new Date(schedule.presentation_date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' }) : 'TBD'} 
                                        {schedule.presentation_time && <span className="text-blue-600 ml-2">@ {schedule.presentation_time}</span>}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Venue / Room</span>
                                    <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                                        <MapPin size={16} />
                                        {schedule.venue || 'TBD'}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Submission Form */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            
                            {/* Upload Section */}
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6 ${schedule.submissionStatus === 'evaluated' ? 'opacity-60 pointer-events-none' : ''}`}
                            >
                                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-50 pb-4">📤 Upload Defense Artifacts</h3>
                                
                                <FileUploadField 
                                    label="Proposal PDF (Template-03)" 
                                    accept=".pdf" 
                                    icon={<FileText className="text-blue-500" />}
                                    isSelected={!!pdfFile}
                                    isUploaded={!!schedule.proposal_pdf_path}
                                    onChange={(e) => handleFileChange(e, 'pdf')}
                                    fileName={pdfFile?.name}
                                />

                                <FileUploadField 
                                    label="Proposal Defense Slides (PPTX)" 
                                    accept=".pptx,.ppt" 
                                    icon={<Upload className="text-amber-500" />}
                                    isSelected={!!pptxFile}
                                    isUploaded={!!schedule.presentation_pptx_path}
                                    onChange={(e) => handleFileChange(e, 'pptx')}
                                    fileName={pptxFile?.name}
                                />

                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || (!pdfFile && !pptxFile)}
                                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                                        isSubmitting || (!pdfFile && !pptxFile) 
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                        : 'bg-[#193869] text-white hover:bg-[#234e92] hover:shadow-blue-100'
                                    }`}
                                >
                                    {isSubmitting ? '⏳ Processing Upload...' : 'Submit Defense Files'}
                                </button>
                                
                                <p className="text-[10px] text-gray-400 text-center italic">
                                    Supported formats: PDF (max 10MB) and PPTX (max 20MB)
                                </p>
                            </motion.div>

                            {/* Guidelines / Status Sidebar */}
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <CheckCircle className="text-emerald-500" size={16} /> Submission Check
                                    </h4>
                                    <div className="space-y-4">
                                        <StatusItem label="Proposal Document" done={!!schedule.proposal_pdf_path || !!pdfFile} />
                                        <StatusItem label="Defense Slides" done={!!schedule.presentation_pptx_path || !!pptxFile} />
                                        <StatusItem label="Scheduled by Coordinator" done={!!schedule} />
                                    </div>
                                </div>

                                {schedule.submissionStatus === 'evaluated' && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-indigo-600 p-6 rounded-3xl shadow-xl text-white space-y-2"
                                    >
                                        <GraduationCap className="w-8 h-8 opacity-50 mb-2" />
                                        <h4 className="font-bold">Evaluation Complete</h4>
                                        <p className="text-xs text-blue-100 leading-relaxed">
                                            Your defense has been evaluated by the committee. You can no longer modify your submissions. Please check your email for the final result.
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const FileUploadField = ({ label, accept, icon, isSelected, isUploaded, onChange, fileName }) => (
    <div className="space-y-2">
        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</label>
        <div className={`relative group border-2 border-dashed rounded-2xl p-4 transition-all ${
            isSelected ? 'border-emerald-200 bg-emerald-50' : 
            isUploaded ? 'border-blue-100 bg-blue-50/30' :
            'border-gray-100 hover:border-gray-200'
        }`}>
            <input 
                type="file" 
                accept={accept} 
                onChange={onChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex items-center gap-3">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-700' : 'text-gray-700'}`}>
                        {isSelected ? fileName : (isUploaded ? 'Re-upload version' : 'Click to browse files')}
                    </p>
                    {isUploaded && !isSelected && <p className="text-[10px] text-emerald-500 font-bold">Already Submitted ✓</p>}
                </div>
            </div>
        </div>
    </div>
);

const StatusItem = ({ label, done }) => (
    <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        {done ? (
            <span className="text-emerald-500 font-bold">Complete ✓</span>
        ) : (
            <span className="text-amber-500 font-bold italic">Pending...</span>
        )}
    </div>
);

export default DefenseSubmission;