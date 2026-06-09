import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Users } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { ROLES, DEPARTMENTS } from '../../utils/constants';

const BulkCreateUsersModal = ({ isOpen, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedRole, setSelectedRole] = useState('Student');
  const [defaultDepartment, setDefaultDepartment] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Handle file selection
  const handleFileChange = (file) => {
    setValidationError('');
    setPreviewData([]);
    setShowPreview(false);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setValidationError('Please upload a CSV file (.csv)');
      setSelectedFile(null);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('File size must be less than 5MB');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    validateAndPreviewCSV(file);
  };

  // Validate CSV content and show preview
  const validateAndPreviewCSV = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim() !== '');

        if (lines.length === 0) {
          setValidationError('CSV file is empty');
          setSelectedFile(null);
          return;
        }

        // Parse CSV lines
        const previewItems = [];
        const errors = [];
        const processedEmails = [];

        lines.forEach((line, index) => {
          const trimmedLine = line.trim().replace(/^"|"$/g, ''); // Remove quotes if present
          let email = '';
          let department = '';

          const parts = trimmedLine.split(',');
          email = parts[0].trim();
          
          if (parts.length >= 2) {
            department = parts[1].trim();
          } else {
            department = defaultDepartment;
          }

          if (parts.length > 2) {
            errors.push(`Line ${index + 1}: Invalid format. Expected: email OR email,department`);
            return;
          }

          // Validate email format
          if (!emailRegex.test(email)) {
            errors.push(`Line ${index + 1}: Invalid email format - "${email}"`);
            return;
          }

          // Check for duplicate emails in file
          if (processedEmails.includes(email.toLowerCase())) {
            errors.push(`Line ${index + 1}: Duplicate email - "${email}"`);
            return;
          }

          processedEmails.push(email.toLowerCase());
          
          const sap_id = email.split('@')[0];
          const username = sap_id;
          previewItems.push({ email, username, sap_id, department });
        });

        // If there are validation errors, show them
        if (errors.length > 0) {
          setValidationError(
            <div>
              <p className="font-semibold mb-2">CSV Validation Errors:</p>
              <ul className="list-disc pl-5 space-y-1">
                {errors.slice(0, 5).map((error, idx) => (
                  <li key={idx} className="text-sm">{error}</li>
                ))}
                {errors.length > 5 && (
                  <li className="text-sm font-semibold">...and {errors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          );
          setSelectedFile(null);
          return;
        }

        setPreviewData(previewItems);
        setShowPreview(true);
        setValidationError('');
      } catch (error) {
        setValidationError('Error reading CSV file. Please ensure it is properly formatted.');
        setSelectedFile(null);
      }
    };

    reader.onerror = () => {
      setValidationError('Error reading file. Please try again.');
      setSelectedFile(null);
    };

    reader.readAsText(file);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!selectedFile || previewData.length === 0) {
      setValidationError('Please upload a valid CSV file');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);
      formData.append('role', selectedRole);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/users/bulk-create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create users');
      }

      onSuccess(data);
      handleClose();
    } catch (error) {
      setValidationError(error.message || 'Failed to create users. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Reset form and close
  const handleClose = () => {
    setSelectedFile(null);
    setSelectedRole('Student');
    setDefaultDepartment('');
    setValidationError('');
    setPreviewData([]);
    setShowPreview(false);
    setDragActive(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Bulk Users"
      size="xl"
    >
      <div className="space-y-6">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            User Role <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
            disabled={uploading}
          >
            {Object.values(ROLES).map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            All users in the CSV will be assigned this role
          </p>
        </div>
        
        {/* Default Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Department (Optional)
          </label>
          <select
            value={defaultDepartment}
            onChange={(e) => {
              setDefaultDepartment(e.target.value);
              // Re-validate if file is already selected
              if (selectedFile) {
                setTimeout(() => validateAndPreviewCSV(selectedFile), 0);
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
            disabled={uploading}
          >
            <option value="">No Default Department</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            This will be applied if the CSV row only contains an email
          </p>
        </div>

        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload CSV File <span className="text-red-500">*</span>
          </label>
          
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-[#193869] bg-blue-50'
                : validationError
                ? 'border-red-300 bg-red-50'
                : selectedFile
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />

            {selectedFile && !validationError ? (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle className="text-green-600" size={48} />
                <div>
                  <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setPreviewData([]);
                    setShowPreview(false);
                  }}
                >
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className={validationError ? 'text-red-500' : 'text-gray-400'} size={48} />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Drop CSV file here or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    CSV file with email or email and department (email,department)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex gap-2">
              <FileText className="text-blue-600 flex-shrink-0" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">CSV File Requirements:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Format: <strong>email</strong> OR <strong>email,department</strong> (no header row)</li>
                  <li>One user per line</li>
                  <li>Example 1: <strong>student@example.com</strong></li>
                  <li>Example 2: <strong>teacher@example.com,Computer Science</strong></li>
                  <li>Username and SAPID will be extracted from text before "@"</li>
                  <li>Each user will receive a unique auto-generated password via email</li>
                  <li>Maximum file size: 5MB</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <div className="text-sm text-red-800">
                {validationError}
              </div>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {showPreview && previewData.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <Users size={18} />
                  Preview ({previewData.length} user{previewData.length !== 1 ? 's' : ''})
                </h4>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Username</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">SAP ID</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Department</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {previewData.slice(0, 10).map((user, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700">{user.username}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{user.sap_id}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{user.email}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{user.department || '-'}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {selectedRole}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {previewData.length > 10 && (
                    <tr>
                      <td colSpan={selectedRole === 'Teacher' ? "4" : "3"} className="px-4 py-2 text-sm text-gray-500 text-center italic">
                        ... and {previewData.length - 10} more users
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            loading={uploading}
            disabled={!selectedFile || !!validationError || previewData.length === 0}
          >
            {uploading ? 'Creating Users...' : `Create ${previewData.length} User${previewData.length !== 1 ? 's' : ''}`}
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkCreateUsersModal;
