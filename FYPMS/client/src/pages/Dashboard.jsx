import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Shield,
  BookOpen,
  GraduationCap,
  Lock,
  User as UserIcon,
  FolderOpen,
  Search,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  Layers,
  ClipboardList,
  Award,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/layout/Header';
import api from '../services/api';

const Dashboard = () => {
  const { user, isAdmin, hasRole } = useAuth();
  const navigate = useNavigate();
  const [batchInfo, setBatchInfo] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [myResult, setMyResult] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);

  useEffect(() => {
    // Redirect admin to admin dashboard
    if (isAdmin()) {
      navigate('/admin/dashboard');
    }
  }, [isAdmin, navigate]);

  // Fetch batch info for students
  useEffect(() => {
    if (user?.role === 'Student') {
      setBatchLoading(true);
      api.get('/curriculum/batches/my-batch')
        .then(res => { 
            if (res.success) {
                setBatchInfo(res.data);
                // Always fetch result to check release status
                setResultLoading(true);
                api.get('/evaluation/grades/my-result')
                    .then(r => { 
                        if (r.success) setMyResult(r.data); 
                    })
                    .finally(() => setResultLoading(false));
            } 
        })
        .catch(() => {})
        .finally(() => setBatchLoading(false));
    }
  }, [user?.role]);

  const isStudent = useMemo(() => user?.role === 'Student', [user?.role]);
  const isCommittee = useMemo(() => hasRole('Committee'), [hasRole]);
  const hasActiveBatch = useMemo(() => batchInfo && batchInfo.state === 'Active', [batchInfo]);
  const hasBatch = useMemo(() => !!batchInfo, [batchInfo]);

  const getRoleIcon = useCallback(() => {
    if (isCommittee && user?.role !== 'Committee') {
        return <Shield className="w-16 h-16 text-white" />;
    }
    switch (user?.role) {
      case 'Student':
        return <GraduationCap className="w-16 h-16 text-white" />;
      case 'Teacher':
        return <BookOpen className="w-16 h-16 text-white" />;
      case 'Committee':
        return <Shield className="w-16 h-16 text-white" />;
      default:
        return <Users className="w-16 h-16 text-white" />;
    }
  }, [isCommittee, user?.role]);

  const getRoleMessage = useCallback(() => {
    if (isCommittee && user?.role !== 'Committee') {
        return 'You have temporary Committee access for evaluation';
    }
    switch (user?.role) {
      case 'Student':
        return 'Explore archived projects and manage your profile';
      case 'Teacher':
        return 'Search projects and manage your information';
      case 'Committee':
        return 'Access project archive and manage your profile';
      default:
        return 'Welcome to your dashboard';
    }
  }, [isCommittee, user?.role]);

  const getRoleDescription = useCallback(() => {
    if (isCommittee && user?.role !== 'Committee') {
        return 'Access project evaluation and scoring rubrics';
    }
    switch (user?.role) {
      case 'Student':
        return 'Browse through completed Final Year Projects to get inspiration for your own work';
      case 'Teacher':
        return 'Search and review archived FYP projects for reference and guidance';
      case 'Committee':
        return 'Access the complete archive of Final Year Projects for review';
      default:
        return 'Access your personalized dashboard';
    }
  }, [isCommittee, user?.role]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 bg-gradient-to-br from-[#193869] to-[#234e92] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
          >
            {getRoleIcon()}
          </motion.div>

          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-xl text-gray-600">{getRoleMessage()}</p>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ACADEMIC STATUS BANNER — Students only                 */}
        {/* ═══════════════════════════════════════════════════════ */}
        {isStudent && !batchLoading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            {!hasBatch ? (
              /* ─── NOT ENROLLED ─── */
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-900 mb-1">Enrollment Pending</h3>
                    <p className="text-amber-700 text-sm">
                      You are not enrolled in any academic batch yet. Please contact your administrator for enrollment.
                    </p>
                    <p className="text-amber-600 text-xs mt-2 italic">
                      Once enrolled, you'll be able to submit proposals and track your FYP milestones.
                    </p>
                  </div>
                </div>
              </div>
            ) : batchInfo.state === 'Draft' ? (
              /* ─── BATCH IN DRAFT ─── */
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-blue-900 mb-1">Batch Activating Soon</h3>
                    <div className="flex flex-wrap gap-3 mt-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                        <BookOpen className="w-3.5 h-3.5" /> {batchInfo.name}
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold">
                        <GraduationCap className="w-3.5 h-3.5" /> {batchInfo.fyp_phase}
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" /> Draft — Waiting for Activation
                      </span>
                    </div>
                    <p className="text-blue-700 text-sm">
                      Your batch is not yet active. Please wait for the admin to activate it before you can submit proposals.
                    </p>
                  </div>
                </div>
              </div>
            ) : batchInfo.state === 'Active' ? (
              /* ─── BATCH ACTIVE ─── */
              <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl p-6 shadow-lg text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">Academic Status — Active</h3>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                        <BookOpen className="w-3.5 h-3.5" /> {batchInfo.name}
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                        <GraduationCap className="w-3.5 h-3.5" /> {batchInfo.fyp_phase}
                      </span>
                      {batchInfo.track_name && (
                        <span className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                          <Layers className="w-3.5 h-3.5" /> {batchInfo.track_name}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 bg-green-300/30 px-3 py-1 rounded-full text-xs font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ─── BATCH FROZEN / ARCHIVED ─── */
              <div className="bg-gradient-to-r from-gray-50 to-slate-100 border-2 border-gray-300 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Batch {batchInfo.state}</h3>
                    <p className="text-gray-600 text-sm">
                      Your batch <strong>{batchInfo.name}</strong> is currently <strong>{batchInfo.state}</strong>. Contact your administrator for more information.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* RESULTS ANNOUNCEMENT SECTION */}
            {hasBatch && (
               <div className="mt-4">
                 {myResult && myResult.status !== 'Results Pending' ? (
                   <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
                     <div className="flex items-start gap-4">
                       <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                         <Award className="w-6 h-6 text-blue-600" />
                       </div>
                       <div className="flex-1">
                         <div className="flex items-center justify-between mb-4">
                           <h3 className="text-lg font-bold text-blue-900">Final Academic Result</h3>
                           <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Released</span>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                           <div className="bg-white px-4 py-3 rounded-xl border border-blue-100 shadow-sm">
                               <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Final %</p>
                               <p className="text-2xl font-black text-[#193869]">{myResult.final_percentage}%</p>
                           </div>
                           <div className="bg-white px-4 py-3 rounded-xl border border-blue-100 shadow-sm">
                               <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Grade</p>
                               <p className="text-2xl font-black text-emerald-600">{myResult.letter_grade}</p>
                           </div>
                           <div className="bg-white px-4 py-3 rounded-xl border border-blue-100 shadow-sm">
                               <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Supervisor Portion</p>
                               <p className="text-lg font-black text-slate-700">{myResult.supervisor_marks} <span className="text-xs text-slate-400">/ 50</span></p>
                           </div>
                           <div className="bg-white px-4 py-3 rounded-xl border border-blue-100 shadow-sm">
                               <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Committee Portion</p>
                               <p className="text-lg font-black text-slate-700">{myResult.committee_average} <span className="text-xs text-slate-400">/ 50</span></p>
                           </div>
                         </div>

                         {/* Breakdown Bar */}
                         <div className="space-y-2">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <span>Supervisor (50%)</span>
                             <span>Committee (50%)</span>
                           </div>
                           <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden flex shadow-inner">
                             <div 
                               className="h-full bg-blue-500 transition-all duration-1000" 
                               style={{ width: `${(myResult.supervisor_marks / 100) * 100}%` }}
                             ></div>
                             <div 
                               className="h-full bg-purple-500 transition-all duration-1000" 
                               style={{ width: `${(myResult.committee_average / 100) * 100}%` }}
                             ></div>
                           </div>
                           <div className="flex justify-between text-[10px] font-bold text-slate-500">
                             <span>{myResult.supervisor_marks}% of contribution</span>
                             <span>{myResult.committee_average}% of contribution</span>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <Clock className="w-5 h-5 text-gray-400" />
                       <span className="text-gray-600 font-bold">Academic Result:</span>
                     </div>
                     <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                       Results Pending
                     </span>
                   </div>
                 )}
               </div>
            )}
            
          </motion.div>
        )}

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* PROJECT ARCHIVE - Available to ALL users */}
          <motion.button
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/project-archive')}
            className="bg-gradient-to-br from-[#193869] to-[#234e92] hover:from-[#234e92] hover:to-[#193869] rounded-xl shadow-lg p-8 text-left transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Project Archive</h3>
                <p className="text-blue-100 text-sm">Search & Explore</p>
              </div>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">
              Browse completed Final Year Projects by keywords, supervisor, year, department, and technology
            </p>
            <div className="mt-4 flex items-center text-white/80 text-sm">
              <Search className="w-4 h-4 mr-2" />
              <span>Advanced search available</span>
            </div>
          </motion.button>

          {/* SUBMIT PROPOSAL - Students only (Feature Gated) */}
          {user?.role === 'Student' && (
            hasActiveBatch ? (
              <motion.button
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/proposal-dashboard')}
                className="bg-white hover:bg-gray-50 rounded-xl shadow-md p-8 text-left transition-all duration-300 border-2 border-transparent hover:border-[#d29538]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#d29538] rounded-lg flex items-center justify-center">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Submit Proposal</h3>
                    <p className="text-gray-500 text-sm">FYP Proposal</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Create and submit your Final Year Project proposal for supervisor review
                </p>
              </motion.button>
            ) : (
              <div className="bg-gray-50 rounded-xl shadow-sm p-8 text-left border-2 border-dashed border-gray-300 opacity-70 cursor-not-allowed">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gray-300 rounded-lg flex items-center justify-center">
                    <Lock className="w-8 h-8 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-500">Submit Proposal</h3>
                    <p className="text-gray-400 text-sm">Requires Active Batch</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {!hasBatch
                    ? 'Enroll in a batch first to submit proposals. Contact your admin.'
                    : `Your batch "${batchInfo.name}" is in ${batchInfo.state} state. Wait for activation.`}
                </p>
              </div>
            )
          )}

          {/* REVIEW PROPOSALS - Teachers only */}
          {user?.role === 'Teacher' && (
            <motion.button
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/supervisor-proposals')}
              className="bg-white hover:bg-gray-50 rounded-xl shadow-md p-8 text-left transition-all duration-300 border-2 border-transparent hover:border-[#d29538]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-[#234e92] rounded-lg flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Review Proposals</h3>
                  <p className="text-gray-500 text-sm">Assigned to You</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Review and provide feedback on student proposals assigned to you
              </p>
            </motion.button>
          )}

          {/* MILESTONE REVIEW - Teachers only */}
          {user?.role === 'Teacher' && (
            <motion.button
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/supervisor/milestone-review')}
              className="bg-white hover:bg-gray-50 rounded-xl shadow-md p-8 text-left transition-all duration-300 border-2 border-transparent hover:border-[#193869]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-[#193869] rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Review Milestones</h3>
                  <p className="text-gray-500 text-sm">Group Submissions</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Review task submissions from your supervised groups and provide evaluations
              </p>
            </motion.button>
          )}

          {/* INDIVIDUAL MARKS ENTRY - Teachers only */}
          {user?.role === 'Teacher' && (
            <motion.button
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/supervisor/student-evaluations')}
              className="bg-white hover:bg-gray-50 rounded-xl shadow-md p-8 text-left transition-all duration-300 border-2 border-transparent hover:border-[#234e92]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-[#234e92] rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Student Evaluations</h3>
                  <p className="text-gray-500 text-sm">Individual Rubric</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Evaluate your supervised students individually via specific LOs.
              </p>
            </motion.button>
          )}

          {/* PROPOSAL DEFENSE EVALUATION - Teachers only */}
          {user?.role === 'Teacher' && (
            <motion.button
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/teacher/evaluations')}
              className="bg-white hover:bg-gray-50 rounded-xl shadow-md p-8 text-left transition-all duration-300 border-2 border-transparent hover:border-[#193869]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Defense Evaluations</h3>
                  <p className="text-gray-500 text-sm">Module 4 Feedback</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Evaluate student proposal defense and provide verdicts
              </p>
            </motion.button>
          )}

          {/* MILESTONES & CURRICULUM - Students only (Feature Gated) */}
          {user?.role === 'Student' && (
            hasActiveBatch ? (
              <motion.button
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/student-milestones')}
                className="bg-white hover:bg-gray-50 rounded-xl shadow-md p-8 text-left transition-all duration-300 border-2 border-transparent hover:border-[#193869]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">My Milestones</h3>
                    <p className="text-gray-500 text-sm">FYP Curriculum</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Track your weekly progress, download templates, and submit milestone tasks
                </p>
              </motion.button>
            ) : (
              <div className="bg-gray-50 rounded-xl shadow-sm p-8 text-left border-2 border-dashed border-gray-300 opacity-70 cursor-not-allowed">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gray-300 rounded-lg flex items-center justify-center">
                    <Lock className="w-8 h-8 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-500">My Milestones</h3>
                    <p className="text-gray-400 text-sm">Requires Active Batch</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {!hasBatch
                    ? 'Enroll in a batch to view your weekly milestones and tasks.'
                    : `Your batch "${batchInfo.name}" is in ${batchInfo.state} state. Milestones will unlock when active.`}
                </p>
              </div>
            )
          )}

          {/* PROPOSAL DEFENSE SUBMISSION - Students only (Feature Gated) */}
          {user?.role === 'Student' && (
            hasActiveBatch ? (
              <motion.button
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/student/defense-submission')}
                className="bg-white hover:bg-gray-50 rounded-xl shadow-md p-8 text-left transition-all duration-300 border-2 border-transparent hover:border-emerald-500"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Proposal Defense</h3>
                    <p className="text-gray-500 text-sm">Module 4 Submission</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Upload your defense PDF and proposal defense slides for faculty evaluation
                </p>
              </motion.button>
            ) : (
              <div className="bg-gray-50 rounded-xl shadow-sm p-8 text-left border-2 border-dashed border-gray-300 opacity-70 cursor-not-allowed">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gray-300 rounded-lg flex items-center justify-center">
                    <Lock className="w-8 h-8 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-500">Proposal Defense</h3>
                    <p className="text-gray-400 text-sm">Requires Active Batch</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Defense submission will be available once your batch is active and your proposal is scheduled.
                </p>
              </div>
            )
          )}

          {/* COMMITTEE-SPECIFIC CARDS */}
          {isCommittee && (
            <>
              {/* Evaluate Projects */}
              <motion.button
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/committee/evaluate')}
                className="bg-white hover:bg-gray-50 rounded-xl shadow-md p-8 text-left transition-all duration-300 border-2 border-transparent hover:border-[#193869]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#193869] rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Evaluate Projects</h3>
                    <p className="text-gray-500 text-sm">LO Rubric Scoring</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Evaluate assigned FYP groups using the official 8-LO rubric
                </p>
              </motion.button>
            </>
          )}

          {/* ADMIN-SPECIFIC CARDS (Previously shared with Committee) */}
          {user?.role === 'Administrator' && (
            <>
              {/* Proposal Management */}
              <motion.button
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/admin/proposals')}
                className="bg-white hover:bg-gray-50 rounded-xl shadow-md p-8 text-left transition-all duration-300 border-2 border-transparent hover:border-[#d29538]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#d29538] rounded-lg flex items-center justify-center">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Proposals</h3>
                    <p className="text-gray-500 text-sm">Review & Manage</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  View and manage all student FYP proposals across batches
                </p>
              </motion.button>

              {/* Curriculum Management */}
              <motion.button
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/admin/curriculum')}
                className="bg-white hover:bg-gray-50 rounded-xl shadow-md p-8 text-left transition-all duration-300 border-2 border-transparent hover:border-[#193869]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#193869] rounded-lg flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Curriculum</h3>
                    <p className="text-gray-500 text-sm">Tracks & Milestones</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Manage curriculum tracks, weekly tasks, and milestone deadlines
                </p>
              </motion.button>

              {/* Supervisor Workload */}
              <motion.button
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/admin/supervisor-workload')}
                className="bg-white hover:bg-gray-50 rounded-xl shadow-md p-8 text-left transition-all duration-300 border-2 border-transparent hover:border-purple-400"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Supervisor Workload</h3>
                    <p className="text-gray-500 text-sm">Capacity Overview</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Monitor supervisor capacity and group assignment distribution
                </p>
              </motion.button>

              {/* Grade Summary & Results (Visible to Admin and Committee) */}
            </>
          )}

          {(user?.role === 'Administrator' || isCommittee) && (
            <motion.button
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/admin/grade-summary')}
              className="bg-white hover:bg-gray-50 rounded-xl shadow-md p-8 text-left transition-all duration-300 border-2 border-transparent hover:border-indigo-400"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Grade Summary</h3>
                  <p className="text-gray-500 text-sm">Results & Statistics</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                View student grades, performance statistics, and released results
              </p>
            </motion.button>
          )}


          {/* VIEW PROFILE */}
          <motion.button
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/profile')}
            className="bg-white hover:bg-gray-50 rounded-xl shadow-md p-8 text-left transition-all duration-300 border-2 border-transparent hover:border-[#193869]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-[#d29538] rounded-lg flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">My Profile</h3>
                <p className="text-gray-500 text-sm">Account Details</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              View and update your personal information, profile picture, and account settings
            </p>
          </motion.button>

          {/* CHANGE PASSWORD */}
          <motion.button
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/change-password')}
            className="bg-white hover:bg-gray-50 rounded-xl shadow-md p-8 text-left transition-all duration-300 border-2 border-transparent hover:border-[#193869]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Security</h3>
                <p className="text-gray-500 text-sm">Change Password</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Update your account password to keep your account secure
            </p>
          </motion.button>
        </motion.div>

        {/* Role-Specific Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md p-8 border border-blue-100"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#193869] to-[#234e92] rounded-lg flex items-center justify-center flex-shrink-0">
              {user?.role === 'Student' && <GraduationCap className="w-6 h-6 text-white" />}
              {user?.role === 'Teacher' && <BookOpen className="w-6 h-6 text-white" />}
              {user?.role === 'Committee' && <Shield className="w-6 h-6 text-white" />}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {user?.role} Dashboard
              </h2>
              <p className="text-gray-700 mb-4">
                {getRoleDescription()}
              </p>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-800 mb-3">What you can do:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#193869] rounded-full"></div>
                    <span>Search archived projects by keywords, supervisor, year, and more</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#193869] rounded-full"></div>
                    <span>View complete project details including abstract and technology</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#193869] rounded-full"></div>
                    <span>Use advanced filters with AND/OR operators</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#193869] rounded-full"></div>
                    <span>Manage your profile and account settings</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Getting Started Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 bg-gradient-to-br from-[#193869] to-[#234e92] rounded-xl shadow-xl p-8 text-white"
        >
          <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-100">
                📚 Explore Project Archive
              </h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Click on "Project Archive" to search through hundreds of completed FYP projects.
                Use keywords, filters, and advanced search to find exactly what you're looking for.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-100">
                👤 Manage Your Profile
              </h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Keep your profile information up to date. Upload a profile picture,
                update your contact details, and manage your account security settings.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;