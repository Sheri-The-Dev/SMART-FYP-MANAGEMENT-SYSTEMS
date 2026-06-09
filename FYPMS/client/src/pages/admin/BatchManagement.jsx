import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, BookOpen, Clock, AlertCircle, X, Shield, Activity, Pencil, Trash2, Search } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import api from '../../services/api';
import Loading from '../../components/common/Loading';
import Header from '../../components/layout/Header';

const EMPTY_FORM = {
  name: '',
  department: '',
  academic_year: '2025-2026',
  fyp_phase: 'FYP-I',
  start_date: ''
};

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Pre-Activation State
  const [activationChecklist, setActivationChecklist] = useState(null);
  const [attemptingBatch, setAttemptingBatch] = useState(null);

  // Transition State
  const [transitionBatchFocus, setTransitionBatchFocus] = useState(null);
  const [transitionFlags, setTransitionFlags] = useState([]);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [transitionOverride, setTransitionOverride] = useState(false);
  const [transitionOverrideReason, setTransitionOverrideReason] = useState("");

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Edit Modal State
  const [editingBatch, setEditingBatch] = useState(null);
  const [editFormData, setEditFormData] = useState(EMPTY_FORM);

  // Enrolled Students Modal State
  const [viewingStudentsBatch, setViewingStudentsBatch] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/curriculum/batches');
      if (res?.success) setBatches(res.data);
    } catch (error) {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    const fetchTracks = async () => {
      try {
        const res = await api.get('/curriculum/tracks');
        if (res?.success) setTracks(res.data);
      } catch (error) {
        // ignore
      }
    };
    fetchTracks();
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/departments'); // Assuming this endpoint exists, or similar
        if (res?.success) setDepartments(res.data.map(d => d.name || d));
        else setDepartments(['Computer Science', 'Software Engineering', 'Artificial Intelligence', 'Cyber Security']);
      } catch (error) {
        setDepartments(['Computer Science', 'Software Engineering', 'Artificial Intelligence', 'Cyber Security']);
      }
    };
    fetchDepartments();
  }, []);

  const initiateActivation = async (batch) => {
    try {
      const res = await api.get(`/curriculum/batches/${batch.id}/checklist`);
      if (res.success) {
        setActivationChecklist(res.data);
        setAttemptingBatch(batch);
      }
    } catch (err) {
      toast.error(err.message || 'Error loading checklist');
    }
  };

  const confirmActivation = async () => {
    if (!attemptingBatch) return;
    await handleStateChange(attemptingBatch.id, 'Active');
    setAttemptingBatch(null);
    setActivationChecklist(null);
  };

  const handleAssignTrack = async (batchId, trackId) => {
    try {
      const res = await api.put(`/curriculum/batches/${batchId}/track`, { trackId });
      if (res?.success) {
        toast.success('Track assigned successfully');
        fetchBatches();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Error assigning track');
    }
  };

  const initiateTransition = async (batch) => {
    try {
      const res = await api.get(`/curriculum/batches/${batch.id}/flags`);
      if (res.success) {
        setTransitionFlags(res.data);
        setTransitionBatchFocus(batch);
        setIsTransitionModalOpen(true);
        setTransitionOverride(false);
        setTransitionOverrideReason("");
      }
    } catch (err) {
      toast.error('Failed to load transition flags');
    }
  };

  const submitTransition = async () => {
    if (transitionOverride && !transitionOverrideReason.trim()) {
      return toast.error("Please provide an override justification.");
    }

    try {
      const res = await api.post('/curriculum/batches/transition', {
        sourceBatchId: transitionBatchFocus.id,
        override: transitionOverride,
        override_reason: transitionOverrideReason
      });
      if (res.success) {
        toast.success(res.message);
        setIsTransitionModalOpen(false);
        fetchBatches();
      }
    } catch (err) {
      toast.error(err.message || 'Transition failed');
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/curriculum/batches', formData);
      if (res.success) {
        toast.success('Batch created successfully');
        setIsModalOpen(false);
        setFormData(EMPTY_FORM);
        fetchBatches();
      }
    } catch (error) {
      toast.error(error.message || 'Error creating batch');
    }
  };

  // Open the edit modal prefilled with existing batch data
  const openEditModal = (batch) => {
    setEditingBatch(batch);
    setEditFormData({
      name: batch.name,
      department: batch.department,
      academic_year: batch.academic_year,
      fyp_phase: batch.fyp_phase,
      start_date: batch.start_date ? batch.start_date.substring(0, 10) : ''
    });
  };

  const handleEditBatch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/curriculum/batches/${editingBatch.id}`, editFormData);
      if (res.success) {
        toast.success('Batch updated successfully');
        setEditingBatch(null);
        fetchBatches();
      }
    } catch (error) {
      toast.error(error.message || 'Error updating batch');
    }
  };

  const handleDeleteBatch = async (batch) => {
    if (!window.confirm(`Are you sure you want to delete "${batch.name}"? This action cannot be undone.`)) return;
    try {
      const res = await api.delete(`/curriculum/batches/${batch.id}`);
      if (res.success) {
        toast.success('Batch deleted successfully');
        fetchBatches();
      }
    } catch (error) {
      toast.error(error.message || 'Cannot delete this batch');
    }
  };

  const handleViewStudents = async (batch) => {
    setViewingStudentsBatch(batch);
    setStudentsLoading(true);
    setStudentSearchTerm('');
    try {
      const res = await api.get(`/curriculum/batches/${batch.id}/students`);
      if (res?.success) setEnrolledStudents(res.data || []);
      else setEnrolledStudents([]);
    } catch (error) {
      toast.error('Failed to load enrolled students');
      setEnrolledStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleStateChange = async (id, state) => {
    if (!window.confirm(`Are you sure you want to change batch state to ${state}?`)) return;
    try {
      const res = await api.put(`/curriculum/batches/${id}/state`, { state });
      if (res.success) {
        toast.success(`Batch state updated to ${state}`);
        fetchBatches();
      }
    } catch (error) {
      toast.error(error.message || 'Error updating state');
    }
  };

  const handleFileUpload = async (e, batchId) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('batchId', batchId);

    try {
      toast.success('Uploading and enrolling students...');
      const res = await api.post('/curriculum/batches/enroll', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        if (res.errors && res.errors.length > 0) {
          toast.warning(res.message + ' Check console for details.');
          console.warn('Enrollment errors:', res.errors);
        } else {
          toast.success(res.message);
        }
        fetchBatches();
      }
      // Reset file input so the same file can be re-uploaded
      e.target.value = '';
    } catch (error) {
      toast.error(error.message || 'Upload failed');
      e.target.value = '';
    }
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Draft': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Frozen': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Archived': return 'bg-gray-200 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Banner Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#193869] to-[#234e92] rounded-3xl shadow-xl overflow-hidden mb-10"
        >
          <div className="px-8 py-10 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <BookOpen className="w-48 h-48" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-2">Academic Batches</h1>
                <p className="text-blue-100 max-w-xl text-lg">Define, organize, and orchestrate all FYP cohorts. Connect tracks to batches seamlessly.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-[#193869] px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Cohort</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Batches Grid */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {batches.map((batch, idx) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col transition-all duration-300"
              >
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-[#193869] flex items-center justify-center shadow-inner">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight">{batch.name}</h3>
                        <p className="text-sm text-gray-500 font-medium">{batch.department}</p>
                      </div>
                    </div>
                    {/* Edit & Delete buttons — only for Draft */}
                    {batch.state === 'Draft' && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEditModal(batch)}
                          title="Edit batch"
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(batch)}
                          title="Delete batch"
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getStateColor(batch.state)}`}>
                      {batch.state}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider">
                      {batch.academic_year}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Activity className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Phase</p>
                        <p className="font-bold text-gray-900">{batch.fyp_phase}</p>
                      </div>
                    </div>
                    <div 
                      className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-green-50 transition-colors border border-transparent hover:border-green-200"
                      onClick={() => handleViewStudents(batch)}
                    >
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Users className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Students</p>
                        <p className="font-bold text-gray-900">{batch.enrolled_students || 0}</p>
                      </div>
                    </div>
                  </div>

                  {batch.track_name && (
                    <div className="bg-purple-50 rounded-xl p-4 flex items-center gap-3 mt-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <BookOpen className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-purple-500 uppercase font-bold tracking-wider mb-0.5">Assigned Track</p>
                        <p className="font-bold text-gray-900 line-clamp-1" title={batch.track_name}>{batch.track_name}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 border-t border-gray-100 flex flex-wrap gap-2 justify-between items-center">
                  {batch.state === 'Draft' && (
                    <div className="w-full flex flex-col sm:flex-row gap-2">
                      <select
                        value={batch.track_id || ''}
                        onChange={(e) => handleAssignTrack(batch.id, e.target.value)}
                        className="flex-1 bg-white border border-purple-200 text-purple-900 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-purple-400 text-sm font-bold shadow-sm"
                      >
                        <option value="" disabled>Assign Track...</option>
                        {tracks.filter(t => t.fyp_phase === batch.fyp_phase && (t.department.toLowerCase() === batch.department.toLowerCase() || batch.department === 'All Departments' || t.department.toLowerCase() === 'all departments') && !batches.some(b => b.track_id === t.id && b.id !== batch.id)).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <label className="relative cursor-pointer text-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-bold shadow-sm group">
                        Enroll
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-3 bg-gray-800 text-white text-xs rounded-xl shadow-lg z-50 pointer-events-none text-left">
                          <p className="font-bold mb-1 text-purple-300">CSV Format:</p>
                          <p className="text-gray-300">Must contain a column named <strong className="text-white">email</strong> with student emails already in the system.</p>
                          <p className="text-gray-400 mt-1 italic">Tip: Export Students from User Management to get the correct emails.</p>
                        </div>
                        <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, batch.id)} />
                      </label>
                      <button onClick={() => initiateActivation(batch)} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all text-sm font-bold">
                        Activate
                      </button>
                    </div>
                  )}
                  {batch.state === 'Active' && (
                    <>
                      {batch.fyp_phase === 'FYP-I' && (
                        <button onClick={() => initiateTransition(batch)} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all text-sm font-bold">
                          Transitions & Flags
                        </button>
                      )}
                      <button onClick={() => handleStateChange(batch.id, 'Frozen')} className="flex-1 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-bold shadow-sm">
                        Freeze
                      </button>
                      <button onClick={() => handleStateChange(batch.id, 'Archived')} className="flex-1 bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all text-sm font-bold">
                        Archive
                      </button>
                    </>
                  )}
                  {batch.state === 'Frozen' && (
                    <button onClick={() => handleStateChange(batch.id, 'Active')} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all text-sm font-bold">
                      Unfreeze
                    </button>
                  )}
                  {batch.state === 'Archived' && (
                    <span className="w-full text-center text-gray-500 text-sm font-medium py-2">
                      Historical Record - Locked
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {batches.length === 0 && (
            <div className="col-span-full">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No active cohorts yet</h3>
                <p className="text-gray-500 max-w-md mx-auto">Create your first academic batch to start onboarding students and assigning proposal tracks.</p>
              </motion.div>
            </div>
          )}
        </div>

        {/* Create Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
              >
                <div className="bg-gradient-to-r from-[#193869] to-[#234e92] p-6 text-white flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Create New Cohort</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateBatch} className="p-8">
                  <BatchFormFields formData={formData} setFormData={setFormData} departments={departments} />
                  <div className="mt-8 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-3 font-bold bg-gradient-to-r from-[#193869] to-[#234e92] text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                      <Plus className="w-5 h-5" /> Launch Cohort
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <AnimatePresence>
          {editingBatch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingBatch(null)} />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
              >
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Edit Cohort</h2>
                    <p className="text-orange-100 text-sm mt-1">{editingBatch.name}</p>
                  </div>
                  <button onClick={() => setEditingBatch(null)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleEditBatch} className="p-8">
                  <BatchFormFields formData={editFormData} setFormData={setEditFormData} departments={departments} />
                  <div className="mt-8 flex justify-end gap-3">
                    <button type="button" onClick={() => setEditingBatch(null)} className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-3 font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                      <Pencil className="w-5 h-5" /> Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Pre-Activation Checklist Modal */}
        <AnimatePresence>
          {activationChecklist && attemptingBatch && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActivationChecklist(null)} />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 p-8"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Pre-Activation Checklist</h2>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                    <span className="font-bold text-gray-700 text-sm">Enrolled Students</span>
                    {activationChecklist.enrolledStudents > 0 ? (
                      <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">{activationChecklist.enrolledStudents} OK</span>
                    ) : (
                      <span className="text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full">0 Required</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                    <span className="font-bold text-gray-700 text-sm">Track Assigned</span>
                    {activationChecklist.trackAssigned ? (
                      <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">Yes ({activationChecklist.totalTasks} tasks)</span>
                    ) : (
                      <span className="text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full">Missing</span>
                    )}
                  </div>

                  {(!activationChecklist.trackAssigned || activationChecklist.enrolledStudents === 0) && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      Cannot activate. Please resolve the issues above.
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setActivationChecklist(null)} className="flex-1 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Review</button>
                  <button
                    onClick={confirmActivation}
                    disabled={!activationChecklist.trackAssigned || activationChecklist.enrolledStudents === 0}
                    className="flex-1 py-3 font-bold bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                  >
                    Confirm Activation
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Transition Modal */}
        <AnimatePresence>
          {isTransitionModalOpen && transitionBatchFocus && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsTransitionModalOpen(false)} />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
              >
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Batch Transition to FYP-II</h2>
                    <p className="text-blue-200 text-sm mt-1">{transitionBatchFocus.name}</p>
                  </div>
                  <button onClick={() => setIsTransitionModalOpen(false)} className="text-white/80 hover:text-white bg-white/10 p-2 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto bg-gray-50">
                  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2"><AlertCircle className="text-orange-500 w-5 h-5" /> Issue Flags</h3>
                    {transitionFlags.filter(f => !f.is_resolved).length === 0 ? (
                      <p className="text-green-600 font-bold bg-green-50 p-4 rounded-xl border border-green-100">No unresolved flags blocking transition! All groups clear.</p>
                    ) : (
                      <div className="space-y-3">
                        {transitionFlags.filter(f => !f.is_resolved).map(flag => (
                          <div key={flag.id} className="p-4 bg-orange-50 border border-orange-200 rounded-xl relative">
                            <div className="font-bold text-orange-900 mb-1">{flag.project_title}</div>
                            <p className="text-orange-800 text-sm">{flag.reason}</p>
                            <div className="text-xs text-orange-600 space-x-2 mt-2 font-semibold">
                              <span>Flagged by {flag.flagged_by_name}</span>
                              <span>•</span>
                              <span>{new Date(flag.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <hr className="my-6 border-gray-200" />

                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <input type="checkbox" id="overrideToggle" className="w-5 h-5 accent-blue-600" checked={transitionOverride} onChange={e => setTransitionOverride(e.target.checked)} />
                      <label htmlFor="overrideToggle" className="font-bold text-gray-800 cursor-pointer">Override Flags & Mandatory Constraints</label>
                    </div>

                    {transitionOverride && (
                      <div className="pl-8 mb-4">
                        <textarea required rows="2" className="w-full border-2 border-red-200 bg-red-50 focus:border-red-400 focus:ring-0 outline-none rounded-xl p-3 text-sm text-red-900 placeholder-red-300 font-medium" placeholder="Justification for exceptional override..." value={transitionOverrideReason} onChange={e => setTransitionOverrideReason(e.target.value)}></textarea>
                      </div>
                    )}

                    <button onClick={submitTransition} disabled={!transitionOverride && transitionFlags.filter(f => !f.is_resolved).length > 0} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                      Confirm Transition to FYP-II
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>

      {/* Enrolled Students Modal */}
      <AnimatePresence>
        {viewingStudentsBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingStudentsBatch(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[85vh]"
            >
              <div className="bg-gradient-to-r from-[#193869] to-[#234e92] p-6 text-white flex justify-between items-center shrink-0">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6" /> Enrolled Students</h2>
                  <p className="text-blue-200 text-sm mt-1">{viewingStudentsBatch.name}</p>
                </div>
                <button onClick={() => setViewingStudentsBatch(null)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 shrink-0 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search by SAP ID, Name or Email..." 
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#193869] outline-none transition-all shadow-sm"
                    value={studentSearchTerm}
                    onChange={e => setStudentSearchTerm(e.target.value)}
                  />
                </div>
                {viewingStudentsBatch?.state !== 'Archived' && (
                  <label className="cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-bold whitespace-nowrap shadow-sm">
                    <Plus className="w-4 h-4"/> Late Enroll
                    <input type="file" accept=".csv" className="hidden" onChange={async (e) => {
                       await handleFileUpload(e, viewingStudentsBatch.id);
                       handleViewStudents(viewingStudentsBatch);
                    }} />
                  </label>
                )}
              </div>

              <div className="overflow-y-auto p-6 bg-white flex-grow">
                {studentsLoading ? (
                  <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#193869]"></div></div>
                ) : enrolledStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium text-lg">Not enrolled yet..</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrolledStudents.filter(s => 
                      s.sap_id?.toLowerCase().includes(studentSearchTerm.toLowerCase()) || 
                      s.username?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                      s.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
                    ).length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No students match your search.</p>
                    ) : (
                      enrolledStudents.filter(s => 
                        s.sap_id?.toLowerCase().includes(studentSearchTerm.toLowerCase()) || 
                        s.username?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        s.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
                      ).map(student => (
                        <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#193869] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
                              {student.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 group-hover:text-[#193869] transition-colors">{student.username}</p>
                              <p className="text-sm text-gray-500">{student.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold border border-blue-100">
                              {student.sap_id || 'No SAP ID'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

// Reusable form fields component shared between Create and Edit modals
const BatchFormFields = ({ formData, setFormData, departments }) => (
  <div className="space-y-5">
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2"><BookOpen className="w-4 h-4 text-gray-400" /> Batch Identifier</label>
      <input required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#193869] focus:bg-white transition-all outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. BSCS-Fall-2025" />
    </div>

    <div className="grid grid-cols-2 gap-5">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /> Academic Year</label>
        <input required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#193869] focus:bg-white transition-all outline-none" value={formData.academic_year} onChange={e => setFormData({ ...formData, academic_year: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2"><Activity className="w-4 h-4 text-gray-400" /> FYP Phase</label>
        <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#193869] focus:bg-white transition-all outline-none" value={formData.fyp_phase} onChange={e => setFormData({ ...formData, fyp_phase: e.target.value })}>
          <option>FYP-I</option>
          <option>FYP-II</option>
        </select>
      </div>
    </div>

    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2"><Shield className="w-4 h-4 text-gray-400" /> Department</label>
      <select required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#193869] focus:bg-white transition-all outline-none" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
        <option value="" disabled>Select Department</option>
        <option value="All Departments">All Departments</option>
        <option value="Artificial Intelligence">Artificial Intelligence</option>
        <option value="Software Engineering">Software Engineering</option>
        <option value="Computer Science">Computer Science</option>
        <option value="Cyber Security">Cyber Security</option>
        <option value="Data Science">Data Science</option>
        {departments && departments.filter(d => !['All Departments', 'Artificial Intelligence', 'Software Engineering', 'Computer Science', 'Cyber Security', 'Data Science'].includes(d)).map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /> Start Date</label>
      <input required type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#193869] focus:bg-white transition-all outline-none" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
    </div>
  </div>
);

export default BatchManagement;
