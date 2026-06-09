import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, FileText, ChevronDown, ChevronUp, Save, Search, Filter, BookOpen, ClipboardList } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import { API_BASE_URL } from '../utils/constants';
import api from '../services/api';
import Loading from '../components/common/Loading';
import Header from '../components/layout/Header';
const getFileTypeLabel = (mime) => {
  if (!mime) return 'Document';
  const mimeMap = {
    'application/pdf': 'PDF Document',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
  };
  return mimeMap[mime] || 'Document';
};

const formatFileSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const GroupTaskCard = ({ task, onEvaluate }) => {
  const [marks, setMarks] = useState(task.marks === null ? '' : task.marks);
  const [feedback, setFeedback] = useState(task.evaluator_feedback || '');
  const [isEvaluating, setIsEvaluating] = useState(false);

  // If there's no submission, card should indicate that
  const isPendingSubmission = !task.submission_id;

  const handleSave = async () => {
    if (marks === '' || isNaN(marks) || marks < 0 || marks > 10) return;
    setIsEvaluating(true);
    await onEvaluate(task.submission_id, Number(marks), feedback);
    setIsEvaluating(false);
  };

  const statusColor = isPendingSubmission 
    ? 'text-gray-500 bg-gray-50' 
    : task.marks !== null 
      ? 'text-green-700 bg-green-50' 
      : 'text-amber-700 bg-amber-50';

  return (
    <div className={`p-4 border rounded-xl mb-4 transition-all ${isPendingSubmission ? 'border-gray-200 bg-gray-50/50' : 'border-blue-100 bg-white hover:shadow-md'}`}>
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        {/* Left Side: Task Info & Metadata */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-bold ${task.is_mandatory ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              Week {task.week_number}
            </span>
            <h4 className="font-bold text-gray-800 text-lg">{task.task_title}</h4>
            <span className="text-xs font-semibold px-2 py-1 bg-gray-200 text-gray-700 rounded-lg">{task.task_type}</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Status</p>
              <p className={`font-medium mt-1 inline-block px-2 py-0.5 rounded ${statusColor}`}>
                {isPendingSubmission ? 'Not Submitted' : task.submission_status}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Submitted On</p>
              <p className="font-medium text-gray-800 mt-1">
                {task.submitted_at ? new Date(task.submitted_at).toLocaleDateString() + ' ' + new Date(task.submitted_at).toLocaleTimeString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">File Type</p>
              <p className="font-medium text-gray-800 mt-1">{getFileTypeLabel(task.file_mime)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">File Size</p>
              <p className="font-medium text-gray-800 mt-1">{formatFileSize(task.file_size)}</p>
            </div>
          </div>

          {!isPendingSubmission && task.file_url && (
            <div className="mt-4">
              <a 
                href={`${API_BASE_URL.replace('/api', '')}/uploads/${task.file_url}`}
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors border border-blue-200"
              >
                <FileText className="w-4 h-4" /> View Submitted File
              </a>
              <span className="text-xs text-gray-500 ml-3">Uploaded by {task.submitted_by_name}</span>
            </div>
          )}
        </div>

        {/* Right Side: Evaluation Form */}
        <div className={`lg:w-80 p-4 rounded-xl border ${isPendingSubmission ? 'bg-gray-100 border-gray-200 opacity-60' : task.marks !== null ? 'bg-green-50/50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex justify-between items-center mb-3">
             <h5 className="font-bold text-sm text-gray-700 uppercase tracking-wider">Evaluation</h5>
             {task.marks !== null && (
               <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                 <CheckCircle className="w-3 h-3" /> Evaluated
               </span>
             )}
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Marks (0-10)</label>
              <input 
                type="number" 
                min="0" max="10"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                disabled={isPendingSubmission || isEvaluating}
                className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="e.g. 8"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Feedback</label>
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isPendingSubmission || isEvaluating}
                className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 h-20 resize-none disabled:bg-gray-100"
                placeholder="Leave feedback for the students..."
              />
            </div>
            <button
               onClick={handleSave}
               disabled={isPendingSubmission || isEvaluating || marks === '' || marks < 0 || marks > 10}
               className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Save className="w-4 h-4" /> {isEvaluating ? 'Saving...' : 'Save Evaluation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const GroupReviewCard = ({ group, onEvaluate, onOpenMarksModal }) => {
  const [expanded, setExpanded] = useState(false);
  
  const completedTasks = group.tasks.filter(t => t.submission_id).length;
  const totalTasks = group.tasks.length;
  const evaluatedTasks = group.tasks.filter(t => t.marks !== null).length;
  
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 hover:shadow-md transition-shadow">
      <div 
        className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent"
      >
        {/* Clickable left section to expand/collapse */}
        <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-3 mb-1">
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-md">{group.batch_name}</span>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md">{group.lead_student_sap}</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{group.project_title}</h3>
          <p className="text-sm text-gray-500 font-medium">Lead: {group.lead_student_name}</p>
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0">
           {/* Progress stats */}
           <div className="text-right cursor-pointer" onClick={() => setExpanded(!expanded)}>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Progress</p>
              <div className="flex items-center gap-3">
                 <div className="w-32 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progressPct}%`}}></div>
                 </div>
                 <span className="text-sm font-bold text-gray-700">{completedTasks}/{totalTasks} Submissions</span>
                 <span className="text-sm font-bold text-green-600 pl-2 border-l border-gray-200">{evaluatedTasks} Evaluated</span>
              </div>
           </div>

           {/* Expand/Collapse chevron */}
           <button
             onClick={() => setExpanded(!expanded)}
             className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 hover:bg-gray-100 transition-colors flex-shrink-0"
           >
             {expanded ? <ChevronUp className="text-gray-500 w-5 h-5"/> : <ChevronDown className="text-gray-500 w-5 h-5"/>}
           </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 bg-gray-50/30 p-6"
          >
            {group.tasks.length === 0 ? (
              <p className="text-center text-gray-500 py-4 font-medium">No tasks found for this group's track.</p>
            ) : (
              group.tasks.map(task => (
                <GroupTaskCard key={task.task_id} task={task} onEvaluate={onEvaluate} />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SupervisorMilestoneReview = () => {
  const [groups, setGroups]                     = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [searchTerm, setSearchTerm]             = useState('');

  const toast = useToast();

  const fetchGroups = async () => {
    try {
      const res = await api.get('/curriculum/tracks/group-submissions-review');
      if (res.success) {
        setGroups(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load group submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleEvaluate = async (submissionId, marks, feedback) => {
    try {
      const res = await api.post('/curriculum/tasks/evaluate', {
        submission_id: submissionId,
        marks,
        feedback
      });
      
      if (res.success) {
        toast.success('Evaluation saved successfully');
        // Optimistic UI update
        setGroups(prevGroups => prevGroups.map(group => ({
          ...group,
          tasks: group.tasks.map(t => 
            t.submission_id === submissionId 
              ? { ...t, marks, evaluator_feedback: feedback, submission_status: 'Evaluated' }
              : t
          )
        })));
      }
    } catch (err) {
      toast.error(err.message || 'Error saving evaluation');
      throw err;
    }
  };

  const filteredGroups = groups.filter(g => 
    g.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.lead_student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.batch_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Banner Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-gradient-to-br from-[#193869] to-[#234e92] rounded-3xl shadow-xl overflow-hidden mb-8"
        >
          <div className="px-8 py-10 text-white relative flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
               <BookOpen className="w-64 h-64 transform translate-x-10 -translate-y-10" />
            </div>
            <div className="relative z-10 w-full">
              <div className="flex justify-between items-start w-full">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight mb-2">Milestone Review Panel</h1>
                  <p className="text-blue-100 max-w-xl text-lg">Review task submissions from your supervised groups and provide evaluations.</p>
                </div>
                <div className="hidden sm:block text-right bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
                   <p className="text-xs text-blue-200 font-bold uppercase tracking-widest mb-1">Total Groups</p>
                   <h2 className="text-3xl font-black text-white">{groups.length}</h2>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
           <div className="relative flex-1 max-w-md">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-5 w-5 text-gray-400" />
             </div>
             <input
               type="text"
               placeholder="Search by project, student, or batch..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10 w-full rounded-xl border-gray-300 shadow-sm focus:border-[#193869] focus:ring focus:ring-blue-200 focus:ring-opacity-50"
             />
           </div>
        </div>

        {/* Groups List */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
               <AlertTriangle className="w-8 h-8 text-gray-400" />
             </div>
             <h3 className="text-xl font-bold text-gray-700 mb-2">No Groups Found</h3>
             <p className="text-gray-500 max-w-md mx-auto">
               {searchTerm ? 'No groups matched your search criteria.' : 'You do not have any active groups assigned for supervision.'}
             </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGroups.map(group => (
               <GroupReviewCard
                  key={group.proposal_id}
                  group={group}
                  onEvaluate={handleEvaluate}
               />
            ))}
          </div>
        )}
      </main>

    </div>
  );
};

export default SupervisorMilestoneReview;
