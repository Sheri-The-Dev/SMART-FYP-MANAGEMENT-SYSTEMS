import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronRight, CheckCircle, Clock, AlertCircle, Save, Send, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import supervisorService from '../../services/supervisorService';
import Header from '../../components/layout/Header';
import { useAuth } from '../../hooks/useAuth';

// ==============================================================
// CONFIGURATION ROUTER
// ==============================================================
const getLOConfig = (phase) => {
    if (phase === 'FYP-II') {
        return [
            { key: 'lo1', label: 'Mathematics & SE Fundamentals',        maxMarks: 10 },
            { key: 'lo2', label: 'Problem Analysis & Requirements',      maxMarks: 10 },
            { key: 'lo3', label: 'Design & Implementation',              maxMarks: 10 },
            { key: 'lo4', label: 'Evaluation & Valid Conclusions',       maxMarks: 20 },
            { key: 'lo5', label: 'Modern Tools & Techniques',           maxMarks: 15 },
            { key: 'lo6', label: 'Teamwork & Collaboration',            maxMarks: 15 },
            { key: 'lo7', label: 'Communication & Presentation',        maxMarks: 10 },
            { key: 'lo8', label: 'Ethics & Professional Responsibility',maxMarks: 10 },
        ];
    }
    // Default FYP-I
    return [
        { key: 'lo1', label: 'Mathematics & SE Fundamentals',        maxMarks: 10 },
        { key: 'lo2', label: 'Problem Analysis & Requirements',      maxMarks: 20 },
        { key: 'lo3', label: 'Design & Implementation',              maxMarks: 20 },
        { key: 'lo4', label: 'Evaluation & Valid Conclusions',       maxMarks: 10 },
        { key: 'lo5', label: 'Modern Tools & Techniques',           maxMarks: 10 },
        { key: 'lo6', label: 'Teamwork & Collaboration',            maxMarks: 10 },
        { key: 'lo7', label: 'Communication & Presentation',        maxMarks: 10 },
        { key: 'lo8', label: 'Ethics & Professional Responsibility',maxMarks: 10 },
    ];
};

const EMPTY_MARKS = () => {
    const keys = ['lo1','lo2','lo3','lo4','lo5','lo6','lo7','lo8'];
    return keys.reduce((acc, k) => ({ ...acc, [k]: '' }), {});
};

// ==============================================================
// STATUS BADGE
// ==============================================================
const StatusBadge = ({ status }) => {
    const config = {
        SUBMITTED:   { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle size={10} />, label: 'Submitted' },
        DRAFT:       { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   icon: <Clock size={10} />,       label: 'Draft' },
        NOT_STARTED: { bg: 'bg-slate-100',   text: 'text-slate-500',   border: 'border-slate-200',   icon: <AlertCircle size={10} />, label: 'Not Started' },
    };
    const c = config[status] || config.NOT_STARTED;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${c.bg} ${c.text} ${c.border}`}>
            {c.icon} {c.label}
        </span>
    );
};

// ==============================================================
// MAIN COMPONENT
// ==============================================================
const SupervisorEvaluationsPage = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();

    // ---- Data ----
    const [allGroups, setAllGroups]               = useState([]);
    const [loadingGroups, setLoadingGroups]       = useState(true);

    // ---- Batch Filter ----
    const [availableBatches, setAvailableBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId]   = useState('all');
    const [isEvaluationActive, setIsEvaluationActive] = useState(false);

    // ---- Per-student state: { [sap_id]: { lo1:.., lo2:.. } } ----
    const [rubricData, setRubricData]             = useState({});
    const [studentStatus, setStudentStatus]       = useState({}); // { [sap_id]: 'NOT_STARTED'|'DRAFT'|'SUBMITTED' }
    const [studentMeta, setStudentMeta]           = useState({}); // { [sap_id]: { proposal_id, batch_id, phase } }

    // ---- Active selection ----
    const [activeGroup, setActiveGroup]           = useState(null); // proposal_id
    const [activeStudent, setActiveStudent]       = useState(null); // sap_id

    // ---- Saving ----
    const [saving, setSaving]                     = useState(false);

    // ============================================================
    // FETCH GROUPS + STUDENTS ON MOUNT
    // ============================================================
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingGroups(true);
                // Call api with 'all' batches, letting backend figure it out
                const res = await supervisorService.getStudentsForMarks('all', 'FYP-I'); // The phase param is overridden locally if available
                const groupList = Array.isArray(res.data) ? res.data : [];
                setIsEvaluationActive(!!res.is_evaluation_active);
                setAllGroups(groupList);

                // Build initial per-student states
                const rubric = {};
                const statuses = {};
                const meta = {};
                const batchesSet = new Set();
                const batchesArr = [];

                groupList.forEach(group => {
                    if (group.batch_id && !batchesSet.has(group.batch_id)) {
                        batchesSet.add(group.batch_id);
                        batchesArr.push({ id: group.batch_id, label: `Batch ${group.batch_id}` }); 
                    }

                    // Guessing phase from group object if possible, default to FYP-I
                    const phase = group.fyp_phase || 'FYP-I';

                    group.students.forEach(s => {
                        let _marks = EMPTY_MARKS();
                        if (s.lo_marks && Object.values(s.lo_marks).some(v => v !== null)) {
                            Object.keys(_marks).forEach(k => {
                                _marks[k] = s.lo_marks[k] !== null ? s.lo_marks[k] : '';
                            });
                        }
                        rubric[s.sap_id]   = _marks;
                        statuses[s.sap_id] = s.evaluation_status || 'NOT_STARTED';
                        meta[s.sap_id]     = { 
                            proposal_id: group.proposal_id, 
                            batch_id: group.batch_id, 
                            name: s.name,
                            phase: phase,
                            role: s.role,
                            is_committee_done: group.is_committee_done
                        };
                    });
                });

                setAvailableBatches(batchesArr);
                setRubricData(rubric);
                setStudentStatus(statuses);
                setStudentMeta(meta);

            } catch (err) {
                toast.error(err.message || 'Failed to load student list');
            } finally {
                setLoadingGroups(false);
            }
        };
        fetchData();
    }, []);

    // Select first student when groups are filtered
    const displayedGroups = useMemo(() => {
        if (selectedBatchId === 'all') return allGroups;
        return allGroups.filter(g => String(g.batch_id) === String(selectedBatchId));
    }, [allGroups, selectedBatchId]);

    // Active Phase Config
    const currentPhase = activeStudent ? (studentMeta[activeStudent]?.phase || 'FYP-I') : 'FYP-I';
    const LO_CONFIG = useMemo(() => getLOConfig(currentPhase), [currentPhase]);

    // ============================================================
    // MARK CHANGE HANDLER
    // ============================================================
    const handleMarkChange = useCallback((loKey, rawValue) => {
        const lo = LO_CONFIG.find(l => l.key === loKey);
        const max = lo?.maxMarks ?? 100;
        let val = parseInt(rawValue, 10);
        if (isNaN(val)) val = '';
        else val = Math.min(Math.max(0, val), max); // clamp

        setRubricData(prev => ({
            ...prev,
            [activeStudent]: { ...prev[activeStudent], [loKey]: val }
        }));
    }, [activeStudent, LO_CONFIG]);

    // ============================================================
    // LIVE CALCULATION
    // ============================================================
    const currentMarks = (activeStudent && rubricData[activeStudent]) ? rubricData[activeStudent] : {};
    const totalEntered  = LO_CONFIG.reduce((sum, lo) => sum + (Number(currentMarks[lo.key]) || 0), 0);
    const scaledTo50    = +(totalEntered / 2).toFixed(1);
    const isComplete    = totalEntered === 100;

    // ============================================================
    // SAVE / SUBMIT HANDLERS
    // ============================================================
    const handleSaveDraft = async () => {
        if (!activeStudent) return;
        const { proposal_id, batch_id } = studentMeta[activeStudent] || {};

        try {
            setSaving(true);
            await supervisorService.saveMarks({
                student_sap_id: activeStudent,
                batch_id,
                proposal_id,
                fyp_phase: currentPhase,
                marks: currentMarks,
                status: 'DRAFT',
            });
            setStudentStatus(prev => ({ ...prev, [activeStudent]: 'DRAFT' }));
            toast.success('Draft saved successfully', 'success');
        } catch (err) {
            toast.error(err.message || 'Failed to save draft');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitFinal = async () => {
        if (!activeStudent) return;
        if (totalEntered !== 100) {
            toast.error('Total must be exactly 100 before submission', 'error');
            return;
        }

        const studentName = studentMeta[activeStudent]?.name || activeStudent;
        const confirmed = window.confirm(
            'Submit final marks for ' + studentName + 
            '? This cannot be undone.'
        );
        if (!confirmed) return;

        const { proposal_id, batch_id } = studentMeta[activeStudent] || {};

        try {
            setSaving(true);
            await supervisorService.saveMarks({
                student_sap_id: activeStudent,
                batch_id,
                proposal_id,
                fyp_phase: currentPhase,
                marks: currentMarks,
                status: 'SUBMITTED',
            });
            setStudentStatus(prev => ({ ...prev, [activeStudent]: 'SUBMITTED' }));
            toast.success('Marks submitted successfully', 'success');
        } catch (err) {
            toast.error(err.message || 'Failed to submit marks');
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col h-[calc(100vh-73px)]">
                {/* ── BREADCRUMB / TITLE ── */}
                <div className="flex items-center gap-4 mb-6">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Student Evaluations</h1>
                        <p className="text-sm text-gray-500 font-medium">Individual module rubrics for supervised students</p>
                    </div>
                </div>

                {isEvaluationActive && (
                    <div className="mb-6 mx-auto bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="text-sm font-bold text-amber-800">Warning</h3>
                                <p className="text-sm text-amber-700 mt-1">
                                    Evaluation in progress by Committee. Entries are temporarily locked.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TWO PANEL LAYOUT ── */}
                <div className="flex-1 flex gap-6 overflow-hidden bg-white rounded-3xl shadow-lg border border-gray-100">
                    
                    {/* ── LEFT PANEL: GROUPS (1/3) ── */}
                    <div className="w-1/3 flex flex-col border-r border-gray-100 bg-slate-50 overflow-hidden">
                        
                        <div className="p-4 border-b border-gray-100 bg-white">
                            <h2 className="text-sm font-extrabold tracking-widest text-[#193869] uppercase mb-3">My Groups</h2>
                            
                            {/* Batch Selector */}
                            <div className="relative">
                                <select 
                                    value={selectedBatchId}
                                    onChange={e => setSelectedBatchId(e.target.value)}
                                    className="w-full appearance-none bg-slate-50 border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-[#193869] cursor-pointer"
                                >
                                    <option value="all">All Active Batches</option>
                                    {availableBatches.map(b => (
                                        <option key={b.id} value={b.id}>{b.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                            {loadingGroups ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3">
                                    <Loader2 size={24} className="animate-spin text-[#193869]" />
                                    <p className="text-xs text-slate-400 font-medium">Loading groups...</p>
                                </div>
                            ) : displayedGroups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
                                    <Users size={32} className="text-slate-300" />
                                    <p className="text-sm text-slate-400 font-medium">No active groups found in this selection.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {displayedGroups.map(group => (
                                        <div key={group.proposal_id}>
                                            <button
                                                onClick={() => {
                                                    setActiveGroup(group.proposal_id);
                                                    if (group.students.length > 0) setActiveStudent(group.students[0].sap_id);
                                                }}
                                                className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-all text-xs font-extrabold flex items-center justify-between gap-1 shadow-sm ${
                                                    activeGroup === group.proposal_id
                                                        ? 'bg-[#193869] text-white'
                                                        : 'bg-white border border-gray-100 text-slate-700 hover:border-gray-300'
                                                }`}
                                            >
                                                <span className="truncate pr-2">{group.project_title || `Group #${group.proposal_id}`}</span>
                                                <ChevronRight size={14} className={`flex-shrink-0 transition-transform ${activeGroup === group.proposal_id ? 'rotate-90 text-white' : 'text-gray-400'}`} />
                                            </button>

                                            <AnimatePresence>
                                                {activeGroup === group.proposal_id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit  ={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden pl-2 space-y-1 mb-2"
                                                    >
                                                        {group.students.map(student => {
                                                            const isActive = activeStudent === student.sap_id;
                                                            return (
                                                                <button
                                                                    key={student.sap_id}
                                                                    onClick={() => setActiveStudent(student.sap_id)}
                                                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all border shadow-sm ${
                                                                        isActive
                                                                            ? 'bg-blue-50 border-blue-200'
                                                                            : 'bg-white border-transparent hover:border-gray-200'
                                                                    }`}
                                                                >
                                                                    <div className="text-left truncate pr-2">
                                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                                            <p className={`text-[11px] font-extrabold truncate ${isActive ? 'text-[#193869]' : 'text-slate-700'}`}>
                                                                                {student.name}
                                                                            </p>
                                                                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${student.role === 'Leader' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                                {student.role}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[9px] font-medium text-slate-400">{student.sap_id}</p>
                                                                    </div>
                                                                    <div className="flex-shrink-0">
                                                                        <StatusBadge status={studentStatus[student.sap_id] || 'NOT_STARTED'} />
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT PANEL: RUBRIC (2/3) ── */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-white">
                        {!activeStudent ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8 bg-slate-50/50">
                                <Users size={56} className="text-slate-200" />
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-1">No Student Selected</h3>
                                    <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
                                        Please expand a group from the left panel and click on a student to begin evaluating their performance.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col overflow-hidden relative">
                                {/* Header Info */}
                                <div className="p-6 pb-2 border-b border-gray-100 flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1.5">{currentPhase} Rubric Evaluation</p>
                                        <h2 className="text-2xl font-black text-gray-800 mb-0.5 flex items-center gap-2">
                                            {studentMeta[activeStudent]?.name}
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${studentMeta[activeStudent]?.role === 'Leader' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {studentMeta[activeStudent]?.role}
                                            </span>
                                        </h2>
                                        <p className="text-sm text-gray-500 font-semibold">{activeStudent}</p>
                                    </div>
                                    <StatusBadge status={studentStatus[activeStudent]} />
                                </div>

                                {/* Scrollable form */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                    <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 text-left border-b border-gray-200">
                                                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12">#</th>
                                                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Learning Outcome</th>
                                                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-28">Max Marks</th>
                                                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-36">Earned</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {LO_CONFIG.map((lo, idx) => {
                                                    const val = currentMarks[lo.key];
                                                    const over = Number(val) > lo.maxMarks;
                                                    const isLocked = studentStatus[activeStudent] === 'SUBMITTED';

                                                    return (
                                                        <tr key={lo.key} className="hover:bg-blue-50/20 transition-colors">
                                                            <td className="px-5 py-4 text-xs font-black text-slate-400">
                                                                LO{idx + 1}
                                                            </td>
                                                            <td className="px-5 py-4 text-[13px] font-bold text-slate-700">
                                                                {lo.label}
                                                            </td>
                                                            <td className="px-5 py-4 text-center text-sm font-black text-slate-400">
                                                                {lo.maxMarks}
                                                            </td>
                                                            <td className="px-5 py-4 text-center">
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    max={lo.maxMarks}
                                                                    value={val}
                                                                    onChange={e => handleMarkChange(lo.key, e.target.value)}
                                                                    disabled={isLocked || isEvaluationActive}
                                                                    className={`w-24 text-center px-3 py-2 border-2 rounded-xl text-[15px] font-black outline-none transition-all ${
                                                                        over
                                                                            ? 'border-red-300 bg-red-50 text-red-600 focus:ring-4 focus:ring-red-100'
                                                                            : (isLocked || isEvaluationActive)
                                                                            ? 'border-transparent bg-gray-50 text-gray-500 cursor-not-allowed shadow-inner'
                                                                            : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 focus:border-[#193869] focus:ring-4 focus:ring-blue-100'
                                                                    }`}
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* CALCULATION DISPLAY (Shows explicitly at bottom of form) */}
                                    <div className="mt-8 mb-4 max-w-sm ml-auto">
                                        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-200">
                                                Supervisor Contribution
                                            </h4>
                                            
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-sm font-bold text-slate-600">Total Rubric Marks</span>
                                                <div className="text-right">
                                                    <span className={`text-xl font-black ${isComplete ? 'text-emerald-600' : totalEntered > 100 ? 'text-red-600' : 'text-slate-800'}`}>
                                                        {totalEntered}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-400 ml-1">/ 100</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-dashed border-slate-300 pt-4">
                                                <div>
                                                    <span className="text-sm font-black text-[#193869] block">Supervisor Share</span>
                                                    <span className="text-[10px] font-bold text-slate-400">(50% of final grade)</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-[#d29538]">
                                                        {scaledTo50}
                                                    </span>
                                                    <span className="text-sm font-bold text-[#d29538]/60 ml-1">/ 50</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Footer */}
                                <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                                    {studentStatus[activeStudent] === 'SUBMITTED' ? (
                                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-2.5 rounded-xl text-sm font-black shadow-sm">
                                            <CheckCircle size={16} /> Final Marks Submitted
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleSaveDraft}
                                                disabled={saving || isEvaluationActive}
                                                className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-gray-200 hover:border-[#193869] text-gray-700 hover:text-[#193869] rounded-xl text-sm font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                Save Draft
                                            </button>
                                            <button
                                                onClick={handleSubmitFinal}
                                                disabled={saving || !isComplete || !studentMeta[activeStudent]?.is_committee_done || isEvaluationActive}
                                                title={isEvaluationActive ? "Locked by Committee Evaluation" : !studentMeta[activeStudent]?.is_committee_done ? "Waiting for Committee Evaluation..." : !isComplete ? `Total must be exactly 100 before submission (current: ${totalEntered})` : ''}
                                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg relative group ${
                                                    isComplete && studentMeta[activeStudent]?.is_committee_done && !saving && !isEvaluationActive
                                                        ? 'bg-[#193869] hover:bg-[#234e92] text-white hover:shadow-blue-200'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-transparent'
                                                }`}
                                            >
                                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                                Submit Final
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SupervisorEvaluationsPage;
