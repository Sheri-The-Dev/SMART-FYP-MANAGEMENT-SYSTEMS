import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, RefreshCw, AlertCircle, Clock, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import ProposalCard from '../components/proposal/ProposalCard';
import ProposalForm from '../components/proposal/ProposalForm';
import ProposalDetailModal from '../components/proposal/ProposalDetailModal';
import Loading from '../components/common/Loading';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import proposalService from '../services/proposalService';
import api from '../services/api';

// ============================================
// PROPOSAL DASHBOARD PAGE (STUDENT) - BATCH GATED
// ============================================

const ProposalDashboard = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [editProposal, setEditProposal] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState(null);
  const [batchInfo, setBatchInfo] = useState(undefined); // undefined = loading, null = no batch

  const toast = useToast();

  useEffect(() => {
    fetchProposals();
    fetchBatchInfo();
  }, []);

  const fetchBatchInfo = async () => {
    try {
      const res = await api.get('/curriculum/batches/my-batch');
      setBatchInfo(res.success ? (res.data || null) : null);
    } catch {
      setBatchInfo(null);
    }
  };

  const canCreateProposal = batchInfo && batchInfo.state === 'Active';

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await proposalService.getMyProposals();
      const proposalsData = response.data || response || [];
      setProposals(Array.isArray(proposalsData) ? proposalsData : []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error(error.message || 'Failed to load proposals');
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (proposalId) => {
    try {
      console.log('🔍 Fetching proposal details for ID:', proposalId);
      const response = await proposalService.getProposalDetails(proposalId);
      console.log('📡 Proposal details response:', response);
      
      const proposalData = response.data || response;
      setSelectedProposal(proposalData);
      setShowDetailModal(true);
    } catch (error) {
      console.error('❌ Error fetching proposal details:', error);
      toast.error(error.message || 'Failed to load proposal details');
    }
  };

  const handleEdit = async (proposalId) => {
    try {
      console.log('✏️ Loading proposal for edit, ID:', proposalId);
      const response = await proposalService.getProposalDetails(proposalId);
      const proposalData = response.data || response;
      setEditProposal(proposalData);
      setShowForm(true);
    } catch (error) {
      console.error('❌ Error loading proposal for edit:', error);
      toast.error(error.message || 'Failed to load proposal');
    }
  };

  const handleDelete = async () => {
    if (!proposalToDelete) return;

    try {
      await proposalService.deleteProposal(proposalToDelete);
      toast.success('Proposal deleted successfully');
      setDeleteModalOpen(false);
      setProposalToDelete(null);
      fetchProposals();
    } catch (error) {
      console.error('❌ Error deleting proposal:', error);
      toast.error(error.message || 'Failed to delete proposal');
    }
  };

  const confirmDelete = (proposalId) => {
    setProposalToDelete(proposalId);
    setDeleteModalOpen(true);
  };

  const handleFormSuccess = () => {
    fetchProposals();
    setEditProposal(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditProposal(null);
  };

  const refreshSelectedProposal = useCallback(async () => {
    if (!selectedProposal?.id) return;
    try {
      const response = await proposalService.getProposalDetails(selectedProposal.id);
      const proposalData = response.data || response;
      setSelectedProposal(proposalData);
      setProposals((prev) => prev.map((p) => (
        p.id === proposalData.id ? { ...p, status: proposalData.status, updated_at: proposalData.updated_at } : p
      )));
    } catch (error) {
      console.error('❌ Error refreshing proposal details:', error);
    }
  }, [selectedProposal?.id]);

  const getStatusCounts = () => {
    if (!proposals || !Array.isArray(proposals)) {
      return {
        draft: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
        revision: 0,
      };
    }

    return {
      draft: proposals.filter(p => p.status === 'draft' || p.status === 'pending_member_confirmation').length,
      submitted: proposals.filter(p => p.status === 'submitted').length,
      approved: proposals.filter(p => p.status === 'approved').length,
      rejected: proposals.filter(p => p.status === 'rejected').length,
      revision: proposals.filter(p => p.status === 'revision_requested').length,
    };
  };

  if (loading) {
    return <Loading fullScreen text="Loading proposals..." />;
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ═══ BATCH GATE BANNER ═══ */}
        {batchInfo !== undefined && !canCreateProposal && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {batchInfo === null ? (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-amber-900">Enrollment Required</h3>
                    <p className="text-amber-700 text-sm mt-1">
                      Aap kisi batch mein enrolled nahi hain. Admin se contact karein enrollment ke liye. Proposals tab jaake submit ho sakte hain jab aap kisi Active batch mein enrolled hoon.
                    </p>
                  </div>
                </div>
              </div>
            ) : batchInfo.state === 'Draft' ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-blue-900">Batch Not Yet Active</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      Aapki batch <strong>"{batchInfo.name}"</strong> abhi <strong>Draft</strong> state mein hai. Admin jab batch activate karega tab aap proposal submit kar sakte hain.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-gray-50 to-slate-100 border-2 border-gray-300 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Batch {batchInfo.state}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Aapki batch <strong>"{batchInfo.name}"</strong> abhi <strong>{batchInfo.state}</strong> hai. New proposals create nahi ho sakte. Admin se contact karein.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Proposals
              </h1>
              <p className="text-gray-600">
                Manage your Final Year Project proposals
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={fetchProposals}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>

              {canCreateProposal && statusCounts.approved === 0 && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#193869] to-[#234e92] hover:from-[#234e92] hover:to-[#193869] text-white rounded-lg font-semibold shadow-lg transition-all transform hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Create New Proposal
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.draft}</p>
                  <p className="text-xs text-gray-600 font-medium">Drafts</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-blue-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#193869]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#193869]">{statusCounts.submitted}</p>
                  <p className="text-xs text-gray-600 font-medium">Submitted</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-green-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
                  <p className="text-xs text-gray-600 font-medium">Approved</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-orange-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#d29538]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#d29538]">{statusCounts.revision}</p>
                  <p className="text-xs text-gray-600 font-medium">Revisions</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-red-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
                  <p className="text-xs text-gray-600 font-medium">Rejected</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Proposals Grid */}
        {!proposals || proposals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-xl shadow-sm"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-[#193869] to-[#234e92] rounded-full flex items-center justify-center mx-auto mb-6 opacity-90">
              <FileText className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No Proposals Yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Get started by creating your first proposal. Your drafts and submissions will appear here.
            </p>
            {canCreateProposal && statusCounts.approved === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#193869] to-[#234e92] hover:from-[#234e92] hover:to-[#193869] text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                <Plus className="w-6 h-6" />
                Create Your First Proposal
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Active Proposals Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Active Proposals</h2>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {proposals.filter(p => p.status !== 'rejected').map((proposal, index) => (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProposalCard
                      proposal={proposal}
                      onView={handleViewDetails}
                      onEdit={proposal.can_manage ? handleEdit : undefined}
                      onDelete={proposal.can_manage ? confirmDelete : undefined}
                      userRole="Student"
                      isLeader={proposal.is_leader}
                    />
                  </motion.div>
                ))}
                {proposals.filter(p => p.status !== 'rejected').length === 0 && (
                  <div className="col-span-full py-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                    No active proposals found.
                  </div>
                )}
              </motion.div>
            </div>

            {/* Archived / Rejected Proposals Section */}
            {proposals.filter(p => p.status === 'rejected').length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 opacity-75">Archived / Rejected</h2>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75"
                >
                  {proposals.filter(p => p.status === 'rejected').map((proposal, index) => (
                    <motion.div
                      key={proposal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ProposalCard
                        proposal={proposal}
                        onView={handleViewDetails}
                        userRole="Student"
                        isLeader={proposal.is_leader}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </div>
        )}
      </main>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <div className="p-4">
          <p className="text-gray-700 mb-6">Are you sure you want to delete this draft proposal? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete Proposal</Button>
          </div>
        </div>
      </Modal>

      {/* Proposal Form Modal */}
      {showForm && (
        <ProposalForm
          isOpen={showForm}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
          editProposal={editProposal}
        />
      )}

      {/* Proposal Detail Modal */}
      {showDetailModal && (
        <ProposalDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          proposal={selectedProposal}
          onEdit={(p) => handleEdit(p.id)}
          onStatusUpdate={refreshSelectedProposal}
        />
      )}
    </div>
  );
};

export default ProposalDashboard;
