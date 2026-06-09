import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    ChevronRight, 
    CheckCircle, 
    Clock, 
    AlertCircle, 
    Send, 
    Loader2, 
    Search,
    User,
    Award
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import committeeService from '../../services/committeeService';
import Header from '../../components/layout/Header';

// ==============================================================
// CONFIGURATION: LO WEIGHTS & DESCRIPTORS
// ==============================================================
const LO_WEIGHTS = {
    'FYP-I': {
        lo1: { max: 10, label: 'SE fundamentals knowledge', desc: 'LO1: "Poor understanding" / "Satisfactory understanding" / "Good understanding" / "Excellent" / "Outstanding"' },
        lo2: { max: 20, label: 'Problem analysis & requirements', desc: 'LO2: "Requirements not clear" / "Partially clear" / "Well defined" / "Detailed" / "Professional level"' },
        lo3: { max: 20, label: 'Design & implementation', desc: 'LO3: "Poor design" / "Satisfactory design" / "Solid design" / "Advanced design" / "Superior design"' },
        lo4: { max: 10, label: 'Evaluate SE solution', desc: 'LO4: "Incomplete evaluation" / "Basic evaluation" / "Good evaluation" / "Thorough" / "Rigorous"' },
        lo5: { max: 10, label: 'Modern tools & techniques', desc: 'LO5: "Basic tool usage" / "Intermediate" / "Proficient" / "Expert" / "Mastery"' },
        lo6: { max: 10, label: 'Team effectiveness', desc: 'LO6: "Individualistic" / "Limited collab" / "Good teamwork" / "Strong collab" / "Exceptional synergy"' },
        lo7: { max: 10, label: 'Communication & presentation', desc: 'LO7: "Weak delivery" / "Clear delivery" / "Good delivery" / "Strong delivery" / "Exceptional delivery"' },
        lo8: { max: 10, label: 'Project management', desc: 'LO8: "Unorganized" / "Partially managed" / "Well managed" / "Highly organized" / "Exemplary management"' },
    },
    'FYP-II': {
        lo1: { max: 10, label: 'SE fundamentals knowledge', desc: 'LO1: "Poor understanding" / "Satisfactory understanding" / "Good understanding" / "Excellent" / "Outstanding"' },
        lo2: { max: 10, label: 'Problem analysis & requirements', desc: 'LO2: "Requirements not clear" / "Partially clear" / "Well defined" / "Detailed" / "Professional level"' },
        lo3: { max: 10, label: 'Design & implementation', desc: 'LO3: "Poor design" / "Satisfactory design" / "Solid design" / "Advanced design" / "Superior design"' },
        lo4: { max: 20, label: 'Evaluate SE solution', desc: 'LO4: "Incomplete evaluation" / "Basic evaluation" / "Good evaluation" / "Thorough" / "Rigorous"' },
        lo5: { max: 15, label: 'Modern tools & techniques', desc: 'LO5: "Basic tool usage" / "Intermediate" / "Proficient" / "Expert" / "Mastery"' },
        lo6: { max: 15, label: 'Team effectiveness', desc: 'LO6: "Individualistic" / "Limited collab" / "Good teamwork" / "Strong collab" / "Exceptional synergy"' },
        lo7: { max: 10, label: 'Communication & presentation', desc: 'LO7: "Weak delivery" / "Clear delivery" / "Good delivery" / "Strong delivery" / "Exceptional delivery"' },
        lo8: { max: 10, label: 'Project management', desc: 'LO8: "Unorganized" / "Partially managed" / "Well managed" / "Highly organized" / "Exemplary management"' },
    }
};

const EMPTY_MARKS = {
    lo1_marks: '', lo2_marks: '', lo3_marks: '', lo4_marks: '',
    lo5_marks: '', lo6_marks: '', lo7_marks: '', lo8_marks: ''
};

const getGradeLabel = (marks, max) => {
    if (marks === '' || marks === null) return { text: '-', color: 'text-gray-400' };
    const pct = (Number(marks) / max) * 100;
    if (pct >= 100) return { text: 'Outstanding', color: 'text-emerald-600' };
    if (pct >= 80) return { text: 'Excellent', color: 'text-amber-500' };
    if (pct >= 70) return { text: 'Good', color: 'text-blue-600' };
    if (pct >= 50) return { text: 'Average', color: 'text-gray-500' };
    return { text: 'Below Average', color: 'text-red-600' };
};

const CommitteeEvaluation = () => {
    const toast = useToast();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [rubricData, setRubricData] = useState(EMPTY_MARKS);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAssignedGroups();
    }, []);

    const fetchAssignedGroups = async () => {
        try {
            setLoading(true);
            const res = await committeeService.getMyAssignedGroups();
            if (res.success) {
                setGroups(res.data || []);
            }
        } catch (err) {
            toast.error('Failed to load assigned groups');
        } finally {
            setLoading(false);
        }
    };

    const handleStudentSelect = (group, student) => {
        setSelectedGroup(group);
        setSelectedStudent(student);
        
        if (student.already_evaluated && student.marks) {
            setRubricData(student.marks);
        } else {
            setRubricData(EMPTY_MARKS);
        }
    };

    const handleMarkChange = (key, val, max) => {
        let numericVal = val === '' ? '' : parseInt(val);
        if (numericVal !== '' && numericVal > max) numericVal = max;
        if (numericVal !== '' && numericVal < 0) numericVal = 0;
        
        setRubricData(prev => ({
            ...prev,
            [`${key}_marks`]: numericVal
        }));
    };

    const totalMarks = Object.values(rubricData).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const isValidTotal = totalMarks === 100;

    const handleSubmit = async () => {
        if (!isValidTotal) {
            toast.error('Total must be exactly 100 before submission');
            return;
        }

        const confirmed = window.confirm('Are you sure you want to submit these marks? This action is immutable.');
        if (!confirmed) return;

        try {
            setSubmitting(true);
            const payload = {
                session_id: selectedGroup.session_id,
                student_sap_id: selectedStudent.sap_id,
                ...rubricData
            };
            const res = await committeeService.submitMarks(payload);
            if (res.success) {
                toast.success('Marks submitted successfully');
                // Refresh data to update status badges
                fetchAssignedGroups();
                // Clear selection
                setSelectedStudent(null);
                setSelectedGroup(null);
            }
        } catch (err) {
            if (err.status === 403) {
                alert('Evaluation session has ended');
            } else if (err.status === 409) {
                toast.error('Already evaluated');
            } else {
                toast.error(err.message || 'Failed to submit marks');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const filteredGroups = groups.filter(g => 
        (g.project_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.students || []).some(s => 
            (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (s.sap_id || '').toString().includes(searchTerm)
        )
    );

    const currentWeights = selectedGroup ? LO_WEIGHTS[selectedGroup.session_type === 'FINAL_DEMO' ? 'FYP-II' : 'FYP-I'] : null;

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#193869]" />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col md:flex-row gap-8 overflow-hidden">
                
                {/* SECTION 1: STUDENT SELECTOR */}
                <div className="w-full md:w-80 flex flex-col gap-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#193869]" />
                            Assigned Groups
                        </h2>
                        <div className="relative mb-4">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search groups or students..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition"
                            />
                        </div>
                        
                        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar">
                            {filteredGroups.length === 0 ? (
                                <p className="text-center text-gray-400 py-10 text-sm">No groups assigned</p>
                            ) : (
                                <div className="space-y-4">
                                    {filteredGroups.map(group => (
                                        <div key={group.group_id} className="space-y-1">
                                            <div className="px-2 py-1 bg-gray-50 rounded-lg text-[10px] font-black uppercase tracking-wider text-gray-500">
                                                {group.project_title}
                                            </div>
                                            {group.students.map(student => (
                                                <button
                                                    key={student.sap_id}
                                                    onClick={() => handleStudentSelect(group, student)}
                                                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                                                        selectedStudent?.sap_id === student.sap_id
                                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                                            : 'bg-white border-transparent hover:border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className={`text-sm font-bold ${selectedStudent?.sap_id === student.sap_id ? 'text-[#193869]' : 'text-gray-700'}`}>
                                                            {student.name}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-mono">{student.sap_id}</span>
                                                    </div>
                                                    {student.already_evaluated ? (
                                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                                            <CheckCircle size={10} /> Evaluated
                                                        </span>
                                                    ) : (
                                                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                                            <Clock size={10} /> Pending
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SECTION 2: RUBRIC FORM */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {!selectedStudent ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-dashed border-gray-200"
                            >
                                <Award className="w-16 h-16 text-gray-200 mb-4" />
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Student</h3>
                                <p className="text-gray-500 max-w-xs">Choose a student from the left panel to begin evaluation.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={selectedStudent.sap_id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col min-h-full"
                            >
                                {/* Header */}
                                <div className="p-8 border-b border-gray-50 bg-gradient-to-br from-white to-gray-50/50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-[#193869] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                                                <User size={32} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">Evaluating Student</p>
                                                <h1 className="text-2xl font-black text-gray-800 leading-none mb-1">{selectedStudent.name}</h1>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                                    <span className="font-mono text-xs">{selectedStudent.sap_id}</span>
                                                    <span>•</span>
                                                    <span>{selectedGroup.project_title}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">FYP Phase</p>
                                            <p className="text-sm font-black text-[#193869]">{selectedGroup.session_type === 'FINAL_DEMO' ? 'FYP-II' : 'FYP-I'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Content */}
                                <div className="p-8 space-y-8">
                                    {selectedStudent.already_evaluated ? (
                                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-center gap-4 text-blue-700">
                                            <AlertCircle size={24} />
                                            <p className="text-sm font-bold">This student has already been evaluated. Marks are read-only and immutable.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-6">
                                            {Object.entries(currentWeights).map(([key, info]) => {
                                                const grade = getGradeLabel(rubricData[`${key}_marks`], info.max);
                                                return (
                                                    <div key={key} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow group">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{key.toUpperCase()}</span>
                                                                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">Max {info.max}</span>
                                                                </div>
                                                                <h4 className="text-base font-bold text-gray-800">{info.label}</h4>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-right hidden sm:block">
                                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${grade.color}`}>{grade.text}</p>
                                                                </div>
                                                                <div className="relative">
                                                                    <input 
                                                                        type="number"
                                                                        min="0"
                                                                        max={info.max}
                                                                        step="1"
                                                                        value={rubricData[`${key}_marks`]}
                                                                        onChange={e => handleMarkChange(key, e.target.value, info.max)}
                                                                        disabled={submitting || selectedStudent.already_evaluated}
                                                                        className={`w-24 px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-lg font-black text-center text-[#193869] focus:bg-white focus:border-[#193869] outline-none transition-all ${selectedStudent.already_evaluated ? 'cursor-not-allowed opacity-75' : ''}`}
                                                                    />
                                                                    <span className="absolute -right-2 -top-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                                                                        / {info.max}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 italic leading-relaxed">
                                                            {info.desc}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Bar */}
                                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] rounded-b-3xl mt-auto">
                                    <div className="flex items-center justify-between gap-6 max-w-4xl mx-auto">
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Progress</span>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-3xl font-black ${isValidTotal ? 'text-emerald-600' : totalMarks > 100 ? 'text-red-600' : 'text-gray-800'}`}>
                                                        {totalMarks}
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-300">/ 100</span>
                                                </div>
                                            </div>
                                            <div className="hidden sm:block h-10 w-px bg-gray-100"></div>
                                            <div className="hidden sm:flex flex-col">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                                                <span className={`text-sm font-bold ${isValidTotal ? 'text-emerald-600' : 'text-amber-500'}`}>
                                                    {isValidTotal ? 'Ready to Submit' : totalMarks > 100 ? 'Total Exceeded' : `${100 - totalMarks} marks remaining`}
                                                </span>
                                            </div>
                                        </div>

                                        {!selectedStudent.already_evaluated && (
                                            <button
                                                onClick={handleSubmit}
                                                disabled={!isValidTotal || submitting}
                                                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl ${
                                                    isValidTotal && !submitting
                                                        ? 'bg-[#193869] text-white hover:bg-[#234e92] shadow-blue-200 hover:-translate-y-1'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                                }`}
                                            >
                                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                                Submit Evaluation
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default CommitteeEvaluation;
