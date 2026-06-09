import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, AlertCircle } from 'lucide-react';
import { useToast } from '../common/Toast';
import Input from '../common/Input';
import Button from '../common/Button';
import { createProject, updateProject, validateProjectData } from '../../services/projectService';

const ProjectUploadModal = ({ isOpen, onClose, onSuccess, editProject = null }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    year: new Date().getFullYear(),
    abstract: '',
    department: '',
    supervisor_name: '',
    supervisor_id: '',
    technology_type: '',
    final_grade: '',
    keywords: '',
    student_names: ''
  });

  // Update form data when editProject changes
  useEffect(() => {
    if (editProject) {
      setFormData({
        title: editProject.title || '',
        year: editProject.year || new Date().getFullYear(),
        abstract: editProject.abstract || '',
        department: editProject.department || '',
        supervisor_name: editProject.supervisor_name || '',
        supervisor_id: editProject.supervisor_id || '',
        technology_type: editProject.technology_type || '',
        final_grade: editProject.final_grade || '',
        keywords: editProject.keywords || '',
        student_names: editProject.student_names || ''
      });
      setErrors({});
    } else {
      // Reset form for new project
      setFormData({
        title: '',
        year: new Date().getFullYear(),
        abstract: '',
        department: '',
        supervisor_name: '',
        supervisor_id: '',
        technology_type: '',
        final_grade: '',
        keywords: '',
        student_names: ''
      });
      setErrors({});
    }
  }, [editProject, isOpen]); // Re-run when editProject or isOpen changes

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const validation = validateProjectData(formData);
    if (!validation.isValid) {
      const newErrors = {};
      validation.errors.forEach(error => {
        const field = error.toLowerCase().split(' ')[0];
        newErrors[field] = error;
      });
      setErrors(newErrors);
      showToast('Please fix the validation errors', 'error');
      return;
    }

    setLoading(true);
    try {
      // Clean up data: convert empty strings to null for optional fields
      const cleanedData = {
        ...formData,
        supervisor_id: formData.supervisor_id?.trim() || null,
        technology_type: formData.technology_type?.trim() || null,
        final_grade: formData.final_grade?.trim() || null,
        keywords: formData.keywords?.trim() || null,
        student_names: formData.student_names?.trim() || null
      };

      if (editProject) {
        await updateProject(editProject.id, cleanedData);
        showToast('Project updated successfully', 'success');
      } else {
        await createProject(cleanedData);
        showToast('Project created successfully', 'success');
      }
      onSuccess();
      onClose();
    } catch (error) {
      showToast(error.message || 'Failed to save project', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      year: new Date().getFullYear(),
      abstract: '',
      department: '',
      supervisor_name: '',
      supervisor_id: '',
      technology_type: '',
      final_grade: '',
      keywords: '',
      student_names: ''
    });
    setErrors({});
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

                <div className="flex items-center gap-3">
                  <Upload className="w-6 h-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">
                    {editProject ? 'Edit Project' : 'Add New Project'}
                  </h2>
                </div>
                <p className="text-white/80 mt-2">
                  {editProject ? 'Update project information' : 'Enter the details of the archived project'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter project title..."
                      error={errors.title}
                    />
                  </div>

                  {/* Year and Department */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        min="2000"
                        max="2100"
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        error={errors.year}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
                      >
                        <option value="">Select Department</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Software Engineering">Software Engineering</option>
                        <option value="Computer Engineering">Computer Engineering</option>
                        <option value="Electrical Engineering">Electrical Engineering</option>
                        <option value="Information Technology">Information Technology</option>
                      </select>
                      {errors.department && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.department}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Abstract */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Abstract <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.abstract}
                      onChange={(e) => handleInputChange('abstract', e.target.value)}
                      placeholder="Enter project abstract (minimum 50 characters)..."
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent resize-none"
                    />
                    <div className="flex justify-between items-center mt-1">
                      {errors.abstract && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.abstract}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 ml-auto">
                        {formData.abstract.length} characters
                      </p>
                    </div>
                  </div>

                  {/* Supervisor Name and ID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supervisor Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formData.supervisor_name}
                        onChange={(e) => handleInputChange('supervisor_name', e.target.value)}
                        placeholder="Dr. John Doe"
                        error={errors.supervisor_name}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supervisor ID (Optional)
                      </label>
                      <Input
                        type="number"
                        value={formData.supervisor_id}
                        onChange={(e) => handleInputChange('supervisor_id', e.target.value)}
                        placeholder="Enter user ID if exists"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Must be a valid user ID from the users table. Leave empty if not linked to a user account.
                      </p>
                    </div>
                  </div>

                  {/* Technology and Grade */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Technology Type (Optional)
                      </label>
                      <Input
                        type="text"
                        value={formData.technology_type}
                        onChange={(e) => handleInputChange('technology_type', e.target.value)}
                        placeholder="e.g., Machine Learning, Web Development"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Final Grade (Optional)
                      </label>
                      <select
                        value={formData.final_grade}
                        onChange={(e) => handleInputChange('final_grade', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#193869] focus:border-transparent"
                      >
                        <option value="">Select Grade</option>
                        <option value="A+">A+</option>
                        <option value="A">A</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B">B</option>
                        <option value="B-">B-</option>
                        <option value="C+">C+</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="F">F</option>
                      </select>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keywords (Optional)
                    </label>
                    <Input
                      type="text"
                      value={formData.keywords}
                      onChange={(e) => handleInputChange('keywords', e.target.value)}
                      placeholder="Comma-separated keywords (e.g., AI, Machine Learning, Python)"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Separate multiple keywords with commas
                    </p>
                  </div>

                  {/* Student Names */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student Names (Optional)
                    </label>
                    <Input
                      type="text"
                      value={formData.student_names}
                      onChange={(e) => handleInputChange('student_names', e.target.value)}
                      placeholder="Comma-separated names (e.g., John Doe, Jane Smith)"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Separate multiple student names with commas
                    </p>
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleReset}
                  disabled={loading}
                  className="flex-1"
                >
                  Reset Form
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  loading={loading}
                  className="flex-1"
                >
                  {editProject ? 'Update Project' : 'Add Project'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProjectUploadModal;