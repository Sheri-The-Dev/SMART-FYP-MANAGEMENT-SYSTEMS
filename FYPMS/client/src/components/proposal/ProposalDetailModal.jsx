import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FileText, 
  Calendar, 
  User, 
  Users, 
  Mail, 
  Phone, 
  Download,
  Clock,
  CheckCircle,
  MessageSquare,
  Building,
  AlertCircle,
  ArrowRight,
  UserMinus,
  UserPlus
} from 'lucide-react';
import ProposalStatusBadge from './ProposalStatusBadge';
import FeedbackPanel from './FeedbackPanel';
import { useAuth } from '../../hooks/useAuth';
import proposalService from '../../services/proposalService';
import { useToast } from '../common/Toast';

const ProposalDetailModal = ({ isOpen, onClose, proposal, onEdit, onStatusUpdate }) => {
  const { user } = useAuth();
  const toast = useToast();
  const isLead = user?.id === proposal?.student_id;
  const isAcceptedMember = proposal?.members?.some(m => (m.sap_id === user?.sap_id || m.email === user?.email) && m.status === 'accepted');
  const canManage = isLead || isAcceptedMember;
  
  const hasRejections = proposal?.members?.some(m => m.status === 'rejected');
  const isPendingConfirmation = proposal?.status === 'pending_member_confirmation';

  useEffect(() => {
    if (!isOpen || !isPendingConfirmation) return;
    if (!onStatusUpdate) return;
    const intervalId = setInterval(() => {
      onStatusUpdate();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [isOpen, isPendingConfirmation, onStatusUpdate]);

  if (!proposal) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadPDF = async () => {
    try {
      if (proposal.proposal_pdf) {
        const link = document.createElement('a');
        link.href = `${import.meta.env.VITE_API_URL?.replace('/api', '')}${proposal.proposal_pdf}`;
        link.download = `Proposal_${proposal.id}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleRemoveRejectedAndProceed = async () => {
    try {
      // 1. Remove rejected members
      const remainingMembers = proposal.members.filter(m => m.status !== 'rejected');
      
      // 2. Update proposal with remaining members
      await proposalService.updateProposal(proposal.id, {
        ...proposal,
        members: remainingMembers.map(m => ({
          sap_id: m.sap_id,
          email: m.email,
          phone_number: m.phone_number,
          department: m.department
        }))
      });

      // 3. Submit proposal again
      await proposalService.submitProposal(proposal.id);
      
      toast.success('Rejected members removed and proposal submitted!');
      if (onStatusUpdate) onStatusUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to proceed after rejection:', error);
      toast.error('Failed to update proposal. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#193869] to-[#234e92] p-6 relative">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                <h2 className="text-2xl font-bold text-white pr-12 mb-3">
                  {proposal.project_title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                  <ProposalStatusBadge status={proposal.status} />
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    ID: #{proposal.id}
                  </span>
                  {proposal.submission_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(proposal.submission_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Student & Supervisor Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                    <div className="flex items-center gap-2 text-[#193869] font-semibold mb-3">
                      <User className="w-5 h-5 text-[#d29538]" />
                      <h3>Student</h3>
                    </div>
                    <p className="text-gray-900 font-medium mb-1">{proposal.student_name || 'N/A'}</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>SAP ID: {proposal.student_sap_id || proposal.sap_id || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{proposal.student_email || 'N/A'}</span>
                      </div>
                      {proposal.student_phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{proposal.student_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center gap-2 text-[#193869] font-semibold mb-3">
                      <User className="w-5 h-5 text-[#d29538]" />
                      <h3>Supervisor</h3>
                    </div>
                    <p className="text-gray-900 font-medium mb-1">{proposal.supervisor_name || 'Not Assigned'}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{proposal.supervisor_email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Description Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-[#193869] font-semibold mb-3">
                    <FileText className="w-5 h-5 text-[#d29538]" />
                    <h3>Project Description</h3>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {proposal.project_description}
                    </p>
                  </div>
                </div>

                {/* Status Specific Messages (Lead/Member Only) */}
                {isPendingConfirmation && canManage && (
                  <div className={`mb-6 p-5 rounded-xl border-2 ${hasRejections ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${hasRejections ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        <AlertCircle size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg ${hasRejections ? 'text-red-900' : 'text-yellow-900'} mb-1`}>
                          {hasRejections ? 'Member Invitation Rejected' : 'Waiting for Member Confirmation'}
                        </h3>
                        <p className={`text-sm ${hasRejections ? 'text-red-700' : 'text-yellow-700'} mb-4`}>
                          {hasRejections 
                            ? 'One or more members have rejected the group invitation. You can remove them and proceed with the remaining members, or edit the proposal to add new members.'
                            : 'This proposal is currently waiting for all group members to accept the invitation. It will be automatically submitted to the supervisor once everyone confirms.'}
                        </p>
                        
                        {hasRejections && (
                          <div className="flex flex-wrap gap-3">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleRemoveRejectedAndProceed}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                              <UserMinus size={18} />
                              Remove & Proceed
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                onEdit(proposal);
                                onClose();
                              }}
                              className="px-4 py-2 bg-white text-gray-700 border-2 border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              <UserPlus size={18} />
                              Add/Change Members
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Group Members Section */}
                {proposal.members && proposal.members.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-[#193869] font-semibold mb-3">
                      <Users className="w-5 h-5 text-[#d29538]" />
                      <h3>Group Members ({proposal.members.length})</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {proposal.members.map((member, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-[#193869] to-[#234e92] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-bold text-gray-900 truncate">{member.sap_id}</p>
                                {member.status && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    member.status === 'accepted' ? 'bg-green-100 text-green-700 border border-green-200' :
                                    member.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                                    'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                  }`}>
                                    {member.status}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Mail className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{member.email}</span>
                                </div>
                                {member.phone_number && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4 flex-shrink-0" />
                                    <span>{member.phone_number}</span>
                                  </div>
                                )}
                                {member.department && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Building className="w-4 h-4 flex-shrink-0" />
                                    <span>{member.department}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PDF Section */}
                {proposal.proposal_pdf && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-[#193869] font-semibold mb-3">
                      <FileText className="w-5 h-5 text-[#d29538]" />
                      <h3>Proposal Document</h3>
                    </div>
                    <div className="flex items-center justify-between p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-[#193869] to-[#234e92] rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Proposal_{proposal.id}.pdf</p>
                          <p className="text-sm text-gray-600">Click to download</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleDownloadPDF}
                        className="px-4 py-2 bg-gradient-to-r from-[#193869] to-[#234e92] text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Feedback Section */}
                {(proposal.supervisor_feedback || proposal.feedback) && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-[#193869] font-semibold mb-3">
                      <MessageSquare className="w-5 h-5 text-[#d29538]" />
                      <h3>Supervisor Feedback</h3>
                    </div>
                    <FeedbackPanel
                      feedback={proposal.supervisor_feedback || proposal.feedback}
                      supervisorName={proposal.supervisor_name}
                      responseDate={proposal.response_date}
                      status={proposal.status}
                    />
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <div className="flex items-center gap-2 text-[#193869] font-semibold mb-3">
                    <Clock className="w-5 h-5 text-[#d29538]" />
                    <h3>Timeline</h3>
                  </div>
                  <div className="space-y-3">
                    {proposal.created_at && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Proposal Created</p>
                          <p className="text-sm text-gray-600">{formatDate(proposal.created_at)}</p>
                        </div>
                      </div>
                    )}
                    
                    {proposal.submission_date && (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#193869] to-[#234e92] rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Submitted to Supervisor</p>
                          <p className="text-sm text-gray-600">{formatDate(proposal.submission_date)}</p>
                        </div>
                      </div>
                    )}

                    {proposal.response_date && (
                      <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                        proposal.status === 'approved' ? 'bg-green-50 border-green-200' :
                        proposal.status === 'rejected' ? 'bg-red-50 border-red-200' :
                        'bg-orange-50 border-orange-200'
                      }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          proposal.status === 'approved' ? 'bg-green-600' :
                          proposal.status === 'rejected' ? 'bg-red-600' :
                          'bg-orange-600'
                        }`}>
                          {proposal.status === 'approved' ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <X className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {proposal.status === 'approved' ? 'Approved' : 
                             proposal.status === 'rejected' ? 'Rejected' : 
                             'Revision Requested'}
                          </p>
                          <p className="text-sm text-gray-600">{formatDate(proposal.response_date)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Last updated: {formatDate(proposal.updated_at || proposal.created_at)}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#193869] to-[#234e92] text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProposalDetailModal;
