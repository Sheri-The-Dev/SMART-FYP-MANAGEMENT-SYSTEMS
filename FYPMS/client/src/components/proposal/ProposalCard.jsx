import React from 'react';
import { FileText, Calendar, User, Users, Eye, Edit, Trash2 } from 'lucide-react';
import ProposalStatusBadge from './ProposalStatusBadge';

// ============================================
// PROPOSAL CARD COMPONENT
// ============================================
// Displays proposal summary in card format
// Used in dashboard and list views
// ============================================

const ProposalCard = ({ proposal, onView, onEdit, onDelete, userRole = 'Student' }) => {
  const canEdit = proposal.status === 'draft' || proposal.status === 'revision_requested' || proposal.status === 'pending_member_confirmation';
  const canDelete = proposal.status === 'draft' || proposal.status === 'pending_member_confirmation';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 hover:border-[#193869] transition-all duration-300 overflow-hidden group">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#193869] to-[#234e92] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate mb-1">
              {proposal.project_title}
            </h3>
            <div className="flex items-center gap-2 text-blue-100 text-sm">
              <Calendar className="w-4 h-4" />
              <span>Created {formatDate(proposal.created_at)}</span>
            </div>
          </div>
          <ProposalStatusBadge status={proposal.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Description preview */}
        <p className="text-gray-600 text-sm line-clamp-2">
          {proposal.project_description}
        </p>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-200">
          {/* Supervisor */}
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-[#d29538]" />
            <div>
              <p className="text-gray-500 text-xs">Supervisor</p>
              <p className="font-medium text-gray-900 truncate">
                {proposal.supervisor_name || 'Not Selected'}
              </p>
            </div>
          </div>

          {/* Members */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-[#d29538]" />
            <div>
              <p className="text-gray-500 text-xs">Members</p>
              <p className="font-medium text-gray-900">
                {proposal.member_count || 0} {proposal.member_count === 1 ? 'Member' : 'Members'}
              </p>
            </div>
          </div>
        </div>

        {/* Submission info */}
        {proposal.submission_date && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Submitted on {formatDate(proposal.submission_date)}</span>
          </div>
        )}

        {/* PDF indicator */}
        {proposal.proposal_pdf && (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Uploaded</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
        {/* View button */}
        <button
          onClick={() => onView(proposal.id)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-[#193869] border border-[#193869] rounded-lg font-medium text-sm transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>

        {/* Edit button */}
        {userRole === 'Student' && canEdit && (
          <button
            onClick={() => onEdit(proposal.id)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#d29538] hover:bg-[#b8802f] text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        )}

        {/* Delete button */}
        {userRole === 'Student' && canDelete && (
          <button
            onClick={() => onDelete(proposal.id)}
            className="inline-flex items-center justify-center p-2 bg-white hover:bg-red-50 text-red-600 border border-red-300 rounded-lg transition-colors"
            title="Delete draft"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProposalCard;