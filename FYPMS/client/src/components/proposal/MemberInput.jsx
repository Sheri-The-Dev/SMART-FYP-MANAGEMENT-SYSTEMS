import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Input from '../common/Input';
import { useToast } from '../common/Toast';
import { checkUserExists } from '../../services/profileService';

// ============================================
// MEMBER INPUT COMPONENT
// ============================================
// Dynamic input fields for group members
// Allows adding/removing rows
// Adds Department Dropdown
// ============================================

const MemberInput = ({ members, onChange, errors = {}, departments = [], teamLeadSapId, teamLeadEmail, excludeProposalId }) => {
  const toast = useToast();
  const [sapIdRuntimeErrors, setSapIdRuntimeErrors] = useState({});
  const [emailRuntimeErrors, setEmailRuntimeErrors] = useState({});
  const [autoFilledIndices, setAutoFilledIndices] = useState(new Set());

  // Use a ref to store the current members to avoid stale closures in async validation
  const membersRef = useRef(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
  const normalizeSapId = (value) => String(value || '').trim();

  const hasDuplicateValue = (field, normalizedValue, currentIndex) => {
    if (!normalizedValue) return false;
    const currentMembers = membersRef.current;
    for (let i = 0; i < currentMembers.length; i++) {
      if (i === currentIndex) continue;
      const otherValue = field === 'email'
        ? normalizeEmail(currentMembers[i]?.email)
        : normalizeSapId(currentMembers[i]?.sap_id);
      if (otherValue && otherValue === normalizedValue) return true;
    }
    return false;
  };
  
  // Add new member row
  const handleAddMember = () => {
    onChange([
      ...members,
      { sap_id: '', email: '', phone_number: '', department: '' }
    ]);
  };

  // Remove member row
  const handleRemoveMember = (index) => {
    if (members.length === 1) {
      return; // Must have at least one member
    }
    const newMembers = members.filter((_, i) => i !== index);
    onChange(newMembers);

    // Update autoFilledIndices if needed
    const newAutoFilled = new Set();
    // We should probably re-map the indices, but let's keep it simple for now.
    // If you remove member 1, member 2 becomes member 1.
    // Let's just re-validate if needed or clear.
    setAutoFilledIndices(newAutoFilled);
  };

  // Update member field
  const handleMemberChange = (index, field, value) => {
    const newMembers = [...members];
    newMembers[index] = {
      ...newMembers[index],
      [field]: value
    };

    if (field === 'sap_id') {
      setSapIdRuntimeErrors((prev) => ({ ...prev, [index]: '' }));
    }

    if (field === 'email') {
      setEmailRuntimeErrors((prev) => ({ ...prev, [index]: '' }));
    }
    
    // If SAP ID is changed, clear previous auto-fill status and the fields
    if (field === 'sap_id') {
      setAutoFilledIndices(prev => {
        if (!prev.has(index)) return prev;
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      
      // Always clear email and phone when SAP ID changes to avoid mismatching data
      // from previous user or database load
      newMembers[index].email = '';
      newMembers[index].phone_number = '';
    }

    onChange(newMembers);
  };

  const validateSapId = async (index) => {
    // Always use the latest members from the ref to ensure we don't have stale data
    const currentMembers = membersRef.current;
    const member = currentMembers[index];
    if (!member) return;

    const sapId = normalizeSapId(member.sap_id);

    if (!sapId) {
      setSapIdRuntimeErrors((prev) => ({
        ...prev,
        [index]: ''
      }));
      return;
    }

    if (teamLeadSapId && sapId === normalizeSapId(teamLeadSapId)) {
      const message = 'Team Lead is automatically included. Do not add Team Lead as a group member.';
      setSapIdRuntimeErrors((prev) => ({ ...prev, [index]: message }));
      toast.error(message);
      return;
    }

    if (hasDuplicateValue('sap_id', sapId, index)) {
      const message = 'Duplicate SAP ID in group members';
      setSapIdRuntimeErrors((prev) => ({ ...prev, [index]: message }));
      toast.error(message);
      return;
    }

    try {
      setSapIdRuntimeErrors((prev) => ({
        ...prev,
        [index]: ''
      }));

      console.log(`🔍 Checking user for SAP ID: ${sapId}`);
      const response = await checkUserExists({ sap_id: sapId, exclude_proposal_id: excludeProposalId });
      console.log('📦 Lookup response:', response);

      if (!response?.success) {
        return;
      }

      if (response.exists) {
        // AUTO-FILL EMAIL and PHONE if provided
        if (response.email) {
          console.log(`✅ Auto-filling for index ${index}:`, { email: response.email, phone: response.phone });
          // Re-fetch latest members from ref in case it changed during async call
          const latestMembers = [...membersRef.current];
          latestMembers[index] = {
            ...latestMembers[index],
            email: response.email,
            phone_number: response.phone || latestMembers[index].phone_number || ''
          };
          onChange(latestMembers);
          
          // Mark as auto-filled and clear email errors
          setAutoFilledIndices(prev => new Set(prev).add(index));
          setEmailRuntimeErrors((prev) => ({ ...prev, [index]: '' }));
          toast.success(`Member details fetched for SAP ID: ${sapId}`);
        }

        if (!response.available) {
          const message = response.reason || 'User is already part of another proposal!';
          setSapIdRuntimeErrors((prev) => ({ ...prev, [index]: message }));
          toast.error(message);
          return;
        }

        // Clear error
        setSapIdRuntimeErrors((prev) => ({ ...prev, [index]: '' }));
      } else {
        const message = 'Enter correct SAP ID';
        setSapIdRuntimeErrors((prev) => ({
          ...prev,
          [index]: message
        }));
        toast.error(message);
      }
    } catch (error) {
      console.error('SAP ID validation error:', error);
      const message = error.message || 'Failed to verify SAP ID';
      setSapIdRuntimeErrors((prev) => ({
        ...prev,
        [index]: message
      }));
      toast.error(message);
    }
  };

  const validateEmail = async (index) => {
    // Always use the latest members from the ref
    const currentMembers = membersRef.current;
    const member = currentMembers[index];
    if (!member) return;

    const email = normalizeEmail(member.email);

    if (!email) {
      setEmailRuntimeErrors((prev) => ({
        ...prev,
        [index]: ''
      }));
      return;
    }

    if (teamLeadEmail && email === normalizeEmail(teamLeadEmail)) {
      const message = 'Team Lead is automatically included. Do not add Team Lead as a group member.';
      setEmailRuntimeErrors((prev) => ({ ...prev, [index]: message }));
      toast.error(message);
      return;
    }

    if (hasDuplicateValue('email', email, index)) {
      const message = 'Duplicate email in group members';
      setEmailRuntimeErrors((prev) => ({ ...prev, [index]: message }));
      toast.error(message);
      return;
    }

    try {
      setEmailRuntimeErrors((prev) => ({
        ...prev,
        [index]: ''
      }));

      const response = await checkUserExists({ email, exclude_proposal_id: excludeProposalId });

      if (!response?.success) {
        return;
      }

      if (!response.exists) {
        const message = 'Email does not exist in system';
        setEmailRuntimeErrors((prev) => ({
          ...prev,
          [index]: message
        }));
        toast.error(message);
      } else if (!response.available) {
        const message = response.reason || 'User is already part of another proposal!';
        setEmailRuntimeErrors((prev) => ({
          ...prev,
          [index]: message
        }));
        toast.error(message);
      }
    } catch (error) {
      console.error('Email validation error:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Group Members <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={handleAddMember}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-[#193869] hover:bg-[#234e92] rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      <div className="space-y-4">
        {members.map((member, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Member {index + 1}
              </h4>
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(index)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* SAP ID */}
              <div>
                <Input
                  label="SAP ID"
                  type="text"
                  value={member.sap_id}
                  onChange={(e) => handleMemberChange(index, 'sap_id', e.target.value)}
                  onBlur={() => validateSapId(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      validateSapId(index);
                    }
                  }}
                  placeholder="e.g., 12345"
                  required
                  error={errors[`members.${index}.sap_id`] || sapIdRuntimeErrors[index]}
                />
              </div>

              {/* Email */}
              <div>
                <Input
                  label="Email"
                  type="email"
                  value={member.email}
                  onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                  onBlur={() => validateEmail(index)}
                  placeholder="student@example.com"
                  required
                  error={errors[`members.${index}.email`] || emailRuntimeErrors[index]}
                  disabled={autoFilledIndices.has(index)}
                />
              </div>

              {/* Phone Number */}
              <div>
                <Input
                  label="Phone Number"
                  type="tel"
                  value={member.phone_number}
                  onChange={(e) => handleMemberChange(index, 'phone_number', e.target.value)}
                  placeholder="+92 300 1234567"
                  error={errors[`members.${index}.phone_number`]}
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={member.department || ''}
                  onChange={(e) => handleMemberChange(index, 'department', e.target.value)}
                  className={`
                    w-full px-4 py-3 rounded-lg border transition-all duration-200 bg-white
                    focus:outline-none focus:ring-2 focus:ring-[#193869] focus:border-[#193869]
                    ${errors[`members.${index}.department`] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
                  `}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                        {dept === 'All' ? 'All Departments' : dept}
                    </option>
                  ))}
                </select>
                {errors[`members.${index}.department`] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors[`members.${index}.department`]}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info message */}
      <p className="text-sm text-gray-500">
        You can add up to 10 group members. At least one member is required.
      </p>
    </div>
  );
};

export default MemberInput;
