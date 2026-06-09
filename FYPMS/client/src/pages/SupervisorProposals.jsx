import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, Filter, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/layout/Header';
import ProposalCard from '../components/proposal/ProposalCard';
import ProposalDetailModal from '../components/proposal/ProposalDetailModal';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { useToast } from '../components/common/Toast';
import proposalService from '../services/proposalService';

// ============================================
// SUPERVISOR PROPOSALS PAGE - FIXED
// ============================================
// FIXES: Proper API response handling
// ============================================

const SupervisorProposals = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackAction, setFeedbackAction] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('submitted');

  const toast = useToast();

  useEffect(() => {
    fetchProposals();
  }, [statusFilter]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching supervisor proposals with filter:', statusFilter);
      
      const response = await proposalService.getSupervisorProposals(statusFilter || null);
      console.log('📡 Supervisor Proposals API Response:', response);
      
      // API interceptor returns { success, data }
      const proposalsData = response.data || response || [];
      console.log('📋 Extracted proposals:', proposalsData);
      console.log('✅ Found', Array.isArray(proposalsData) ? proposalsData.length : 0, 'proposals');
      
      setProposals(Array.isArray(proposalsData) ? proposalsData : []);
    } catch (error) {
      console.error('❌ Error fetching proposals:', error);
      console.error('Error details:', error.message);
      toast.error(error.message || 'Failed to load proposals');
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (proposalId) => {
    try {
      console.log('🔍 Fetching proposal details:', proposalId);
      const response = await proposalService.getProposalDetails(proposalId);
      const proposalData = response.data || response;
      setSelectedProposal(proposalData);
      setShowDetailModal(true);
    } catch (error) {
      console.error('❌ Error fetching proposal details:', error);
      toast.error(error.message || 'Failed to load proposal details');
    }
  };

  const handleApprove = async (proposalId) => {
    try {
      const response = await proposalService.getProposalDetails(proposalId);
      const proposalData = response.data || response;
      setSelectedProposal(proposalData);
      setFeedbackAction('approve');
      setShowFeedbackModal(true);
    } catch (error) {
      toast.error(error.message || 'Failed to load proposal');
    }
  };

  const handleReject = async (proposalId) => {
    try {
      const response = await proposalService.getProposalDetails(proposalId);
      const proposalData = response.data || response;
      setSelectedProposal(proposalData);
      setFeedbackAction('reject');
      setFeedback('');
      setShowFeedbackModal(true);
    } catch (error) {
      toast.error(error.message || 'Failed to load proposal');
    }
  };

  const handleRequestRevision = async (proposalId) => {
    try {
      const response = await proposalService.getProposalDetails(proposalId);
      const proposalData = response.data || response;
      setSelectedProposal(proposalData);
      setFeedbackAction('revision');
      setFeedback('');
      setShowFeedbackModal(true);
    } catch (error) {
      toast.error(error.message || 'Failed to load proposal');
    }
  };

  const handleSubmitAction = async () => {
    if (feedbackAction !== 'approve' && feedback.trim().length < 20) {
      toast.error('Please provide detailed feedback (minimum 20 characters)');
      return;
    }

    try {
      setSubmitting(true);

      if (feedbackAction === 'approve') {
        await proposalService.approveProposal(selectedProposal.id);
        toast.success('Proposal approved successfully');
      } else if (feedbackAction === 'reject') {
        await proposalService.rejectProposal(selectedProposal.id, feedback);
        toast.success('Proposal rejected');
      } else if (feedbackAction === 'revision') {
        await proposalService.requestRevision(selectedProposal.id, feedback);
        toast.success('Revision requested');
      }

      setShowFeedbackModal(false);
      setFeedback('');
      fetchProposals();

    } catch (error) {
      console.error('❌ Error submitting action:', error);
      toast.error(error.message || 'Failed to submit action');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusCounts = () => {
    if (!proposals || !Array.isArray(proposals)) {
      return { submitted: 0, approved: 0, rejected: 0, revision: 0 };
    }

    return {
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
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Assigned Proposals
              </h1>
              <p className="text-gray-600">
                Review and manage proposals assigned to you
              </p>
            </div>

            <button
              onClick={fetchProposals}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border-2 border-blue-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#193869]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#193869]">{statusCounts.submitted}</p>
                  <p className="text-xs text-gray-600 font-medium">Pending Review</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-green-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
                  <p className="text-xs text-gray-600 font-medium">Approved</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-orange-200 p-4 shadow-sm">
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

            <div className="bg-white rounded-xl border-2 border-red-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
                  <p className="text-xs text-gray-600 font-medium">Rejected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            {[
              { value: null, label: 'All', icon: FileText },
              { value: 'submitted', label: 'Pending', icon: Clock },
              { value: 'approved', label: 'Approved', icon: CheckCircle },
              { value: 'revision_requested', label: 'Revisions', icon: FileText },
              { value: 'rejected', label: 'Rejected', icon: XCircle }
            ].map((filter) => {
              const Icon = filter.icon;
              const isActive = statusFilter === filter.value;
              return (
                <button
                  key={filter.value || 'all'}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-[#193869] text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Proposals List */}
        {!proposals || proposals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-xl shadow-sm"
          >
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Proposals Found
            </h3>
            <p className="text-gray-600 mb-6">
              {statusFilter 
                ? `No proposals with status: ${statusFilter}`
                : 'No proposals have been assigned to you yet'}
            </p>
            <button
              onClick={() => setStatusFilter(null)}
              className="text-[#193869] hover:text-[#234e92] font-medium"
            >
              Clear Filter
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal, index) => (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-[#193869] transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {proposal.project_title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="font-medium">Student: {proposal.student_name}</span>
                      <span>•</span>
                      <span>{proposal.member_count} member(s)</span>
                      {proposal.submission_date && (
                        <>
                          <span>•</span>
                          <span>Submitted: {new Date(proposal.submission_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {proposal.project_description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(proposal.id)}
                      className="px-4 py-2 bg-white hover:bg-gray-50 text-[#193869] border border-[#193869] rounded-lg font-medium text-sm transition-colors"
                    >
                      View Details
                    </button>
                    {proposal.status === 'submitted' && (
                      <>
                        <button
                          onClick={() => handleApprove(proposal.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRequestRevision(proposal.id)}
                          className="px-4 py-2 bg-[#d29538] hover:bg-[#b8802f] text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          Request Revision
                        </button>
                        <button
                          onClick={() => handleReject(proposal.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {showDetailModal && (
        <ProposalDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          proposal={selectedProposal}
        />
      )}

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setShowFeedbackModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#193869] to-[#234e92] p-6 relative flex-shrink-0">
                  <button
                    onClick={() => !submitting && setShowFeedbackModal(false)}
                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all"
                    disabled={submitting}
                  >
                    <X size={20} />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg backdrop-blur-sm ${
                      feedbackAction === 'approve' ? 'bg-green-500/20' : 
                      feedbackAction === 'reject' ? 'bg-red-500/20' : 
                      'bg-orange-500/20'
                    }`}>
                      {feedbackAction === 'approve' && <CheckCircle className="w-6 h-6 text-white" />}
                      {feedbackAction === 'reject' && <XCircle className="w-6 h-6 text-white" />}
                      {feedbackAction === 'revision' && <FileText className="w-6 h-6 text-white" />}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {feedbackAction === 'approve' && 'Approve Proposal'}
                        {feedbackAction === 'reject' && 'Reject Proposal'}
                        {feedbackAction === 'revision' && 'Request Revision'}
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">
                        {feedbackAction === 'approve' && 'Confirm approval for this proposal'}
                        {feedbackAction === 'reject' && 'Provide reason for rejection'}
                        {feedbackAction === 'revision' && 'Provide feedback for revision'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                  {selectedProposal && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedProposal.project_title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        by {selectedProposal.student_name}
                      </p>
                    </div>
                  )}

                  {feedbackAction === 'approve' ? (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-2">
                      <div className="flex items-start gap-3">
                         <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                         <p className="text-green-800 text-sm">
                           Are you sure you want to approve this proposal? The student will be notified immediately.
                         </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Feedback <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={6}
                        placeholder="Provide detailed feedback to the student (minimum 20 characters)..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent resize-none"
                      />
                      <div className="flex justify-between items-center mt-1">
                         <p className={`text-xs ${feedback.length < 20 ? 'text-red-500' : 'text-green-600'}`}>
                           {feedback.length} / 20 characters minimum
                         </p>
                         {feedback.length >= 20 && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowFeedbackModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={
                      feedbackAction === 'reject' ? 'danger' : 
                      feedbackAction === 'revision' ? 'secondary' : 
                      'primary'
                    }
                    onClick={handleSubmitAction}
                    disabled={submitting || (feedbackAction !== 'approve' && feedback.length < 20)}
                    className={feedbackAction === 'approve' ? '!bg-green-600 hover:!bg-green-700 text-white' : ''}
                  >
                    {submitting ? 'Processing...' : 'Confirm'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupervisorProposals;