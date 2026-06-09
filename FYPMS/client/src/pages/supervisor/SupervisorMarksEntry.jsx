import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, ChevronRight, CheckCircle, Clock, AlertCircle, Save, Send, Loader2 } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import supervisorService from '../../services/supervisorService';

// ==============================================================
// LO RUBRIC CONFIGURATION (LO1–LO8, total must sum to 100)
// ==============================================================
const LO_CONFIG = [
    { key: 'lo1', label: 'Mathematics & SE Fundamentals',     maxMarks: 10 },
    { key: 'lo2', label: 'Problem Analysis & Requirements',   maxMarks: 10 },
    { key: 'lo3', label: 'Design & Implementation',           maxMarks: 10 },
    { key: 'lo4', label: 'Evaluation & Valid Conclusions',    maxMarks: 20 },
    { key: 'lo5', label: 'Modern Tools & Techniques',        maxMarks: 15 },
    { key: 'lo6', label: 'Teamwork & Collaboration',         maxMarks: 15 },
    { key: 'lo7', label: 'Communication & Presentation',     maxMarks: 10 },
    { key: 'lo8', label: 'Ethics & Professional Responsibility', maxMarks: 10 },
];

const EMPTY_MARKS = () =>
    LO_CONFIG.reduce((acc, lo) => ({ ...acc, [lo.key]: '' }), {});

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
const SupervisorMarksEntry = ({ batchId, fyp_phase = 'FYP-I', onClose }) => {
    const toast = useToast();

    // ---- Data ----
    const [groups, setGroups]                     = useState([]);
    const [loadingGroups, setLoadingGroups]       = useState(true);

    // ---- Per-student state: { [sap_id]: { lo1:.., lo2:.. } } ----
    const [rubricData, setRubricData]             = useState({});
    const [studentStatus, setStudentStatus]       = useState({}); // { [sap_id]: 'NOT_STARTED'|'DRAFT'|'SUBMITTED' }
    const [studentMeta, setStudentMeta]           = useState({}); // { [sap_id]: { proposal_id, batch_id } }

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
                const data = await supervisorService.getStudentsForMarks(batchId, fyp_phase);
                const groupList = Array.isArray(data) ? data : [];
                setGroups(groupList);

                // Build initial per-student states
                const rubric = {};
                const statuses = {};
                const meta = {};

                groupList.forEach(group => {
                    group.students.forEach(s => {
                        let _marks = EMPTY_MARKS();
                        if (s.lo_marks && Object.values(s.lo_marks).some(v => v !== null)) {
                            Object.keys(_marks).forEach(k => {
                                _marks[k] = s.lo_marks[k] !== null ? s.lo_marks[k] : '';
                            });
                        }
                        rubric[s.sap_id]   = _marks;
                        statuses[s.sap_id] = s.evaluation_status || 'NOT_STARTED';
                        meta[s.sap_id]     = { proposal_id: group.proposal_id, batch_id: batchId, name: s.name };
                    });
                });

                setRubricData(rubric);
                setStudentStatus(statuses);
                setStudentMeta(meta);

                // Default: open first group / first student
                if (groupList.length > 0) {
                    setActiveGroup(groupList[0].proposal_id);
                    if (groupList[0].students.length > 0) {
                        setActiveStudent(groupList[0].students[0].sap_id);
                    }
                }
            } catch (err) {
                toast.error(err.message || 'Failed to load student list');
            } finally {
                setLoadingGroups(false);
            }
        };
        fetchData();
    }, [batchId, fyp_phase]);

    // ============================================================
    // MARK CHANGE HANDLER  (only touches activeStudent's slice)
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
    }, [activeStudent]);

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
                fyp_phase,
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
                fyp_phase,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 20 }}
                animate={{ scale: 1,    opacity: 1, y: 0  }}
                exit   ={{ scale: 0.96, opacity: 0, y: 20 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100"
            >
                {/* ── HEADER ── */}
                <div className="bg-gradient-to-r from-[#193869] to-[#234e92] p-5 text-white flex justify-between items-center flex-shrink-0">
                    <div>
                        <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-0.5">Module 11 · {fyp_phase}</p>
                        <h2 className="text-xl font-extrabold tracking-tight">Individual Student Evaluation</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* ── BODY: TWO COLUMNS ── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── LEFT SIDEBAR ── */}
                    <div className="w-64 flex-shrink-0 border-r border-gray-100 bg-slate-50 overflow-y-auto">
                        {loadingGroups ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                                <Loader2 size={24} className="animate-spin text-[#193869]" />
                                <p className="text-xs text-slate-400 font-medium">Loading students...</p>
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-2 py-12 px-4 text-center">
                                <Users size={32} className="text-slate-300" />
                                <p className="text-xs text-slate-400 font-medium">No approved groups found for this batch</p>
                            </div>
                        ) : (
                            <div className="p-3 space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Students</p>
                                {groups.map(group => (
                                    <div key={group.proposal_id}>
                                        {/* Group label */}
                                        <button
                                            onClick={() => {
                                                setActiveGroup(group.proposal_id);
                                                if (group.students.length > 0) setActiveStudent(group.students[0].sap_id);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-xl mb-1 transition-all text-xs font-extrabold flex items-center justify-between gap-1 ${
                                                activeGroup === group.proposal_id
                                                    ? 'bg-[#193869] text-white'
                                                    : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            <span className="truncate">{group.project_title}</span>
                                            <ChevronRight size={12} className="flex-shrink-0" />
                                        </button>

                                        {/* Students list (visible when group is active) */}
                                        <AnimatePresence>
                                            {activeGroup === group.proposal_id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit  ={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden pl-2 space-y-1"
                                                >
                                                    {group.students.map(student => {
                                                        const isActive = activeStudent === student.sap_id;
                                                        return (
                                                            <button
                                                                key={student.sap_id}
                                                                onClick={() => setActiveStudent(student.sap_id)}
                                                                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all border ${
                                                                    isActive
                                                                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                                                                        : 'bg-white border-transparent hover:border-gray-200 hover:bg-white'
                                                                }`}
                                                            >
                                                                <p className={`text-xs font-bold truncate ${isActive ? 'text-[#193869]' : 'text-slate-700'}`}>
                                                                    {student.name}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">{student.sap_id}</p>
                                                                <div className="mt-1.5">
                                                                    <StatusBadge status={studentStatus[student.sap_id] || 'NOT_STARTED'} />
                                                                </div>
                                                            </button>
                                                        );
                                                    })}

                                                    {/* NEW FEATURE: Group Marks Summary */}
                                                    {(()=>{
                                                        const allSubmitted = group.students.length > 0 && group.students.every(s => studentStatus[s.sap_id] === 'SUBMITTED');
                                                        
                                                        if (!allSubmitted) {
                                                            return (
                                                                <div className="mt-4 p-3 bg-white border border-dashed border-gray-300 rounded-xl text-center">
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                                        Submit all students<br/>to see group summary.
                                                                    </p>
                                                                </div>
                                                            );
                                                        }

                                                        // All submitted, calculate marks dynamically from rubricData
                                                        let sumOfTotals = 0;
                                                        const summaryRows = group.students.map(s => {
                                                            const mObj = rubricData[s.sap_id] || {};
                                                            const t = LO_CONFIG.reduce((sum, lo) => sum + (Number(mObj[lo.key]) || 0), 0);
                                                            sumOfTotals += t;
                                                            return { name: s.name, sap: s.sap_id, t, share: +(t/2).toFixed(1) };
                                                        });
                                                        const avgT = +(sumOfTotals / group.students.length).toFixed(1);
                                                        const avgShare = +(avgT / 2).toFixed(1);

                                                        return (
                                                            <div className="mt-4 bg-[#193869] text-white rounded-xl overflow-hidden shadow-md">
                                                                <div className="bg-[#12284b] p-2 text-center border-b border-white/10">
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">
                                                                        Group Marks Summary
                                                                    </p>
                                                                </div>
                                                                <div className="p-3 text-[11px]">
                                                                    <div className="space-y-2 mb-3">
                                                                        {summaryRows.map((row, idx) => (
                                                                            <div key={idx} className="flex items-center justify-between">
                                                                                <div className="truncate pr-2 w-1/2">
                                                                                    <span className="font-bold">{row.name}</span>
                                                                                    <span className="text-blue-300 text-[9px] ml-1">({row.sap.slice(-3)})</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 text-right">
                                                                                    <span className="text-gray-300">{row.t}/100</span>
                                                                                    <span className="text-blue-300">→</span>
                                                                                    <span className="font-bold text-[#d29538]">{row.share}%</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className="pt-2 border-t border-white/10 flex items-center justify-between font-black">
                                                                        <span>Group Average:</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-gray-300 font-medium">{avgT}/100</span>
                                                                            <span className="text-blue-300 font-medium">→</span>
                                                                            <span className="text-[#d29538]">{avgShare}%</span>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-[9px] text-blue-200/70 text-center mt-3 leading-tight italic">
                                                                        (Supervisor contributes 50% of final grade)
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: RUBRIC PANEL ── */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {!activeStudent ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                                <Users size={48} className="text-slate-200" />
                                <p className="text-slate-400 font-medium">Select a student from the sidebar to begin evaluation</p>
                            </div>
                        ) : (
                            <>
                                {/* Rubric scroll area */}
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                    <div className="mb-5">
                                        <h3 className="text-base font-extrabold text-gray-800">Rubric Entry</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">Enter marks per Learning Outcome. Max total = 100.</p>
                                    </div>

                                    {/* LO Table */}
                                    <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 text-left">
                                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12">#</th>
                                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Learning Outcome</th>
                                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-28">Max Marks</th>
                                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32">Your Marks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {LO_CONFIG.map((lo, idx) => {
                                                    const val = currentMarks[lo.key];
                                                    const over = Number(val) > lo.maxMarks;
                                                    return (
                                                        <tr key={lo.key} className="hover:bg-blue-50/30 transition-colors">
                                                            <td className="px-4 py-3 text-[11px] font-black text-slate-400">
                                                                LO{idx + 1}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                                                                {lo.label}
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-sm font-bold text-slate-500">
                                                                {lo.maxMarks}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    max={lo.maxMarks}
                                                                    value={val}
                                                                    onChange={e => handleMarkChange(lo.key, e.target.value)}
                                                                    disabled={studentStatus[activeStudent] === 'SUBMITTED'}
                                                                    className={`w-20 text-center px-3 py-1.5 border-2 rounded-xl text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-blue-100 ${
                                                                        over
                                                                            ? 'border-red-300 bg-red-50 text-red-600'
                                                                            : studentStatus[activeStudent] === 'SUBMITTED'
                                                                            ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                                                                            : 'border-gray-200 focus:border-[#193869] bg-white'
                                                                    }`}
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* ── FOOTER: LIVE CALC + BUTTONS ── */}
                                <div className="p-5 border-t border-gray-100 bg-slate-50 flex-shrink-0">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">

                                        {/* Calculation display */}
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Rubric</p>
                                                <p className={`text-2xl font-black tabular-nums ${isComplete ? 'text-emerald-600' : totalEntered > 100 ? 'text-red-600' : 'text-[#193869]'}`}>
                                                    {totalEntered}
                                                    <span className="text-sm text-slate-400 font-bold"> / 100</span>
                                                </p>
                                            </div>
                                            <div className="w-px h-10 bg-gray-200" />
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supervisor Grade (50%)</p>
                                                <p className="text-2xl font-black text-[#d29538] tabular-nums">
                                                    {scaledTo50}
                                                    <span className="text-sm text-slate-400 font-bold"> / 50</span>
                                                </p>
                                            </div>
                                            {isComplete && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-black"
                                                >
                                                    <CheckCircle size={12} /> Ready to Submit
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        {studentStatus[activeStudent] === 'SUBMITTED' ? (
                                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-black">
                                                <CheckCircle size={16} /> Marks Submitted
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={handleSaveDraft}
                                                    disabled={saving}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 hover:border-[#193869] text-gray-700 hover:text-[#193869] rounded-xl text-sm font-black transition-all disabled:opacity-50"
                                                >
                                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                    Save Draft
                                                </button>
                                                <button
                                                    onClick={handleSubmitFinal}
                                                    disabled={saving || !isComplete}
                                                    title={!isComplete ? `Total must be exactly 100 before submission (current: ${totalEntered})` : ''}
                                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg ${
                                                        isComplete && !saving
                                                            ? 'bg-[#193869] hover:bg-[#234e92] text-white hover:shadow-blue-200'
                                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                                    Submit Final
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SupervisorMarksEntry;
