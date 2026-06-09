import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, Upload, Lock, Shield, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import { API_BASE_URL } from '../utils/constants';
import api from '../services/api';
import Loading from '../components/common/Loading';
import Header from '../components/layout/Header';

const StudentMilestones = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batchError, setBatchError] = useState(null);
  const [batchInfo, setBatchInfo] = useState(null);
  const toast = useToast();

  const fetchTasks = async () => {
    try {
      const res = await api.get('/curriculum/tracks/my-tasks');
      if (res.success) {
         const parsedTasks = res.data.map(t => ({
            ...t,
            deadline: new Date(t.deadline_datetime || t.computed_deadline),
            status: t.submission_status
         }));
         setTasks(parsedTasks);
      } else {
        setBatchError(res.message || 'Could not load milestones');
      }
    } catch (err) {
      setBatchError(err.message || 'You are not enrolled in an active batch or no track has been assigned yet.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchInfo = async () => {
    try {
      const res = await api.get('/curriculum/batches/my-batch');
      if (res.success && res.data) setBatchInfo(res.data);
    } catch { /* non-critical */ }
  };

  useEffect(() => {
    fetchTasks();
    fetchBatchInfo();
  }, []);

  const handleSubmission = async (taskId, e = null) => {
    let file = null;
    if (e && e.target.files) {
       file = e.target.files[0];
       if (!file) return;
    }

    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      
      const res = await api.post(`/curriculum/tasks/${taskId}/submit`, formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
         toast.success("Successfully submitted!");
         fetchTasks();
      }
    } catch(err) {
       toast.error(err.message || 'Error submitting task');
    }
  };

   const getStatusConfig = (status) => {
     switch(status) {
       case 'Evaluated':
       case 'Completed': 
       case 'Pending': return { bg: 'bg-green-500', border: 'border-green-200', text: 'text-green-700', icon: <CheckCircle className="w-5 h-5"/> };
       case 'Not_Submitted': return { bg: 'bg-blue-500', border: 'border-blue-300 ring-4 ring-blue-50', text: 'text-blue-700', icon: <ArrowRight className="w-5 h-5"/> };
       case 'Locked_NoProposal': 
       case 'Locked_PastDeadline': 
       case 'Locked': return { bg: 'bg-gray-300', border: 'border-gray-200', text: 'text-gray-500', icon: <Lock className="w-5 h-5"/> };
       default: return { bg: 'bg-gray-300', border: 'border-gray-200', text: 'text-gray-500', icon: <Lock className="w-5 h-5"/> };
     }
   };

   const getDeadlineColor = (deadlineDate, status) => {
     if (status === 'Completed' || status === 'Evaluated' || status === 'Pending') return 'text-green-700 bg-green-50 border border-green-200';
     if (status.includes('Locked')) return 'text-gray-600 bg-gray-100 border border-gray-200';

     const diffTime = deadlineDate.getTime() - new Date().getTime();
     const diffHrs = Math.ceil(diffTime / (1000 * 60 * 60));

     if (diffHrs < 0) return 'text-red-800 bg-red-100 border border-red-300';
     if (diffHrs <= 24) return 'text-red-600 bg-red-50 border border-red-200';
     if (diffHrs <= 48) return 'text-orange-600 bg-orange-50 border border-orange-200';
     return 'text-blue-700 bg-blue-50 border border-blue-200';
   };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Banner Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-gradient-to-br from-[#193869] to-[#234e92] rounded-3xl shadow-xl overflow-hidden mb-10"
        >
          <div className="px-8 py-10 text-white relative flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="absolute top-0 left-0 p-8 opacity-10">
              <Calendar className="w-48 h-48" />
            </div>
            <div className="relative z-10 w-full">
              <div className="flex justify-between items-start w-full">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight mb-2">My Milestones</h1>
                  <p className="text-blue-100 max-w-xl text-lg">Track your progress journey and submit weekly assignments.</p>
                  {batchInfo?.name && (
                    <p className="text-blue-200 text-sm mt-2 font-medium">📚 {batchInfo.name} {batchInfo.track_name ? `— ${batchInfo.track_name}` : ''}</p>
                  )}
                </div>
                <div className="hidden sm:block text-right bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
                   <p className="text-xs text-blue-200 font-bold uppercase tracking-widest mb-1">Active Phase</p>
                   <h2 className="text-2xl font-black text-white">{batchInfo?.fyp_phase || user?.fyp_phase || 'FYP-I'}</h2>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Empty / Error State */}
        {batchError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-md p-10 text-center border border-amber-100"
          >
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Milestones Available</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">{batchError}</p>
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 max-w-md mx-auto">
              <strong>To see your milestones:</strong>
              <ul className="mt-2 space-y-1 text-left list-disc list-inside">
                <li>You must be enrolled in an Active batch</li>
                <li>Your batch must have a curriculum track assigned</li>
                <li>Contact your administrator if needed</li>
              </ul>
            </div>
          </motion.div>
        )}

        <div className="relative ml-4 md:ml-0">
          {/* Vertical Line Line */}
          <div className="absolute left-8 md:left-24 top-8 bottom-8 w-1 bg-gradient-to-b from-[#193869] via-blue-200 to-gray-200 rounded-full z-0"></div>

          <div className="space-y-10 relative z-10">
            {tasks.map((task, i) => {
              const statusCfg = getStatusConfig(task.status);
              const isPending = task.status === 'Not_Submitted';
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 relative group"
                >
                  {/* Timeline Node */}
                  <div className="absolute left-0 md:relative md:w-48 flex justify-end">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl shadow-lg border-4 border-white ${statusCfg.bg} text-white transition-transform group-hover:scale-110`}>
                       W{task.week_number}
                    </div>
                  </div>

                  {/* Task Card */}
                  <div className={`bg-white rounded-3xl border ${statusCfg.border} p-6 flex-1 shadow-sm group-hover:shadow-xl transition-all ml-20 md:ml-0 overflow-hidden relative`}>
                    {/* Status side bar */}
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${statusCfg.bg}`}></div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pl-4">
                       <div>
                           <h3 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h3>
                           <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-wider mb-2">
                             <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg">{task.task_type}</span>
                             {task.is_mandatory ? 
                               <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg flex items-center gap-1"><Shield className="w-3 h-3"/> Mandatory</span> :
                               <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg">Optional</span>
                             }
                           </div>
                           <p className={`text-sm font-bold flex items-center gap-2 px-3 py-1.5 rounded-lg inline-flex mt-2 ${getDeadlineColor(task.deadline, task.status)}`}>
                             <Clock className="w-4 h-4" /> Due: {task.deadline.toLocaleString()}
                           </p>
                           {task.description && (
                             <div className="mt-3 text-sm text-gray-700 bg-gray-50 border border-gray-100 p-3 rounded-lg">
                               <span className="font-bold block mb-1">Instructions:</span>
                               {task.description}
                             </div>
                           )}
                           {!!task.has_template && task.template_url && (
                             <a 
                               href={`${API_BASE_URL.replace('/api', '')}/uploads/${task.template_url}`} 
                               target="_blank" 
                               rel="noreferrer"
                               className="text-sm font-bold text-[#193869] hover:text-blue-800 underline mt-3 block"
                             >
                               ↓ Download Attached Template
                             </a>
                           )}
                        </div>

                        <div className="md:text-right flex flex-col md:items-end justify-center">
                           {(task.status === 'Completed' || task.status === 'Evaluated' || task.status === 'Pending') && (
                             <div className="flex flex-col items-end gap-2">
                               <span className="inline-flex items-center gap-2 text-green-700 font-extrabold bg-green-50 px-4 py-2 rounded-xl text-sm border border-green-200 shadow-sm">
                                 {statusCfg.icon} {task.task_type === 'Instruction-Only' ? 'ACKNOWLEDGED' : 'SUBMITTED'}
                               </span>
                               {task.status === 'Pending' && task.task_type !== 'Instruction-Only' && (
                                 <label className="cursor-pointer text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 font-bold shadow-sm">
                                    <Upload className="w-3.5 h-3.5"/> Replace Work
                                    <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" className="hidden" onChange={(e) => handleSubmission(task.id, e)} />
                                 </label>
                               )}
                             </div>
                           )}

                           {task.status.includes('Locked') && (
                             <div className="flex flex-col items-start md:items-end w-full">
                               <span className="inline-flex items-center gap-2 text-gray-500 font-extrabold bg-gray-50 px-4 py-2 rounded-xl text-sm border border-gray-200">
                                 {statusCfg.icon} LOCKED
                               </span>
                               {task.status === 'Locked_NoProposal' && (
                                  <p className="text-xs font-semibold text-rose-600 mt-2 text-right">You must have an approved proposal to submit this task.</p>
                               )}
                               {task.status === 'Locked_PastDeadline' && (
                                  <p className="text-xs font-semibold text-rose-600 mt-2 text-right">The deadline has passed.</p>
                               )}
                             </div>
                           )}

                           {isPending && (
                             <div className="flex flex-col items-start md:items-end w-full">
                               {task.task_type === 'Instruction-Only' ? (
                                  <button onClick={() => handleSubmission(task.id)} className="bg-gradient-to-r from-[#193869] to-[#234e92] text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-bold w-full md:w-auto justify-center">
                                     <CheckCircle className="w-5 h-5"/> Acknowledge
                                  </button>
                               ) : (
                                  <label className="cursor-pointer bg-gradient-to-r from-[#193869] to-[#234e92] text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-bold w-full md:w-auto justify-center">
                                     <Upload className="w-5 h-5"/> Submit Work
                                     <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" className="hidden" onChange={(e) => handleSubmission(task.id, e)} />
                                  </label>
                               )}
                               {((task.deadline.getTime() - new Date().getTime()) / 3600000) <= 48 && (
                                 <p className="text-xs font-bold text-orange-600 mt-3 flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                                   <AlertTriangle className="w-4 h-4"/> APPROACHING DEADLINE
                                 </p>
                               )}
                             </div>
                           )}
                        </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentMilestones;
