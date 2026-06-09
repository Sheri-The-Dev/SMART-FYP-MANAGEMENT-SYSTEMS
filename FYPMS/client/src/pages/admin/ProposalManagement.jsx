import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Upload, Download, FileText, TrendingUp, Users, Clock, 
  CheckCircle, XCircle, Trash2, RefreshCw, File, Calendar, 
  ClipboardList, Search 
} from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../../components/layout/Header';
import ProposalDetailModal from '../../components/proposal/ProposalDetailModal';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { useToast } from '../../components/common/Toast';
import proposalService from '../../services/proposalService';
import DefenseSchedulingTab from '../../components/admin/DefenseSchedulingTab';

// ============================================
// ADMIN PROPOSAL MANAGEMENT PAGE - ENHANCED
// ============================================

const ProposalManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [deleteProposalModalOpen, setDeleteProposalModalOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingProposal, setDeletingProposal] = useState(false);
  const [templateFile, setTemplateFile] = useState(null);
  const [templateName, setTemplateName] = useState('');

  const toast = useToast();

  useEffect(() => {
    // Handle deep linking for tabs
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['overview', 'proposals', 'templates', 'defense'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);

  useEffect(() => {
    fetchAnalytics();
    if (activeTab === 'proposals') {
      fetchProposals();
    }
    if (activeTab === 'templates') {
      fetchCurrentTemplate();
    }
  }, [activeTab]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await proposalService.getProposalAnalytics();
      const analyticsData = response.data || response;
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async () => {
    try {
      const response = await proposalService.getAllProposals();
      const proposalsData = response.data || response || [];
      setProposals(Array.isArray(proposalsData) ? proposalsData : []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Failed to load proposals');
      setProposals([]);
    }
  };

  const fetchCurrentTemplate = async () => {
    try {
      const response = await proposalService.getCurrentTemplate();
      const templateData = response.data || response;
      setCurrentTemplate(templateData);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching template:', error);
      }
      setCurrentTemplate(null);
    }
  };

  const handleViewDetails = async (proposalId) => {
    try {
      const response = await proposalService.getProposalDetails(proposalId);
      const proposalData = response.data || response;
      setSelectedProposal(proposalData);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error loading proposal details:', error);
      toast.error('Failed to load proposal details');
    }
  };

  const handleViewLogs = async (proposalId) => {
    try {
      const response = await proposalService.getProposalActivityLogs(proposalId);
      const logsData = response.data || response;
      setActivityLogs(logsData.logs || []);
      setSelectedProposal(logsData.proposal || null);
      setShowLogsModal(true);
    } catch (error) {
      console.error('Error loading activity logs:', error);
      toast.error('Failed to load activity logs');
    }
  };

  const confirmDeleteProposal = (proposalId) => {
    setProposalToDelete(proposalId);
    setDeleteProposalModalOpen(true);
  };

  const handleDeleteProposal = async () => {
    if (!proposalToDelete) return;
    try {
      setDeletingProposal(true);
      await proposalService.adminDeleteProposal(proposalToDelete);
      toast.success('Proposal deleted successfully');
      setDeleteProposalModalOpen(false);
      setProposalToDelete(null);
      fetchProposals();
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error(error.response?.data?.message || 'Failed to delete proposal');
    } finally {
      setDeletingProposal(false);
    }
  };

  const handleTemplateUpload = async () => {
    if (!templateFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      await proposalService.uploadTemplate(templateFile, templateName || 'Proposal Template');
      toast.success('Template uploaded successfully');
      setShowTemplateModal(false);
      setTemplateFile(null);
      setTemplateName('');
      fetchCurrentTemplate();
    } catch (error) {
      console.error('Template upload error:', error);
      toast.error('Failed to upload template');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!currentTemplate) return;
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      setDeleting(true);
      await proposalService.deleteTemplate(currentTemplate.id);
      toast.success('Template deleted successfully');
      setCurrentTemplate(null);
    } catch (error) {
      console.error('Template delete error:', error);
      toast.error('Failed to delete template');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!currentTemplate) return;
    try {
      const blob = await proposalService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentTemplate.template_name || 'Proposal_Template.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  if (loading && !analytics) {
    return <Loading fullScreen text="Loading analytics..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Proposal Management</h1>
          <p className="text-gray-600">System overview and administrative controls</p>
        </motion.div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'proposals', label: 'Proposals', icon: FileText },
              { id: 'templates', label: 'Templates', icon: File },
              { id: 'defense', label: 'Proposal Defense', icon: Calendar }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-[#193869] text-[#193869]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-[#193869] to-[#234e92] rounded-xl p-6 text-white shadow-lg">
                <FileText className="w-10 h-10 mb-3 opacity-80" />
                <p className="text-3xl font-bold mb-1">{analytics.total || 0}</p>
                <p className="text-blue-100 text-sm">Total Proposals</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <Clock className="w-10 h-10 mb-3 text-[#193869]" />
                <p className="text-3xl font-bold text-[#193869] mb-1">
                  {analytics.byStatus?.find(s => s.status === 'submitted')?.count || 0}
                </p>
                <p className="text-gray-500 text-sm">Pending Review</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <CheckCircle className="w-10 h-10 mb-3 text-green-600" />
                <p className="text-3xl font-bold text-green-600 mb-1">
                  {analytics.byStatus?.find(s => s.status === 'approved')?.count || 0}
                </p>
                <p className="text-gray-500 text-sm">Approved</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <TrendingUp className="w-10 h-10 mb-3 text-[#d29538]" />
                <p className="text-3xl font-bold text-[#d29538] mb-1">
                  {analytics.avgResponseTime || 0}
                </p>
                <p className="text-gray-500 text-sm">Avg. Response (days)</p>
              </div>
            </div>

            {/* Status Breakdown */}
            {analytics.byStatus && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Proposals by Status</h2>
                <div className="space-y-4">
                  {analytics.byStatus.map((item, index) => {
                    const statusConfig = {
                      draft: { color: 'bg-gray-400', label: 'Draft' },
                      submitted: { color: 'bg-blue-500', label: 'Submitted' },
                      approved: { color: 'bg-green-500', label: 'Approved' },
                      rejected: { color: 'bg-red-500', label: 'Rejected' },
                      revision_requested: { color: 'bg-orange-500', label: 'Revision Requested' }
                    };
                    const config = statusConfig[item.status] || { color: 'bg-gray-400', label: item.status };
                    const percentage = analytics.total > 0 ? (item.count / analytics.total * 100).toFixed(1) : 0;
                    return (
                      <div key={index}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-bold text-gray-700">{config.label}</span>
                          <span className="text-sm font-bold text-gray-900">{item.count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div className={`h-full ${config.color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Proposals Tab */}
        {activeTab === 'proposals' && (
          <div className="space-y-4">
            {proposals.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <FileText className="w-20 h-20 mx-auto text-gray-200 mb-4" />
                <h3 className="text-xl font-bold text-gray-700">No proposals found</h3>
              </div>
            ) : (
              proposals.map((proposal) => (
                <div key={proposal.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{proposal.project_title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 font-medium">
                      <span>Lead: {proposal.student_name}</span>
                      <span>Supervisor: {proposal.supervisor_name || 'TBD'}</span>
                      <span className="capitalize px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs font-bold">{proposal.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => handleViewDetails(proposal.id)} className="flex-1 md:flex-none px-4 py-2 bg-[#193869] text-white rounded-xl text-sm font-bold hover:bg-[#234e92] transition-colors">Details</button>
                    <button onClick={() => handleViewLogs(proposal.id)} className="flex-1 md:flex-none px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">Logs</button>
                    <button onClick={() => confirmDeleteProposal(proposal.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Proposal Template</h2>
            <p className="text-gray-500 mb-8">Manage the official proposal document template for students.</p>
            
            {currentTemplate ? (
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-[#193869] rounded-2xl text-white shadow-lg shadow-[#193869]/20">
                    <File className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{currentTemplate.template_name}</h3>
                    <p className="text-sm text-gray-500 font-medium">Uploaded {new Date(currentTemplate.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button onClick={handleDownloadTemplate} className="flex-1 sm:flex-none px-5 py-2.5 bg-[#193869] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#234e92] transition-all"><Download className="w-4 h-4" /> Download</button>
                  <button onClick={() => setShowTemplateModal(true)} className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-600 transition-all"><RefreshCw className="w-4 h-4" /> Replace</button>
                  <button onClick={handleDeleteTemplate} className="flex-1 sm:flex-none px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all"><Trash2 className="w-4 h-4" /> Delete</button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl">
                <FileText className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-medium mb-6">No template has been uploaded yet.</p>
                <button onClick={() => setShowTemplateModal(true)} className="px-8 py-3 bg-[#193869] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"><Upload className="w-5 h-5 inline mr-2" /> Upload Template</button>
              </div>
            )}
          </div>
        )}

        {/* Defense Tab */}
        {activeTab === 'defense' && (
          <DefenseSchedulingTab />
        )}
      </main>

      {/* Modals */}
      {showDetailModal && (
        <ProposalDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          proposal={selectedProposal}
        />
      )}

      <Modal isOpen={showLogsModal} onClose={() => setShowLogsModal(false)} size="xl" title="Activity Logs">
        <div className="space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar p-1">
            {activityLogs.map((log) => (
              <div key={log.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-start gap-4">
                <div>
                  <p className="font-bold text-gray-800">{log.action}</p>
                  <p className="text-sm text-gray-500 mt-0.5">By {log.username} ({log.user_role})</p>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(log.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="pt-4 flex justify-end">
            <Button variant="secondary" onClick={() => setShowLogsModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showTemplateModal} onClose={() => !uploading && setShowTemplateModal(false)} title="Upload Template">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Template Name</label>
            <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. FYP Proposal Template" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#193869] outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">PDF File</label>
            <input type="file" accept=".pdf" onChange={(e) => setTemplateFile(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#193869] file:text-white hover:file:bg-[#234e92]" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowTemplateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleTemplateUpload} loading={uploading} disabled={!templateFile}>Upload</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteProposalModalOpen} onClose={() => !deletingProposal && setDeleteProposalModalOpen(false)} title="Delete Proposal">
        <div className="space-y-6">
          <p className="text-gray-600 font-medium">Are you sure you want to permanently delete this proposal? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteProposalModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteProposal} loading={deletingProposal}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProposalManagement;
