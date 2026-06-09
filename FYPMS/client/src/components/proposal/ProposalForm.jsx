import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Send, Upload, CheckCircle, FileText, X, Users as UsersIcon, User as UserIcon } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import MemberInput from './MemberInput';
import SupervisorSelector from './SupervisorSelector';
import TemplateDownload from './TemplateDownload';
import proposalService from '../../services/proposalService';
import { useToast } from '../common/Toast';
import { getMyProfile } from '../../services/profileService';

import { useAuth } from '../../hooks/useAuth';

const ProposalForm = ({ isOpen, onClose, onSuccess, editProposal = null }) => {
  const isEditMode = !!editProposal;
  const toast = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    project_title: editProposal?.project_title || '',
    project_description: editProposal?.project_description || '',
    supervisor_id: editProposal?.supervisor_id || null,
    members: editProposal?.members || [{ sap_id: '', email: '', phone_number: '', department: '' }]
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [existingPdf, setExistingPdf] = useState(editProposal?.proposal_pdf || null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [leadProfile, setLeadProfile] = useState(null);
  
  // Standardized departments list
  const departments = [
    'Software Engineering',
    'Computer Science',
    'Cyber Security',
    'Artificial Intelligence',
    'Data Science'
  ];

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const response = await proposalService.getAvailableSupervisors();
        const data = response.data || response || [];
        if (Array.isArray(data)) {
          setSupervisors(data);
        }
      } catch (error) {
        console.error('Error fetching supervisors:', error);
      }
    };
    fetchSupervisors();
  }, []);

  useEffect(() => {
    const fetchLeadProfile = async () => {
      if (!isOpen) return;
      
      // If we are editing, we already have the Team Lead's data in editProposal
      if (isEditMode && editProposal) {
        setLeadProfile({
          sap_id: editProposal.student_sap_id || editProposal.sap_id,
          email: editProposal.student_email || editProposal.email,
          phone: editProposal.student_phone || editProposal.phone,
          department: editProposal.student_department || editProposal.department
        });
        return;
      }

      // If we are creating, fetch the current user's profile
      try {
        const response = await getMyProfile();
        const profileData = response.data || response;
        const actualProfile = profileData?.data || profileData || null;
        setLeadProfile(actualProfile);
      } catch (error) {
        console.error('Error fetching lead profile:', error);
        setLeadProfile(null);
      }
    };
    fetchLeadProfile();
  }, [isOpen, isEditMode, editProposal]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('PDF file size must be less than 10MB');
        return;
      }
      setPdfFile(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.project_title.trim()) {
      newErrors.project_title = 'Project title is required';
    } else if (formData.project_title.length < 10) {
      newErrors.project_title = 'Title must be at least 10 characters';
    } else if (formData.project_title.length > 500) {
      newErrors.project_title = 'Title must be less than 500 characters';
    } else if (!/^[a-zA-Z0-9\s\-:,.\(\)&]+$/.test(formData.project_title)) {
      newErrors.project_title = 'Title contains invalid characters';
    }

    if (!formData.project_description.trim()) {
      newErrors.project_description = 'Project description is required';
    } else if (formData.project_description.length < 50) {
      newErrors.project_description = 'Description must be at least 50 characters';
    } else if (formData.project_description.length > 5000) {
      newErrors.project_description = 'Description must be less than 5000 characters';
    }

    formData.members.forEach((member, index) => {
      if (!member.sap_id.trim()) {
        newErrors[`members.${index}.sap_id`] = 'SAP ID is required';
      }
      if (!member.email.trim()) {
        newErrors[`members.${index}.email`] = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
        newErrors[`members.${index}.email`] = 'Invalid email format';
      }
      if (!member.department) {
        newErrors[`members.${index}.department`] = 'Department is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    try {
      setLoading(true);

      if (isEditMode) {
        await proposalService.updateProposal(editProposal.id, formData);
        
        if (pdfFile) {
          setUploadingPdf(true);
          await proposalService.uploadProposalPDF(editProposal.id, pdfFile);
          setUploadingPdf(false);
        }

        toast.success('Proposal updated successfully');
      } else {
        const response = await proposalService.createProposal(formData);
        const proposalId = response.id || response.data?.id;

        if (pdfFile && proposalId) {
          setUploadingPdf(true);
          await proposalService.uploadProposalPDF(proposalId, pdfFile);
          setUploadingPdf(false);
        }

        toast.success('Proposal draft created successfully');
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Save draft error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save proposal';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    if (!formData.supervisor_id) {
      toast.error('Please select a supervisor before submitting');
      return;
    }

    if (!existingPdf && !pdfFile) {
      toast.error('Please upload proposal PDF before submitting');
      return;
    }

    try {
      setLoading(true);

      let proposalId = editProposal?.id;

      if (!isEditMode) {
        const response = await proposalService.createProposal(formData);
        proposalId = response.data?.id || response.id;
      } else {
        await proposalService.updateProposal(proposalId, formData);
      }

      if (pdfFile) {
        setUploadingPdf(true);
        await proposalService.uploadProposalPDF(proposalId, pdfFile);
        setUploadingPdf(false);
      }

      await proposalService.submitProposal(proposalId);

      const isPendingConfirmation = formData.members && formData.members.length > 0;
      toast.success(
        isPendingConfirmation 
          ? 'Proposal saved successfully. Waiting for group members confirmation.'
          : 'Proposal submitted successfully!'
      );

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Submit proposal error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to submit proposal';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setUploadingPdf(false);
    }
  };

  const handleClose = () => {
    if (loading || uploadingPdf) return;
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
    >
      {/* Custom Header with Gradient */}
      <div className="bg-gradient-to-r from-[#193869] to-[#234e92] -m-6 mb-6 p-6 rounded-t-xl">
        <h2 className="text-2xl font-bold text-white mb-1">
          {isEditMode ? 'Edit Proposal' : 'Create New Proposal'}
        </h2>
        <p className="text-blue-100 text-sm">
          Fill in all required fields to {isEditMode ? 'update' : 'create'} your proposal
        </p>
      </div>

      <div className="space-y-6">
        {/* Template Download */}
        {!isEditMode && <TemplateDownload />}

        {/* Project Title */}
        <div>
          <Input
            label="Project Title"
            type="text"
            value={formData.project_title}
            onChange={(e) => handleInputChange('project_title', e.target.value)}
            placeholder="Enter your project title (minimum 10 characters)"
            required
            error={errors.project_title}
            maxLength={500}
            icon={<FileText size={20} />}
            disabled={loading || uploadingPdf}
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.project_title.length}/500 characters
          </p>
        </div>

        {/* Project Description */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileText size={18} />
            Project Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.project_description}
            onChange={(e) => handleInputChange('project_description', e.target.value)}
            placeholder="Describe your project in detail (minimum 50 characters)"
            rows={6}
            maxLength={5000}
            disabled={loading || uploadingPdf}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent transition-all resize-none disabled:bg-gray-100 ${
              errors.project_description ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.project_description && (
            <p className="mt-1 text-sm text-red-600">{errors.project_description}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.project_description.length}/5000 characters
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700 mb-4">
            <div className="flex items-center gap-2">
              <UserIcon size={18} />
              <span>Team Lead Details</span>
            </div>
            {isEditMode && (
              <span className="px-2 py-0.5 bg-blue-100 text-[#193869] text-[10px] rounded-full uppercase font-bold tracking-wider">
                Original Creator
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="SAP ID"
              type="text"
              name="lead_sap_id"
              value={leadProfile?.sap_id || user?.sap_id || ''}
              disabled
            />
            <Input
              label="Email"
              type="email"
              name="lead_email"
              value={leadProfile?.email || user?.email || ''}
              disabled
            />
            <Input
              label="Phone"
              type="tel"
              name="lead_phone"
              value={leadProfile?.phone || ''}
              disabled
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={leadProfile?.department || ''}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed transition-all duration-200"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                      {dept === 'All' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Group Members */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <UsersIcon size={18} />
            <span>Group Members</span>
          </div>
          <MemberInput
            members={formData.members}
            onChange={(members) => handleInputChange('members', members)}
            errors={errors}
            disabled={loading || uploadingPdf}
            departments={departments}
            teamLeadSapId={user?.sap_id}
            teamLeadEmail={user?.email}
            excludeProposalId={editProposal?.id}
          />
        </div>

        {/* Supervisor Selection */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <UserIcon size={18} />
            <span>Select Supervisor</span>
          </div>
          <SupervisorSelector
            value={formData.supervisor_id}
            onChange={(supervisorId) => handleInputChange('supervisor_id', supervisorId)}
            error={errors.supervisor_id}
            disabled={loading || uploadingPdf}
            supervisors={supervisors}
            departments={departments}
          />
        </div>

        {/* PDF Upload */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <FileText size={18} />
            Proposal Document (PDF) <span className="text-red-500">*</span>
          </label>

          {existingPdf && !pdfFile && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
            >
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-green-800 font-semibold">PDF already uploaded</p>
                <p className="text-xs text-green-700">You can upload a new file to replace it</p>
              </div>
            </motion.div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
            {pdfFile ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3"
              >
                <FileText className="w-12 h-12 text-[#193869] mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{pdfFile.name}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPdfFile(null)}
                  disabled={loading || uploadingPdf}
                  className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  Remove File
                </button>
              </motion.div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {existingPdf ? 'Upload new PDF to replace existing' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500 mb-4">PDF file (Maximum 10MB)</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfChange}
                  disabled={loading || uploadingPdf}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#193869] to-[#234e92] text-white rounded-lg cursor-pointer transition-all font-medium hover:shadow-lg ${
                    (loading || uploadingPdf) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  Choose PDF File
                </label>
              </>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-[#193869] rounded-lg p-5">
          <h4 className="font-bold text-[#193869] mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Before Submitting:
          </h4>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-[#193869] font-bold mt-0.5">•</span>
              <span>All fields must be filled correctly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#193869] font-bold mt-0.5">•</span>
              <span>At least one group member is required</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#193869] font-bold mt-0.5">•</span>
              <span>A supervisor must be selected</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#193869] font-bold mt-0.5">•</span>
              <span>Proposal PDF must be uploaded</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#193869] font-bold mt-0.5">•</span>
              <span>You can save as draft and submit later</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading || uploadingPdf}
            fullWidth
          >
            Cancel
          </Button>

          <Button
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={loading || uploadingPdf}
            icon={<Save className="w-5 h-5" />}
            loading={loading && !uploadingPdf}
            fullWidth
          >
            {uploadingPdf ? 'Uploading...' : 'Save Draft'}
          </Button>

          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || uploadingPdf}
            icon={<Send className="w-5 h-5" />}
            loading={loading}
            fullWidth
          >
            {uploadingPdf ? 'Uploading...' : 'Submit Proposal'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProposalForm;
