import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Plus, Trash2, Edit2, Users, Award, ClipboardList, CheckCircle, XCircle, Search, CheckSquare, Square } from 'lucide-react';
import api from '../../services/api';
import evaluationSessionService from '../../services/evaluationSessionService';
import { useToast } from '../../components/common/Toast';
import Loading from '../../components/common/Loading';
import Header from '../../components/layout/Header';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

const EvaluationSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [activeBatch, setActiveBatch] = useState(null);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [committeeSearch, setCommitteeSearch] = useState('');
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
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const resBatches = await api.get('/curriculum/batches');
      const batchData = resBatches?.data || resBatches || [];
      const activeBatches = Array.isArray(batchData) ? batchData.filter(b => b.state === 'Active') : [];
      setBatches(activeBatches);

      if (activeBatches.length > 0) {
        const batch = activeBatches[0];
        setActiveBatch(batch);
        await fetchSessions(batch.id);
      }

      // FIX 2: Fetch all staff roles for committee selection
      const resUsers = await api.get('/admin/users');
      const allUsers = resUsers?.data?.users || [];
      
      // Filter for evaluators: Teacher, Supervisor, Committee, Coordinator
      const evaluators = allUsers.filter(u => 
        ['Teacher', 'Supervisor', 'Committee', 'Coordinator'].includes(u.role)
      );
      
      setCommitteeMembers(evaluators);
    } catch (err) {
      console.error('fetchInitialData Error:', err);
      toast.error('Failed to load evaluation data');
    } finally {
      setLoading(false);
    }
  };

  const filteredCommittee = useMemo(() => {
    return committeeMembers.filter(member => 
      member.username.toLowerCase().includes(committeeSearch.toLowerCase()) ||
      (member.sap_id && member.sap_id.toLowerCase().includes(committeeSearch.toLowerCase()))
    );
  }, [committeeMembers, committeeSearch]);

  const handleSelectAllCommittee = () => {
    const allIds = filteredCommittee.map(m => m.id);
    const currentSelected = formData.committee_member_ids;
    
    // If all filtered members are already selected, deselect them
    const allFilteredSelected = allIds.every(id => currentSelected.includes(id));
    
    if (allFilteredSelected) {
      setFormData({
        ...formData,
        committee_member_ids: currentSelected.filter(id => !allIds.includes(id))
      });
    } else {
      // Add all filtered members to selection
      setFormData({
        ...formData,
        committee_member_ids: Array.from(new Set([...currentSelected, ...allIds]))
      });
    }
  };

  const fetchSessions = async (batchId) => {
    try {
      const res = await evaluationSessionService.getAllSessions(batchId);
      setSessions(res?.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Error fetching sessions:', err);
      toast.error('Failed to load sessions');
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
      setUnscheduledGroups(res?.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to fetch unscheduled groups:', err);
      setUnscheduledGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleBatchChange = async (batchId) => {
    if (!batchId) return;
    const batch = (batches || []).find(b => b.id?.toString() === batchId.toString());
    if (batch) {
      setActiveBatch(batch);
      await fetchSessions(batchId);
    }
  };

  const openModal = (session = null) => {
    if (session) {
      setEditId(session.id);
      setFormData({
        batch_id: session.batch_id || '',
        session_type: session.session_type || 'PROGRESS_PRESENTATION',
        session_date: session.session_date ? session.session_date.split('T')[0] : '',
        session_time: session.session_time || '',
        venue: session.venue || '',
        academic_year: session.academic_year || '',
        group_ids: Array.isArray(session.groups) ? session.groups.map(g => g.id) : [],
        committee_member_ids: Array.isArray(session.committee) ? session.committee.map(c => c.id) : []
      });
      fetchUnscheduledGroups(session.batch_id);
    } else {
      setEditId(null);
      setFormData({
        batch_id: activeBatch?.id || '',
        session_type: 'PROGRESS_PRESENTATION',
        session_date: '',
        session_time: '',
        venue: '',
        academic_year: '',
        group_ids: [],
        committee_member_ids: []
      });
      if (activeBatch?.id) fetchUnscheduledGroups(activeBatch.id);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Defensive check
    if (!formData.batch_id || !formData.session_date || !formData.session_time || !formData.venue) {
      return toast.error('Please fill all required fields');
    }

    if ((formData.committee_member_ids || []).length < 2) {
      return toast.error('Minimum 2 committee members required');
    }

    try {
      if (editId) {
        await evaluationSessionService.updateSession(editId, formData);
        toast.success('Session updated');
      } else {
        await evaluationSessionService.createSession(formData);
        toast.success('Session created');
      }
      setIsModalOpen(false);
      fetchSessions(formData.batch_id);
    } catch (err) {
      toast.error(err.message || 'Failed to save session');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this evaluation session?')) return;
    try {
      await evaluationSessionService.deleteSession(id);
      toast.success('Deleted');
      fetchSessions(activeBatch.id);
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleGroupToggle = (groupId) => {
    const current = formData.group_ids || [];
    setFormData({
      ...formData,
      group_ids: current.includes(groupId) ? current.filter(id => id !== groupId) : [...current, groupId]
    });
  };

  const handleCommitteeToggle = (memberId) => {
    const current = formData.committee_member_ids || [];
    setFormData({
      ...formData,
      committee_member_ids: current.includes(memberId) ? current.filter(id => id !== memberId) : [...current, memberId]
    });
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Evaluation Sessions</h1>
            <p className="text-gray-600">Schedule FYP evaluation sessions and assign committee members</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-[#193869] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#234e92] transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Create Session
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 mb-8 flex items-center gap-4">
          <label className="text-sm font-bold text-gray-700">Filter by Batch:</label>
          <select 
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none"
            value={activeBatch?.id || ''}
            onChange={(e) => handleBatchChange(e.target.value)}
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
            <ClipboardList className="w-20 h-20 mx-auto text-gray-200 mb-4" />
            <h3 className="text-xl font-bold text-gray-700">No sessions scheduled</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(sessions || []).map((session) => (
              <div key={session.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all relative group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {session.session_type === 'PROGRESS_PRESENTATION' ? 'Progress Presentation — FYP-I' : 'Final Demo — FYP-II'}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {session.group_count || 0} Groups
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${session.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {session.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(session)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(session.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                  </div>
                </div>

                <div className="space-y-3 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-[#193869]" />
                    <span>
                      {session.session_date ? 
                        new Date(session.session_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 
                        'Date not set'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-[#193869]" />
                    <span>{session.session_time || 'Time not set'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-[#193869]" />
                    <span>{session.venue || 'Venue not set'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users size={18} className="text-[#193869]" />
                    <span className="truncate">Committee: {session.committee_names || 'None assigned'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editId ? "Update Evaluation Session" : "Create Evaluation Session"}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Session Type</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                value={formData.session_type}
                onChange={e => setFormData({...formData, session_type: e.target.value})}
                required
              >
                <option value="PROGRESS_PRESENTATION">Progress Presentation — FYP-I</option>
                <option value="FINAL_DEMO">Final Demo — FYP-II</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Date</label>
                <input type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  value={formData.session_date} onChange={e => setFormData({...formData, session_date: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Time</label>
                <input type="time" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  value={formData.session_time} onChange={e => setFormData({...formData, session_time: e.target.value})} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Venue</label>
                <input type="text" placeholder="e.g. Conference Hall A" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Academic Year</label>
                <input type="text" placeholder="e.g. 2025-2026" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  value={formData.academic_year} onChange={e => setFormData({...formData, academic_year: e.target.value})} required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Assign Groups ({ (formData.group_ids || []).length } selected)</label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                {loadingGroups ? <div className="text-center py-2"><Loading /></div> : 
                 (unscheduledGroups || []).length === 0 ? <p className="text-center py-2 text-gray-400 text-sm">No groups available</p> :
                 unscheduledGroups.map(group => (
                   <label key={group.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                     <input type="checkbox" checked={formData.group_ids.includes(group.id)} onChange={() => handleGroupToggle(group.id)} className="w-4 h-4 text-[#193869]" />
                     <span className="text-sm font-medium">{group.project_title}</span>
                   </label>
                 ))
                }
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-700">
                  Assign Committee Members ({ (formData.committee_member_ids || []).length } selected)
                </label>
                <button 
                  type="button" 
                  onClick={handleSelectAllCommittee}
                  className="text-xs font-bold text-[#193869] hover:underline flex items-center gap-1"
                >
                  {filteredCommittee.every(m => formData.committee_member_ids.includes(m.id)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search by name or SAP ID..." 
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#193869] outline-none"
                  value={committeeSearch}
                  onChange={(e) => setCommitteeSearch(e.target.value)}
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
                {filteredCommittee.length === 0 ? (
                  <p className="text-center py-4 text-gray-400 text-sm italic">No matching members found.</p>
                ) : (
                  <div className="space-y-1">
                    {filteredCommittee.map(member => (
                      <label key={member.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-100 hover:border-[#193869] cursor-pointer transition-all group/item shadow-sm">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={formData.committee_member_ids.includes(member.id)} 
                            onChange={() => handleCommitteeToggle(member.id)} 
                            className="w-4 h-4 rounded border-gray-300 text-[#193869] focus:ring-[#193869]" 
                          />
                          <div className="text-sm">
                            <p className="font-bold text-gray-800 group-hover/item:text-[#193869] transition-colors">
                              {member.username} <span className="text-[10px] font-normal text-gray-400 uppercase tracking-tighter ml-1">({member.role})</span>
                            </p>
                            <p className="text-[11px] text-gray-500 font-medium">SAP ID: {member.sap_id || 'N/A'}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              { (formData.committee_member_ids || []).length < 2 && (
                <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1 animate-pulse">
                  <XCircle size={12} /> Minimum 2 committee members required
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={ (formData.committee_member_ids || []).length < 2 || (formData.group_ids || []).length === 0 }
              >
                {editId ? 'Update Session' : 'Create Session'}
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default EvaluationSessions;
