import React from 'react';
import { CheckCircle, XCircle, Clock, FileEdit, FileClock, Users } from 'lucide-react';

// ============================================
// PROPOSAL STATUS BADGE COMPONENT
// ============================================
// Displays proposal status with appropriate colors and icons
// Uses project color scheme: #193869, #d29538, #234e92
// ============================================

const ProposalStatusBadge = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          icon: FileEdit,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300'
        };
      
      case 'submitted':
        return {
          label: 'Submitted',
          icon: FileClock,
          bgColor: 'bg-blue-50',
          textColor: 'text-[#193869]',
          borderColor: 'border-[#234e92]'
        };
      
      case 'approved':
        return {
          label: 'Approved',
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-300'
        };
      
      case 'rejected':
        return {
          label: 'Rejected',
          icon: XCircle,
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-300'
        };
      
      case 'revision_requested':
        return {
          label: 'Revision Required',
          icon: Clock,
          bgColor: 'bg-orange-50',
          textColor: 'text-[#d29538]',
          borderColor: 'border-[#d29538]'
        };
      
      case 'pending_member_confirmation':
        return {
          label: 'Pending Confirmation',
          icon: Users,
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-300'
        };
      
      default:
        return {
          label: status,
          icon: FileEdit,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  );
};

export default ProposalStatusBadge;