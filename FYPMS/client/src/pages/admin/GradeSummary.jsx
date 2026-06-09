import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Search, Award, Filter, RefreshCw, CheckCircle, Clock, AlertCircle, Loader2, Send } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import * as XLSX from 'xlsx';
import Header from '../../components/layout/Header';
import Loading from '../../components/common/Loading';
import { useToast } from '../../components/common/Toast';
import api from '../../services/api';
import supervisorService from '../../services/supervisorService';

// ==============================================================
// MODULE 10 — GRADE SUMMARY TABLE
// Final % = (Supervisor_Marks / 2) + (Committee_LO_Marks / 2)
// Calculation is done ON THE BACKEND (SQL ROUND formula)
// ==============================================================

const STATUS_CONFIG = {
    COMPLETE:   { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle size={11} />, label: 'Complete' },
    PENDING:       { bg: 'bg-amber-100',   text: 'text-amber-700',   icon: <Clock size={11} />,       label: 'Pending' },
    NOT_STARTED: { bg: 'bg-slate-100',   text: 'text-slate-500',   icon: <AlertCircle size={11} />, label: 'Not Started' },
};

const StatusPill = ({ status }) => {
    const c = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${c.bg} ${c.text}`}>
            {c.icon} {c.label}
        </span>
    );
};

const GradeBadge = ({ value }) => {
    const pct = Number(value) || 0;
    let color = 'text-slate-300';
    if (pct >= 90) color = 'text-emerald-600';
    else if (pct >= 80) color = 'text-emerald-500';
    else if (pct >= 70) color = 'text-blue-500';
    else if (pct >= 60) color = 'text-amber-500';
    else if (pct >= 50) color = 'text-orange-500';
    else if (pct > 0) color = 'text-red-500';
    
    return <span className={`text-base font-extrabold tabular-nums ${color}`}>{pct > 0 ? `${pct}%` : '—'}</span>;
};

const GradeSummary = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [batches, setBatches]           = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [gradeData, setGradeData]       = useState([]);
    const [loading, setLoading]           = useState(true);
    const [fetching, setFetching]         = useState(false);
    const [searchTerm, setSearchTerm]     = useState('');
    const [announcing, setAnnouncing]     = useState(false);
    const [finalizing, setFinalizing]     = useState(false);
    const [finalizeResult, setFinalizeResult] = useState(null);
    const [selectedBatchObj, setSelectedBatchObj] = useState(null);

    // ---- Fetch batches ----
    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const res = await api.get('/curriculum/batches');
                if (res.success) {
                    setBatches(res.data || []);
                    const active = (res.data || []).find(b => b.state?.toUpperCase() === 'ACTIVE') || (res.data || [])[0];
                    if (active) {
                        setSelectedBatch(String(active.id));
                        setSelectedBatchObj(active);
                    }
                }
            } catch (err) {
                toast.error('Failed to load batches');
            } finally {
                setLoading(false);
            }
        };
        fetchBatches();
    }, []);

    // ---- Fetch grade summary whenever batch changes ----
    useEffect(() => {
        if (!selectedBatch) return;
        const fetchGrades = async () => {
            try {
                setFetching(true);
                const data = await supervisorService.getGradeSummary(selectedBatch);
                setGradeData(Array.isArray(data) ? data : []);
            } catch (err) {
                toast.error(err.message || 'Failed to load grade summary');
                setGradeData([]);
            } finally {
                setFetching(false);
            }
        };
        fetchGrades();

        const batchObj = batches.find(b => String(b.id) === String(selectedBatch));
        if (batchObj) setSelectedBatchObj(batchObj);
    }, [selectedBatch, batches]);

    // ---- Client-side filter ----
    const filtered = gradeData.filter(row =>
        row.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.student_sap_id?.toString().includes(searchTerm) ||
        row.project_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ---- Export to Excel ----
    const handleExport = () => {
        try {
            const ws = XLSX.utils.json_to_sheet(gradeData.map(row => ({
                'Student Name':        row.student_name,
                'SAP ID':              row.student_sap_id,
                'Group ID':            row.group_id,
                'Supervisor%':         row.supervisor_marks,
                'Committee Avg%':      row.committee_average,
                'Final%':              row.final_percentage,
                'Letter Grade':        row.letter_grade,
                'Pass/Fail':           Number(row.final_percentage) >= 50 ? 'Pass' : 'Fail'
            })));

            // Auto column widths
            ws['!cols'] = [25, 15, 12, 15, 15, 12, 12, 12].map(w => ({ wch: w }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'FYP Evaluation Report');
            XLSX.writeFile(wb, `FYP_Evaluation_Report_Batch_${selectedBatch}.xlsx`);
            toast.success('Excel exported successfully!');
        } catch (err) {
            toast.error('Export failed');
        }
    };

    // ---- Release Results ----
    const handleReleaseResults = async () => {
        if (!selectedBatch) return;
        
        const confirmed = window.confirm(
            'This will make grades visible to all students. Cannot be undone. Are you sure?'
        );
        
        if (!confirmed) return;
        
        try {
            setAnnouncing(true);
            const res = await api.post('/evaluation/grades/release', { batch_id: selectedBatch });
            if (res.success) {
                toast.success('Results released to all students!');
                if (selectedBatchObj) {
                    setSelectedBatchObj({ ...selectedBatchObj, results_released: true });
                }
            }
        } catch (err) {
            toast.error(err.message || 'Failed to release results.');
        } finally {
            setAnnouncing(false);
        }
    };

    // ---- Finalize Batch ----
    const handleFinalizeBatch = async () => {
        if (!selectedBatch) return;
        
        const confirmed = window.confirm(
            'This will transition all passing students/groups to FYP-II. Continue?'
        );
        
        if (!confirmed) return;
        
        try {
            setFinalizing(true);
            setFinalizeResult(null);
            const res = await api.post('/admin/finalize-batch', { batch_id: selectedBatch });
            if (res.success) {
                toast.success('Batch finalized successfully!');
                setFinalizeResult(res.data);
                // Refresh list
                setSelectedBatch(prev => prev);
            }
        } catch (err) {
            toast.error(err.message || 'Failed to finalize batch.');
        } finally {
            setFinalizing(false);
        }
    };

    if (loading) return <Loading fullScreen text="Loading batches..." />;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">

                {/* ── BANNER ── */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-[#193869] via-[#234e92] to-[#2c5fa8] rounded-3xl shadow-xl overflow-hidden mb-8"
                >
                    <div className="px-8 py-8 text-white relative">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Award className="w-40 h-40" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                            <div>
                                <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-1">Module 10</p>
                                <h1 className="text-3xl font-extrabold tracking-tight mb-1">Grade Summary</h1>
                                <p className="text-blue-100 text-sm max-w-lg">
                                    Final grade per student — Supervisor (50%) + Committee LO Score (50%). Calculation performed on the database.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                {/* Batch selector */}
                                <div className="relative">
                                    <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                    <select
                                        value={selectedBatch}
                                        onChange={e => setSelectedBatch(e.target.value)}
                                        className="pl-9 pr-8 py-2.5 bg-white text-gray-800 rounded-xl shadow text-sm font-bold outline-none appearance-none min-w-[220px]"
                                    >
                                        <option value="" disabled>Select Batch…</option>
                                        {batches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name} ({b.department}) — {b.state}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Export */}
                                <motion.button
                                    whileHover={gradeData.length > 0 && !fetching ? { scale: 1.02 } : {}}
                                    whileTap={gradeData.length > 0 && !fetching ? { scale: 0.98 } : {}}
                                    onClick={handleExport}
                                    disabled={gradeData.length === 0 || fetching}
                                    className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${
                                        gradeData.length === 0 || fetching
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-[#193869] hover:bg-gray-50'
                                    }`}
                                >
                                    <Download size={14} /> Export Excel
                                </motion.button>
                                
                                {/* Release Results (Coordinator Only) */}
                                {user?.role === 'Coordinator' && (
                                    <motion.button
                                        whileHover={!selectedBatchObj?.results_released && !announcing ? { scale: 1.02 } : {}}
                                        whileTap={!selectedBatchObj?.results_released && !announcing ? { scale: 0.98 } : {}}
                                        onClick={handleReleaseResults}
                                        disabled={!selectedBatch || announcing || selectedBatchObj?.results_released}
                                        className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${
                                            selectedBatchObj?.results_released 
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-not-allowed'
                                                : !selectedBatch || announcing
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-[#193869] text-white hover:bg-[#234e92]'
                                        }`}
                                    >
                                        {announcing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                        {selectedBatchObj?.results_released ? 'Results Released' : 'Release Results'}
                                    </motion.button>
                                )}

                                {/* Finalize Batch (FYP-I -> FYP-II Transition) */}
                                {user?.role === 'Administrator' && (
                                    <motion.button
                                        whileHover={!finalizing ? { scale: 1.02 } : {}}
                                        whileTap={!finalizing ? { scale: 0.98 } : {}}
                                        onClick={handleFinalizeBatch}
                                        disabled={!selectedBatch || finalizing || !selectedBatchObj?.results_released}
                                        className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${
                                            !selectedBatch || finalizing || !selectedBatchObj?.results_released
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        }`}
                                    >
                                        {finalizing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                        Finalize Batch (FYP-I → FYP-II)
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── TRANSITION SUMMARY ── */}
                <AnimatePresence>
                    {finalizeResult && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-6 shadow-sm overflow-hidden"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                        <CheckCircle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-emerald-900">Batch Finalized Successfully</h3>
                                        <p className="text-sm text-emerald-700">Transition results for the current batch:</p>
                                    </div>
                                </div>
                                <div className="flex gap-8">
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-emerald-600">{finalizeResult.passed}</p>
                                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Passed</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-blue-600">{finalizeResult.transitioned_groups}</p>
                                        <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Groups Advanced</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-red-500">{finalizeResult.failed}</p>
                                        <p className="text-[10px] font-black text-red-800 uppercase tracking-widest">Not Passed</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setFinalizeResult(null)}
                                    className="text-emerald-400 hover:text-emerald-600 transition-colors"
                                >
                                    <AlertCircle size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── FORMULA LEGEND ── */}
                <div className="bg-white border border-blue-100 rounded-2xl px-6 py-4 mb-6 flex flex-wrap gap-6 text-sm shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-[#193869]">Formula:</span>
                        <span className="text-gray-600">Final % = <strong>( Supervisor Marks ÷ 2 )</strong> + <strong>( Committee Average ÷ 2 )</strong></span>
                    </div>
                    <div className="h-4 w-px bg-gray-200"></div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="font-black text-[#193869] text-[10px] uppercase tracking-wider">Legend:</span>
                        {[
                            { label: 'A+', range: '≥90', color: 'bg-emerald-500' },
                            { label: 'A',  range: '≥85', color: 'bg-emerald-400' },
                            { label: 'A−', range: '≥80', color: 'bg-emerald-300' },
                            { label: 'B+', range: '≥75', color: 'bg-blue-500' },
                            { label: 'B',  range: '≥71', color: 'bg-blue-400' },
                            { label: 'B−', range: '≥68', color: 'bg-blue-300' },
                            { label: 'C+', range: '≥64', color: 'bg-amber-500' },
                            { label: 'C',  range: '≥61', color: 'bg-amber-400' },
                            { label: 'C−', range: '≥58', color: 'bg-amber-300' },
                            { label: 'D+', range: '≥54', color: 'bg-orange-500' },
                            { label: 'D',  range: '≥50', color: 'bg-orange-400' },
                            { label: 'F',  range: '<50', color: 'bg-red-500' },
                        ].map(l => (
                            <div key={l.label} className="flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${l.color}`}></span>
                                <span className="text-[10px] font-bold text-gray-500">{l.label} ({l.range})</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── TABLE CARD ── */}
                {!selectedBatch ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
                        Select a batch to view grade summary.
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
                    >
                        {/* Table toolbar */}
                        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
                                <Award size={18} className="text-[#193869]" />
                                Results — {gradeData.length} students
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search name, SAP ID or project…"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 w-64 transition"
                                    />
                                </div>
                                <button
                                    onClick={() => setSelectedBatch(prev => prev)} // retrigger effect
                                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition"
                                    title="Refresh"
                                >
                                    <RefreshCw size={15} className={fetching ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>

                        {fetching ? (
                            <div className="py-20 flex items-center justify-center">
                                <Loading text="Calculating grades…" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-20 text-center text-gray-400 font-medium">
                                {gradeData.length === 0 ? 'No submitted marks found for this batch.' : 'No students match your search.'}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            {[
                                                'Group', 'Student Name', 'SAP ID',
                                                'Supervisor %', 'Committee Avg %',
                                                'Final %', 'Grade', 'Status'
                                            ].map(h => (
                                                <th key={h} className="px-5 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filtered.map((row, i) => (
                                            <motion.tr
                                                key={`${row.group_id}-${row.student_sap_id}`}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="hover:bg-blue-50/30 transition-colors"
                                            >
                                                <td className="px-5 py-4">
                                                    <p className="font-bold text-gray-800 text-sm truncate max-w-[180px]">{row.project_title}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">#{row.group_id}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-[#193869] leading-tight">{row.student_name}</span>
                                                        <span className="text-[10px] font-mono text-gray-400">{row.student_sap_id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-center font-mono text-xs text-gray-400">{row.student_sap_id}</td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className="font-bold text-blue-600">{row.supervisor_marks ?? '—'}</span>
                                                    <span className="text-gray-300 text-xs"> %</span>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className="font-bold text-purple-600">{row.committee_average ?? '—'}</span>
                                                    <span className="text-gray-300 text-xs"> %</span>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <GradeBadge value={row.final_percentage} />
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className="text-sm font-black text-[#193869]">{row.letter_grade || '—'}</span>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <StatusPill status={row.committee_status} />
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default GradeSummary;
