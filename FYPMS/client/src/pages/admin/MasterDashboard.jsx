import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, Download, BookOpen, Search, Filter } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { API_BASE_URL } from '../../utils/constants';
import api from '../../services/api';
import Loading from '../../components/common/Loading';
import Header from '../../components/layout/Header';
import * as XLSX from 'xlsx';

const MasterDashboard = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [complianceData, setComplianceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tasks, setTasks] = useState([]);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [extensionGroupTarget, setExtensionGroupTarget] = useState(null);
  const [groupDetailsModalOpen, setGroupDetailsModalOpen] = useState(false);
  const [selectedGroupParams, setSelectedGroupParams] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get('/curriculum/batches');
        if (res.success) {
          const activeBatches = res.data.filter(b => ['Active', 'Draft', 'Frozen', 'Archived'].includes(b.state)); // Let's show all or properly handle active
          // The issue says "other batches show nhi ho rhy". If they want to see all batches in dropdown:
          setBatches(res.data);
          if (res.data.length > 0) {
            const defaultBatch = res.data.find(b => b.state?.toUpperCase() === 'ACTIVE') || res.data[0];
            setSelectedBatch(defaultBatch.id);
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

  useEffect(() => {
    if (selectedBatch) {
      const fetchComplianceAndTasks = async () => {
        try {
          const res = await api.get(`/curriculum/compliance?batchId=${selectedBatch}`);
          if (res.success) setComplianceData(res.data);
          
          const batchObject = batches.find(b => b.id === selectedBatch);
          if (batchObject?.track_id) {
             const trackRes = await api.get(`/curriculum/tracks/${batchObject.track_id}/tasks`);
             if (trackRes.success) setTasks(trackRes.data);
          }
        } catch (err) {
          toast.error('Failed to load dashboard data');
        }
      };
      fetchComplianceAndTasks();
    }
  }, [selectedBatch, batches]);

  const handleGrantExtension = async (e) => {
    e.preventDefault();
    try {
       const res = await api.post('/curriculum/tasks/reopen', {
          taskId: extensionForm.taskId,
          proposalId: extensionGroupTarget.proposal_id || extensionGroupTarget.group_id, // ensure ID maps correctly
          new_deadline: extensionForm.newDeadline,
          reason: extensionForm.reason
       });
       if (res.success) {
          toast.success(res.message);
          setExtensionModalOpen(false);
       }
    } catch (err) {
       toast.error(err.message || 'Error granting extension');
    }
  };

  const exportCompliance = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(complianceData.map(d => ({
        'Group ID': d.group_id,
        'Project Title': d.project_title,
        'Total Tasks': d.total_tasks,
        'Completed Tasks': d.completed_tasks,
        'Compliance Rate': `${Math.round((d.completed_tasks/Math.max(1, d.total_tasks))*100)}%`
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Compliance");
      XLSX.writeFile(wb, "Batch_Compliance_Export.xlsx");
      toast.success('Export downloaded successfully');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  const filteredData = complianceData.filter(row => 
    row.project_title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    row.group_id?.toString().includes(searchTerm)
  );

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Banner Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-600 rounded-3xl shadow-xl overflow-hidden mb-10"
        >
          <div className="px-8 py-10 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Activity className="w-48 h-48" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-2">Compliance & Monitor</h1>
                <p className="text-emerald-100 max-w-xl text-lg">Real-time completion tracking per batch. Rapidly identify struggling groups and gaps in the pipeline.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative">
                  <Filter className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                  <select 
                    value={selectedBatch} 
                    onChange={e => setSelectedBatch(e.target.value)}
                    className="relative pl-12 pr-10 py-3 bg-white text-gray-800 border-none rounded-2xl shadow-lg focus:ring-4 focus:ring-emerald-400/50 appearance-none font-bold outline-none min-w-[250px] transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Batch...</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.department}) - {b.state}</option>)}
                  </select>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportCompliance}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-6 py-3 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Download className="w-5 h-5" />
                  <span>Export Report</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {!selectedBatch ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <BookOpen className="w-12 h-12 text-gray-400" />
             </div>
             <p className="text-gray-500 text-xl font-medium">No active batch selected to monitor.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-white flex justify-between items-center flex-col sm:flex-row gap-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600"/> Batch Progress Logs
              </h2>
              <div className="relative w-full sm:w-auto">
                 <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                 <input 
                   type="text" 
                   placeholder="Search group or ID..." 
                   className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-72 transition-colors"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Group / Project</th>
                    <th className="px-8 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Members</th>
                    <th className="px-8 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Total Tasks</th>
                    <th className="px-8 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Completed</th>
                    <th className="px-8 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest min-w-[200px]">Compliance</th>
                    <th className="px-8 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Status Flags</th>
                    <th className="px-8 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 placeholder-opacity-0 hover:placeholder-opacity-100">
                  {complianceData.length === 0 ? (
                    <tr><td colSpan="6" className="px-8 py-12 text-center text-gray-500 text-lg">No data available for this batch.</td></tr>
                  ) : filteredData.length === 0 ? (
                    <tr><td colSpan="6" className="px-8 py-12 text-center text-gray-500 text-lg">No groups match your search criteria.</td></tr>
                  ) : (
                    filteredData.map((row, i) => {
                      const rate = row.completion_pct ?? Math.round((row.completed_tasks / Math.max(1, row.total_tasks)) * 100);
                      const status = row.compliance_status || (rate < 50 ? 'Lagging' : 'On Track');
                      const isLagging = status === 'Lagging';
                      const isNoTasks = status === 'No Tasks';
                      const isModerate = status === 'Moderate';
                      return (
                        <motion.tr 
                          key={row.group_id} 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-gray-50 transition-colors group"
                        >
                          <td className="px-8 py-5 cursor-pointer" onClick={() => { setSelectedGroupParams(row); setGroupDetailsModalOpen(true); }}>
                            <div className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors mb-1">{row.project_title}</div>
                            <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
                              <span className="text-gray-700 bg-gray-100 px-2 py-0.5 rounded">#{row.group_id}</span>
                              {row.lead_name && <span className="text-gray-500">Lead: {row.lead_name}</span>}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center font-bold text-gray-600 text-lg">
                             {row.members_list ? row.members_list.length : 1}
                          </td>
                          <td className="px-8 py-5 text-center font-bold text-gray-600 text-lg">{row.total_tasks}</td>
                          <td className="px-8 py-5 text-center font-bold text-emerald-600 text-lg">{row.completed_tasks}</td>
                          <td className="px-8 py-5 text-center">
                            <div className="flex items-center gap-4">
                              <div className="w-full bg-gray-100 rounded-full h-3 max-w-[150px] shadow-inner overflow-hidden flex-1">
                                <motion.div 
                                  initial={{ width: 0 }} animate={{ width: `${rate}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                                  className={`h-full rounded-full ${
                                    isNoTasks ? 'bg-gray-300' :
                                    isLagging ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                                    isModerate ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                                    'bg-gradient-to-r from-emerald-400 to-emerald-600'
                                  }`} 
                                />
                              </div>
                              <span className="text-sm font-extrabold text-gray-700 w-12 text-right">{rate}%</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            {isNoTasks ? (
                              <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg text-sm font-bold border border-gray-200">
                                No Tasks Yet
                              </span>
                            ) : isLagging ? (
                              <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-red-200">
                                <AlertTriangle className="w-4 h-4" /> Lagging
                              </span>
                            ) : isModerate ? (
                              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-amber-200">
                                <AlertTriangle className="w-4 h-4" /> Moderate
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-emerald-200">
                                <CheckCircle className="w-4 h-4" /> On Track
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-5 text-center">
                            <button 
                              onClick={() => { setExtensionGroupTarget(row); setExtensionForm({...extensionForm, taskId: ''}); setExtensionModalOpen(true); }}
                              className="text-emerald-600 font-bold hover:text-emerald-700 underline text-sm"
                            >
                               Extend
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Extension Form Modal */}
        <AnimatePresence>
          {extensionModalOpen && extensionGroupTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setExtensionModalOpen(false)} />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 20 }} 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
              >
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white">
                  <h2 className="text-2xl font-bold mb-1">Grant Extension</h2>
                  <p className="text-emerald-100 text-sm">{extensionGroupTarget.project_title}</p>
                </div>
                
                <form onSubmit={handleGrantExtension} className="p-8">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Select Task</label>
                      <select required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={extensionForm.taskId} onChange={e=>setExtensionForm({...extensionForm, taskId: e.target.value})}>
                         <option value="" disabled>Select a Task...</option>
                         {tasks.map(t => <option key={t.id} value={t.id}>{t.title} (Week {t.week_number})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">New Deadline</label>
                      <input required type="datetime-local" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={extensionForm.newDeadline} onChange={e=>setExtensionForm({...extensionForm, newDeadline: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Reason for Extension</label>
                      <textarea required rows="3" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={extensionForm.reason} onChange={e=>setExtensionForm({...extensionForm, reason: e.target.value})} placeholder="Mitigating circumstances..."></textarea>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end gap-3">
                    <button type="button" onClick={()=>setExtensionModalOpen(false)} className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-3 font-bold bg-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:bg-emerald-700 transition">Confirm Extension</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Group Details Modal */}
        <AnimatePresence>
          {groupDetailsModalOpen && selectedGroupParams && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setGroupDetailsModalOpen(false)} />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 20 }} 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden relative z-10"
              >
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex justify-between items-start">
                   <div>
                     <h2 className="text-2xl font-bold mb-1">Group Details</h2>
                     <p className="text-emerald-100">{selectedGroupParams.project_title}</p>
                   </div>
                   <button onClick={() => setGroupDetailsModalOpen(false)} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                   </button>
                </div>
                
                <div className="p-8 overflow-y-auto flex-grow flex flex-col md:flex-row gap-8 bg-gray-50">
                   {/* Left Col: Members */}
                   <div className="md:w-1/3 space-y-6 border-r border-gray-200 pr-4">
                      <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 border-b pb-2"><BookOpen className="w-5 h-5 text-emerald-600"/> Enrolled Members</h3>
                      {(!selectedGroupParams.members_list || selectedGroupParams.members_list.length === 0) ? (
                         <p className="text-gray-500 text-sm">No specific member details retrieved.</p>
                      ) : (
                         <div className="space-y-4">
                           {selectedGroupParams.members_list.map((m, idx) => (
                             <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <p className="font-bold text-gray-900">{m.username || m.name}</p>
                                <p className="text-gray-500 text-sm">{m.sap_id} • {m.department || 'Student'}</p>
                             </div>
                           ))}
                         </div>
                      )}
                   </div>

                   {/* Right Col: Submissions History */}
                   <div className="md:w-2/3 space-y-6">
                      <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 border-b pb-2"><Activity className="w-5 h-5 text-emerald-600"/> Submission Pipeline</h3>
                      {(!selectedGroupParams.submissions_list || selectedGroupParams.submissions_list.length === 0) ? (
                         <div className="bg-white p-8 rounded-xl text-center shadow-sm border border-gray-200">
                            <p className="text-gray-500">No submissions recorded yet.</p>
                         </div>
                      ) : (
                         <div className="space-y-3">
                           {selectedGroupParams.submissions_list.map((sub, idx) => (
                             <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-emerald-200 transition-colors">
                                <div>
                                   <p className="font-bold text-gray-800 text-base">{sub.title}</p>
                                   <p className="text-xs text-gray-500 mt-1">Status: <span className="font-semibold">{sub.status}</span> • Sub: {new Date(sub.submitted_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                   {sub.file_url && (
                                     <a href={`${API_BASE_URL.replace('/api', '')}/uploads/${sub.file_url}`} target="_blank" rel="noreferrer" className="text-white bg-[#193869] hover:bg-blue-800 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm inline-flex items-center gap-1">
                                       Download
                                     </a>
                                   )}
                                   {sub.status === 'Completed' || sub.status === 'Evaluated' || sub.status === 'Pending' ? (
                                     <span className="inline-flex items-center justify-center p-2 bg-emerald-50 text-emerald-600 rounded-full group-hover:bg-emerald-100"><CheckCircle className="w-5 h-5"/></span>
                                   ) : (
                                     <span className="text-gray-300"><AlertTriangle className="w-5 h-5"/></span>
                                   )}
                                </div>
                             </div>
                           ))}
                         </div>
                      )}
                   </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default MasterDashboard;
