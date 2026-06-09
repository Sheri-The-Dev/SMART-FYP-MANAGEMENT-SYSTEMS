import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Save, Calendar, Layers, Clock, Shield, Pencil, Trash2, X, Check } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import api from '../../services/api';
import Loading from '../../components/common/Loading';
import Header from '../../components/layout/Header';

const DEPT_OPTIONS = ['All Departments', 'Computer Science', 'Software Engineering', 'Artificial Intelligence', 'Cyber Security'];

const CurriculumManagement = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  
  // Track creation
  const [isCreating, setIsCreating] = useState(false);
  const [newTrack, setNewTrack] = useState({ name: '', department: 'Computer Science', fyp_phase: 'FYP-I' });

  // Track editing
  const [editingTrack, setEditingTrack] = useState(null); // holds { id, name, department, fyp_phase }
  const [editTrackData, setEditTrackData] = useState({ name: '', department: 'Computer Science', fyp_phase: 'FYP-I' });

  // Task creation/viewing
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    week_number: 1, title: '', description: '', task_type: 'Template-Based', is_mandatory: true, deadline_datetime: ''
  });
  const [templateFile, setTemplateFile] = useState(null);

  // Task editing
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskData, setEditTaskData] = useState({});

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/curriculum/tracks');
      if (res.success) setTracks(res.data);
    } catch (err) {
      toast.error('Failed to load tracks.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (trackId) => {
    try {
      const res = await api.get(`/curriculum/tracks/${trackId}/tasks`);
      if (res.success) setTasks(res.data);
    } catch (err) {
      toast.error('Failed to load tasks');
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    if (selectedTrack) {
      fetchTasks(selectedTrack.id);
    }
  }, [selectedTrack]);

  const handleCreateTrack = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/curriculum/tracks', newTrack);
      if (res.success) {
        toast.success('Track created successfully');
        setIsCreating(false);
        setNewTrack({ name: '', department: 'Computer Science', fyp_phase: 'FYP-I' });
        fetchTracks();
      }
    } catch (err) {
      toast.error('Creation failed');
    }
  };

  const handleCloneTrack = async (track) => {
    try {
       const cloneName = prompt(`Enter name for the clone of "${track.name}":`, `${track.name} (Clone)`);
       if (!cloneName) return;
       const res = await api.post(`/curriculum/tracks/${track.id}/clone`, { newName: cloneName });
       if (res.success) {
          toast.success('Track cloned successfully!');
          fetchTracks();
       }
    } catch(err) {
       toast.error(err.message || 'Error cloning track');
    }
  };

  const handleDeleteTrack = async (trackId) => {
    if (!window.confirm("Are you sure you want to delete this track? It will be blocked if active batches rely on it.")) return;
    try {
       const res = await api.delete(`/curriculum/tracks/${trackId}`);
       if (res.success) {
          toast.success('Track deleted.');
          if (selectedTrack?.id === trackId) setSelectedTrack(null);
          fetchTracks();
       }
    } catch(err) {
       toast.error(err.message || 'Cannot delete track.');
    }
  };

  const openEditTrack = (track, e) => {
    e.stopPropagation();
    setEditingTrack(track);
    setEditTrackData({ name: track.name, department: track.department, fyp_phase: track.fyp_phase });
  };

  const handleUpdateTrack = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/curriculum/tracks/${editingTrack.id}`, editTrackData);
      if (res.success) {
        toast.success('Track updated successfully!');
        // Update selected track if it's the one being edited
        if (selectedTrack?.id === editingTrack.id) {
          setSelectedTrack({ ...selectedTrack, ...editTrackData });
        }
        setEditingTrack(null);
        fetchTracks();
      }
    } catch (err) {
      toast.error(err.message || 'Error updating track.');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!selectedTrack) return;

    try {
      const formData = new FormData();
      Object.keys(newTask).forEach(key => {
        if (key === 'is_mandatory') {
           formData.append(key, newTask[key] ? 1 : 0);
        } else {
           formData.append(key, newTask[key]);
        }
      });
      if (templateFile) formData.append('template', templateFile);

      toast.info('Uploading template and saving task...');
      const res = await api.post(`/curriculum/tracks/${selectedTrack.id}/tasks`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        toast.success('Task Added');
        setNewTask({ ...newTask, title: '', description: '', week_number: newTask.week_number + 1 });
        setTemplateFile(null);
        fetchTasks(selectedTrack.id);
      }
    } catch (err) {
      toast.error('Error adding task');
    }
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setEditTaskData({
      week_number: task.week_number,
      title: task.title,
      description: task.description,
      task_type: task.task_type,
      is_mandatory: !!task.is_mandatory,
      deadline_offset_days: task.deadline_offset_days
    });
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/curriculum/tasks/${editingTask.id}`, editTaskData);
      if (res.success) {
        toast.success('Task updated successfully!');
        setEditingTask(null);
        fetchTasks(selectedTrack.id);
      }
    } catch (err) {
      toast.error(err.message || 'Error updating task.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this week/task? Student submissions for this task will also be removed.')) return;
    try {
      const res = await api.delete(`/curriculum/tasks/${taskId}`);
      if (res.success) {
        toast.success('Task deleted.');
        fetchTasks(selectedTrack.id);
      }
    } catch (err) {
      toast.error(err.message || 'Error deleting task.');
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Header Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 rounded-3xl shadow-xl overflow-hidden mb-8"
        >
          <div className="px-8 py-8 text-white relative flex justify-between items-center">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Layers className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">Curriculum Builder</h1>
              <p className="text-purple-100 max-w-xl">Configure 16-week milestone tracks. Define assignments, attach templates, and set smart deadlines.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreating(true)}
              className="relative z-10 bg-white text-purple-800 px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Track
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: Tracks */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden sticky top-24">
              <div className="p-5 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg"><Layers className="w-5 h-5 text-purple-600"/> Saved Tracks</h2>
              </div>
              <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                <AnimatePresence>
                  {isCreating && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleCreateTrack} 
                      className="mb-4 bg-purple-50 p-4 rounded-xl border border-purple-200 text-sm shadow-inner"
                    >
                      <input required placeholder="Track Name" className="w-full mb-3 p-2 bg-white border border-purple-100 rounded-lg outline-none focus:ring-2 focus:ring-purple-400" value={newTrack.name} onChange={e => setNewTrack({...newTrack, name: e.target.value})} />
                      <select className="w-full mb-3 p-2 bg-white border border-purple-100 rounded-lg outline-none focus:ring-2 focus:ring-purple-400" value={newTrack.department} onChange={e => setNewTrack({...newTrack, department: e.target.value})}>
                        {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select className="w-full mb-3 p-2 bg-white border border-purple-100 rounded-lg outline-none focus:ring-2 focus:ring-purple-400" value={newTrack.fyp_phase} onChange={e => setNewTrack({...newTrack, fyp_phase: e.target.value})}>
                        <option>FYP-I</option><option>FYP-II</option>
                      </select>
                      <div className="flex justify-end gap-2">
                         <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1 text-gray-500 font-bold hover:bg-white rounded-lg">Cancel</button>
                         <button type="submit" className="px-3 py-1 bg-purple-600 text-white font-bold rounded-lg shadow-sm">Save</button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
                
                {tracks.map(t => (
                  <div key={t.id} className="relative group/card">
                     <button 
                       onClick={() => setSelectedTrack(t)}
                       className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 block ${selectedTrack?.id === t.id ? 'bg-purple-50 border-purple-400 shadow-sm' : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
                     >
                       <p className={`font-bold text-base ${selectedTrack?.id === t.id ? 'text-purple-800' : 'text-gray-800'}`}>{t.name}</p>
                       <p className="text-xs text-gray-500 mt-1 font-medium">{t.department} • {t.fyp_phase}</p>
                     </button>
                     <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                         <button onClick={(e) => openEditTrack(t, e)} title="Edit track" className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 p-1.5 rounded">
                           <Pencil className="w-3 h-3"/>
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); handleCloneTrack(t); }} className="text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded">Clone</button>
                         <button onClick={(e) => { e.stopPropagation(); handleDeleteTrack(t.id); }} className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 p-1.5 rounded">
                           <Trash2 className="w-3 h-3"/>
                         </button>
                     </div>
                  </div>
                ))}

                {tracks.length === 0 && !isCreating && (
                  <p className="text-center text-gray-400 text-sm py-6 italic">No tracks created yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Main: Tasks planner */}
          <div className="lg:col-span-3">
            {selectedTrack ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                 <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                   <div>
                     <h2 className="text-2xl font-extrabold text-[#193869] drop-shadow-sm">{selectedTrack.name}</h2>
                     <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Planner Configuration</p>
                   </div>
                   <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-xl font-bold">
                     {tasks.length} Tasks
                   </div>
                 </div>
                 
                 <div className="p-8">
                   {/* Existing Tasks Timeline */}
                   <div className="mb-12 relative">
                     {tasks.length === 0 ? (
                       <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                          <p className="text-gray-500 italic font-medium">No tasks defined yet. Add the first milestone below.</p>
                       </div>
                     ) : (
                       <div className="space-y-6">
                         <div className="absolute left-8 top-0 bottom-0 w-1 bg-purple-100 rounded"></div>
                         {tasks.map((task, i) => (
                           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={task.id} className="relative pl-24 transition-all group">
                              <div className="absolute left-4 w-10 h-10 bg-white border-4 border-purple-200 rounded-full flex items-center justify-center font-bold text-purple-700 shadow-sm group-hover:border-purple-500 transition-colors z-10">
                                W{task.week_number}
                              </div>
                              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm group-hover:shadow-md transition-shadow relative">
                                {/* Edit / Delete controls */}
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => openEditTask(task)}
                                    title="Edit task"
                                    className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    title="Delete task"
                                    className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <h4 className="text-lg font-bold text-gray-900 mb-1 pr-16">{task.title}</h4>
                                <p className="text-sm text-gray-600 mb-4">{task.description}</p>
                                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
                                  <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg">{task.task_type}</span>
                                  {task.is_mandatory ? 
                                    <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg flex items-center gap-1"><Shield className="w-3 h-3"/> Mandatory</span> : 
                                    <span className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg flex items-center gap-1"> Optional</span>
                                  }
                                  <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-1"><Clock className="w-3 h-3"/> Deadline {task.deadline_datetime ? new Date(task.deadline_datetime).toLocaleDateString() : `+${task.deadline_offset_days}d`}</span>
                                </div>
                              </div>
                           </motion.div>
                         ))}
                       </div>
                     )}
                   </div>

                   {/* Add Task Form */}
                   <div className="bg-purple-50 p-8 rounded-3xl border border-purple-100 shadow-inner">
                      <h3 className="text-xl font-bold text-purple-900 mb-6 flex items-center gap-2"><Plus className="w-5 h-5 bg-purple-200 rounded-full p-0.5 text-purple-800"/> Append New Milestone</h3>
                      <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-purple-900 mb-2">Task Title <span className="text-red-500">*</span></label>
                          <input required className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="e.g. Project Proposal Drafting" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-purple-900 mb-2">Week Index</label>
                          <input type="number" min="1" required className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all" value={newTask.week_number} onChange={e => setNewTask({...newTask, week_number: parseInt(e.target.value)})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-purple-900 mb-2">Deadline (Date & Time)</label>
                          <input type="datetime-local" required className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all" value={newTask.deadline_datetime} onChange={e => setNewTask({...newTask, deadline_datetime: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-purple-900 mb-2">Instructions / Guidelines</label>
                          <textarea className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all" rows="3" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="Describe what the students need to do..."></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-purple-900 mb-2">Evaluation Type</label>
                          <select className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all" value={newTask.task_type} onChange={e => setNewTask({...newTask, task_type: e.target.value})}>
                            <option>Template-Based</option>
                            <option>Instruction-Only</option>
                            <option>Both</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-purple-900 mb-1">Reference Template (PDF/DOCX)</label>
                          <p className="text-xs text-purple-600 mb-2 font-medium">Students will download this file as a guideline or template to fill out for this task.</p>
                          <div className="w-full px-4 py-[9px] bg-white border border-purple-200 rounded-xl focus-within:ring-2 focus-within:ring-purple-500 outline-none transition-all flex items-center">
                            <input type="file" className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-colors" accept=".pdf,.doc,.docx" onChange={e => setTemplateFile(e.target.files[0])} />
                          </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end mt-4">
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-purple-700 transition flex items-center gap-2">
                            <Save className="w-5 h-5"/> Append to Track
                          </motion.button>
                        </div>
                      </form>
                   </div>
                 </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center h-full flex flex-col justify-center items-center shadow-sm">
                <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <Calendar className="w-16 h-16 text-gray-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Select a Track to configure</h3>
                <p className="text-gray-500 mt-4 max-w-sm text-lg">
                  Load an existing curriculum track from the left panel to begin orchestrating its 16-week cycle.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Track Modal */}
      <AnimatePresence>
        {editingTrack && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingTrack(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Edit Track</h2>
                  <p className="text-orange-100 text-sm mt-0.5">{editingTrack.name}</p>
                </div>
                <button onClick={() => setEditingTrack(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateTrack} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Track Name</label>
                  <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none transition-all" value={editTrackData.name} onChange={e => setEditTrackData({...editTrackData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Department</label>
                  <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none transition-all" value={editTrackData.department} onChange={e => setEditTrackData({...editTrackData, department: e.target.value})}>
                    {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">FYP Phase</label>
                  <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none transition-all" value={editTrackData.fyp_phase} onChange={e => setEditTrackData({...editTrackData, fyp_phase: e.target.value})}>
                    <option>FYP-I</option>
                    <option>FYP-II</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditingTrack(null)} className="px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl flex items-center gap-2 hover:shadow-lg transition-all">
                    <Check className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingTask(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
            >
              <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-6 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Edit Task</h2>
                  <p className="text-purple-200 text-sm mt-0.5">Week {editingTask.week_number} — {editingTask.title}</p>
                </div>
                <button onClick={() => setEditingTask(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateTask} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Task Title</label>
                  <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none transition-all" value={editTaskData.title} onChange={e => setEditTaskData({...editTaskData, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Week Index</label>
                    <input type="number" min="1" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none transition-all" value={editTaskData.week_number} onChange={e => setEditTaskData({...editTaskData, week_number: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Deadline Offset (Days)</label>
                    <input type="number" min="1" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none transition-all" value={editTaskData.deadline_offset_days} onChange={e => setEditTaskData({...editTaskData, deadline_offset_days: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Instructions</label>
                  <textarea rows="3" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none transition-all resize-none" value={editTaskData.description} onChange={e => setEditTaskData({...editTaskData, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Evaluation Type</label>
                    <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none transition-all" value={editTaskData.task_type} onChange={e => setEditTaskData({...editTaskData, task_type: e.target.value})}>
                      <option>Template-Based</option>
                      <option>Instruction-Only</option>
                      <option>Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Mandatory?</label>
                    <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none transition-all" value={editTaskData.is_mandatory ? 'yes' : 'no'} onChange={e => setEditTaskData({...editTaskData, is_mandatory: e.target.value === 'yes'})}>
                      <option value="yes">Yes — Mandatory</option>
                      <option value="no">No — Optional</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditingTask(null)} className="px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl flex items-center gap-2 hover:shadow-lg transition-all">
                    <Check className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CurriculumManagement;
