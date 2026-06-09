import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Plus, Trash2, Edit2, Users } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../common/Toast';
import Loading from '../common/Loading';

const DefenseSchedulingTab = () => {
  const [presentations, setPresentations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    batch_id: '',
    presentation_date: '',
    presentation_time: '',
    venue: '',
    group_ids: []
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
      const [resPres, resBatches] = await Promise.all([
        api.get('/presentations'),
        api.get('/curriculum/batches')
      ]);
      setPresentations(resPres.data || []);
      const activeBatches = (resBatches.data || []).filter(b => b.state === 'Active');
      setBatches(activeBatches);
    } catch (err) {
      toast.error('Failed to load proposal defense schedules');
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
      const res = await api.get(`/presentations/unscheduled-groups?batch_id=${batchId}`);
      setUnscheduledGroups(res.data || []);
    } catch (err) {
      console.error('Failed to fetch unscheduled groups:', err);
      setUnscheduledGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const openModal = (pres = null) => {
    if (pres) {
      setEditId(pres.id);
      setFormData({
        batch_id: pres.batch_id,
        presentation_date: pres.presentation_date.split('T')[0],
        presentation_time: pres.presentation_time,
        venue: pres.venue,
        group_ids: pres.groups ? pres.groups.map(g => g.id) : []
      });
      fetchUnscheduledGroups(pres.batch_id);
    } else {
      setEditId(null);
      const defaultBatchId = batches.length > 0 ? batches[0].id : '';
      setFormData({
        batch_id: defaultBatchId,
        presentation_date: '',
        presentation_time: '',
        venue: '',
        group_ids: []
      });
      fetchUnscheduledGroups(defaultBatchId);
    }
    setIsModalOpen(true);
  };

  const handleBatchChange = (batchId) => {
    setFormData({ ...formData, batch_id: batchId, group_ids: [] });
    fetchUnscheduledGroups(batchId);
  };

  const handleGroupToggle = (groupId) => {
    const currentIds = formData.group_ids || [];
    if (currentIds.includes(groupId)) {
      setFormData({ ...formData, group_ids: currentIds.filter(id => id !== groupId) });
    } else {
      setFormData({ ...formData, group_ids: [...currentIds, groupId] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.batch_id || !formData.presentation_date || !formData.presentation_time || !formData.venue) {
      return toast.error('Please fill all fields');
    }

    try {
      if (editId) {
        await api.put(`/presentations/${editId}`, formData);
        toast.success('Proposal Defense updated successfully');
      } else {
        await api.post('/presentations', formData);
        toast.success('Proposal Defense scheduled successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Error saving proposal defense');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this proposal defense event? All associated group schedules will be lost.')) return;
    try {
      await api.delete(`/presentations/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Error deleting event');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Proposal Defense Scheduling</h2>
          <p className="text-gray-500 text-sm mt-1">Schedule and manage faculty proposal defense sessions for approved groups.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-gradient-to-r from-[#193869] to-[#234e92] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Schedule Defense
        </button>
      </div>

      {presentations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm transition-all hover:border-gray-200">
          <Calendar className="w-20 h-20 mx-auto text-gray-200 mb-4" />
          <h3 className="text-xl font-bold text-gray-700">No events scheduled</h3>
          <p className="text-gray-400 mt-2">Create a new proposal defense event to begin scheduling groups.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {presentations.map((pres) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={pres.id}
              className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#193869] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    {pres.batch_name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      {pres.group_count || 0} Groups
                    </span>
                    {pres.groups && pres.groups.length > 0 && (
                      <span className="text-xs text-gray-500 italic truncate max-w-[200px]">
                        {pres.groups.map(g => g.project_title).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(pres)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(pres.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Calendar className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Date</p>
                    <p>{new Date(pres.presentation_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Time</p>
                    <p>{pres.presentation_time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><MapPin className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Venue</p>
                    <p>{pres.venue}</p>
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
              <h2 className="text-2xl font-bold flex items-center gap-3"><Calendar className="w-7 h-7" /> {editId ? 'Edit Defense Schedule' : 'Schedule New Defense'}</h2>
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
                  {batches.length === 0 && <p className="text-red-500 text-[11px] mt-2 font-medium bg-red-50 p-2 rounded-lg border border-red-100">No active batches available for scheduling.</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Select Groups ({formData.group_ids?.length || 0} selected)
                  </label>

                  {loadingGroups ? (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#193869]"></div>
                      <p className="text-gray-500 mt-2 text-sm font-medium">Fetching available groups...</p>
                    </div>
                  ) : unscheduledGroups.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center italic">
                      <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">
                        {formData.batch_id
                          ? "All eligible groups in this batch are already scheduled."
                          : "Please select a batch to see available groups."
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-gray-200 rounded-2xl p-2 max-h-60 overflow-y-auto custom-scrollbar shadow-inner">
                      <div className="space-y-1">
                        {unscheduledGroups.map(group => (
                          <label key={group.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-[#193869] cursor-pointer transition-all group/item shadow-sm">
                            <div className="flex-1 mr-4">
                              <p className="font-bold text-gray-800 text-sm group-hover/item:text-[#193869] transition-colors">{group.project_title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">Lead: {group.lead_name} • {group.lead_sap}</p>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={formData.group_ids?.includes(group.id) || false}
                                onChange={() => handleGroupToggle(group.id)}
                                className="peer h-6 w-6 opacity-0 absolute cursor-pointer"
                              />
                              <div className="h-6 w-6 border-2 border-gray-200 rounded-lg peer-checked:bg-[#193869] peer-checked:border-[#193869] transition-all flex items-center justify-center">
                                <Plus className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Date</label>
                    <input type="date" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#193869] outline-none transition-all font-medium"
                      value={formData.presentation_date} onChange={e => setFormData({ ...formData, presentation_date: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Time</label>
                    <input type="time" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#193869] outline-none transition-all font-medium"
                      value={formData.presentation_time} onChange={e => setFormData({ ...formData, presentation_time: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Venue / Room Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input type="text" placeholder="e.g. FYP Lab, Block C-302" className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#193869] outline-none transition-all font-medium"
                      value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} required />
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
                  {editId ? 'Update Schedule' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DefenseSchedulingTab;
