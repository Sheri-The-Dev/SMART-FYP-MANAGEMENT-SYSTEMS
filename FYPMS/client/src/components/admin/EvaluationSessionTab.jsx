import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Plus, Trash2, Edit2, Users, Award, ClipboardList, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import evaluationSessionService from '../../services/evaluationSessionService';
import { useToast } from '../common/Toast';
import Loading from '../common/Loading';

const EvaluationSessionTab = () => {
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    batch_id: '',
    session_type: 'PROGRESS_PRESENTATION',
    session_date: '',
    session_time: '',
    venue: '',
    academic_year: new Date().getFullYear().toString(),
    group_ids: [],
    committee_member_ids: []
  });
  const [editId, setEditId] = useState(null);
  const [unscheduledGroups, setUnscheduledGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const resBatches = await api.get('/curriculum/batches');
      const activeBatches = (resBatches.data || []).filter(b => b.state === 'Active');
      setBatches(activeBatches);

      if (activeBatches.length > 0) {
        const resSessions = await evaluationSessionService.getAllSessions(activeBatches[0].id);
        setSessions(resSessions.data || []);
      }

      const resCommittee = await evaluationSessionService.getCommitteeMembers();
      setCommitteeMembers(resCommittee.data || resCommittee || []);
    } catch (err) {
      toast.error('Failed to load evaluation sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnscheduledGroups = async (batchId) => {
    if (!batchId) {
      setUnscheduledGroups([]);
      return;
    }
    try {
      setLoadingGroups(true);
      const res = await evaluationSessionService.getUnscheduledGroups(batchId);
      setUnscheduledGroups(res.data || []);
    } catch (err) {
      console.error('Failed to fetch unscheduled groups:', err);
      setUnscheduledGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const openModal = (session = null) => {
    if (session) {
      setEditId(session.id);
      setFormData({
        batch_id: session.batch_id,
        session_type: session.session_type,
        session_date: session.session_date ? session.session_date.split('T')[0] : '',
        session_time: session.session_time,
        venue: session.venue,
        academic_year: session.academic_year || new Date().getFullYear().toString(),
        group_ids: session.groups ? session.groups.map(g => g.id) : [],
        committee_member_ids: session.committee ? session.committee.map(c => c.id) : []
      });
      fetchUnscheduledGroups(session.batch_id);
    } else {
      setEditId(null);
      const defaultBatchId = batches.length > 0 ? batches[0].id : '';
      setFormData({
        batch_id: defaultBatchId,
        session_type: 'PROGRESS_PRESENTATION',
        session_date: '',
        session_time: '',
        venue: '',
        academic_year: new Date().getFullYear().toString(),
        group_ids: [],
        committee_member_ids: []
      });
      fetchUnscheduledGroups(defaultBatchId);
    }
    setIsModalOpen(true);
  };

  const handleBatchChange = (batchId) => {
    setFormData({ ...formData, batch_id: batchId, group_ids: [] });
    fetchUnscheduledGroups(batchId);
    // Also refresh the main list for this batch
    refreshSessions(batchId);
  };

  const refreshSessions = async (batchId) => {
    try {
      const res = await evaluationSessionService.getAllSessions(batchId);
      setSessions(res.data || []);
    } catch (err) {
      console.error('Error refreshing sessions:', err);
    }
  };

  const handleGroupToggle = (groupId) => {
    const currentIds = formData.group_ids || [];
    if (currentIds.includes(groupId)) {
      setFormData({ ...formData, group_ids: currentIds.filter(id => id !== groupId) });
    } else {
      setFormData({ ...formData, group_ids: [...currentIds, groupId] });
    }
  };

  const handleCommitteeToggle = (memberId) => {
    const currentIds = formData.committee_member_ids || [];
    if (currentIds.includes(memberId)) {
      setFormData({ ...formData, committee_member_ids: currentIds.filter(id => id !== memberId) });
    } else {
      setFormData({ ...formData, committee_member_ids: [...currentIds, memberId] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.batch_id || !formData.session_date || !formData.session_time || !formData.venue) {
      return toast.error('Please fill all required fields');
    }

    if (formData.committee_member_ids.length < 2) {
      return toast.error('Minimum 2 committee members are required for an evaluation session');
    }

    try {
      if (editId) {
        await evaluationSessionService.updateSession(editId, formData);
        toast.success('Evaluation session updated successfully');
      } else {
        await evaluationSessionService.createSession(formData);
        toast.success('Evaluation session scheduled successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Error saving evaluation session');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this evaluation session? All associated group assignments will be lost.')) return;
    try {
      await evaluationSessionService.deleteSession(id);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Error deleting session');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Evaluation Sessions</h2>
          <p className="text-gray-500 text-sm mt-1">Schedule FYP evaluation sessions and assign committee members</p>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-gradient-to-r from-[#193869] to-[#234e92] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Create Session
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 mb-6">
        <label className="text-sm font-bold text-gray-700 mr-4">Filter by Batch:</label>
        <select 
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#193869]"
          onChange={(e) => refreshSessions(e.target.value)}
          defaultValue={batches[0]?.id}
        >
          {batches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm transition-all hover:border-gray-200">
          <ClipboardList className="w-20 h-20 mx-auto text-gray-200 mb-4" />
          <h3 className="text-xl font-bold text-gray-700">No sessions scheduled</h3>
          <p className="text-gray-400 mt-2">Create a new evaluation session to begin scheduling groups and committee members.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.map((session) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={session.id}
              className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#193869] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#d29538]" />
                    {session.session_type === 'PROGRESS_PRESENTATION' ? 'Progress Presentation (FYP-I)' : 'Final Demo (FYP-II)'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      {session.group_count || 0} Groups
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${session.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                      {session.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Committee Members</p>
                    <p className="text-sm text-gray-600 font-medium">{session.committee_names || 'None assigned'}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(session)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(session.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Calendar className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Date & Day</p>
                    <p>{new Date(session.session_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Time</p>
                    <p>{session.session_time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><MapPin className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Venue</p>
                    <p>{session.venue}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-[#193869] to-[#234e92] p-8 text-white relative">
              <h2 className="text-2xl font-bold flex items-center gap-3"><ClipboardList className="w-7 h-7" /> {editId ? 'Edit Evaluation Session' : 'Create Evaluation Session'}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors"
              >
                <Plus className="w-7 h-7 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <label className="block text-sm font-bold text-blue-900 mb-2">Target Academic Batch</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-[#193869] outline-none transition-all"
                    value={formData.batch_id} onChange={e => handleBatchChange(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select a batch...</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.department})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Session Type</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#193869] outline-none transition-all"
                    value={formData.session_type} onChange={e => setFormData({ ...formData, session_type: e.target.value })}
                    required
                  >
                    <option value="PROGRESS_PRESENTATION">Progress Presentation (FYP-I)</option>
                    <option value="FINAL_DEMO">Final Demo (FYP-II)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Date</label>
                    <input type="date" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#193869] outline-none transition-all font-medium"
                      value={formData.session_date} onChange={e => setFormData({ ...formData, session_date: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Time</label>
                    <input type="time" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#193869] outline-none transition-all font-medium"
                      value={formData.session_time} onChange={e => setFormData({ ...formData, session_time: e.target.value })} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Venue / Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input type="text" placeholder="e.g. Lab 4" className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#193869] outline-none transition-all font-medium"
                        value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Academic Year</label>
                    <input type="text" placeholder="e.g. 2024" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#193869] outline-none transition-all font-medium"
                      value={formData.academic_year} onChange={e => setFormData({ ...formData, academic_year: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Assign Groups ({formData.group_ids?.length || 0} selected)
                  </label>
                  <div className="bg-slate-50 border border-gray-200 rounded-2xl p-2 max-h-40 overflow-y-auto custom-scrollbar shadow-inner">
                    {loadingGroups ? (
                      <div className="text-center py-4"><div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#193869]"></div></div>
                    ) : unscheduledGroups.length === 0 ? (
                      <p className="text-center py-4 text-gray-400 text-sm italic">No available groups found.</p>
                    ) : (
                      <div className="space-y-1">
                        {unscheduledGroups.map(group => (
                          <label key={group.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-[#193869] cursor-pointer transition-all group/item shadow-sm">
                            <div className="flex-1 mr-4">
                              <p className="font-bold text-gray-800 text-sm group-hover/item:text-[#193869] transition-colors">{group.project_title}</p>
                              <p className="text-xs text-gray-500">Lead: {group.lead_name}</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={formData.group_ids?.includes(group.id) || false}
                              onChange={() => handleGroupToggle(group.id)}
                              className="h-5 w-5 rounded border-gray-300 text-[#193869] focus:ring-[#193869]"
                            />
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Assign Committee Members ({formData.committee_member_ids?.length || 0} selected)
                  </label>
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Users size={12} /> Minimum 2 members required
                  </p>
                  <div className="bg-slate-50 border border-gray-200 rounded-2xl p-2 max-h-40 overflow-y-auto custom-scrollbar shadow-inner">
                    <div className="space-y-1">
                      {committeeMembers.map(member => (
                        <label key={member.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-[#193869] cursor-pointer transition-all group/item shadow-sm">
                          <div className="flex-1 mr-4">
                            <p className="font-bold text-gray-800 text-sm group-hover/item:text-[#193869] transition-colors">{member.username}</p>
                            <p className="text-xs text-gray-500">SAP ID: {member.sap_id || 'N/A'}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.committee_member_ids?.includes(member.id) || false}
                            onChange={() => handleCommitteeToggle(member.id)}
                            className="h-5 w-5 rounded border-gray-300 text-[#193869] focus:ring-[#193869]"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors order-2 sm:order-1"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#193869] to-[#234e92] text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:shadow-[#193869]/20 transition-all flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  {editId ? 'Update Session' : 'Create Session'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EvaluationSessionTab;
