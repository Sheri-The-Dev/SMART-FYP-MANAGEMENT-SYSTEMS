import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { useToast } from '../common/Toast';
import Button from '../common/Button';
import { bulkImportProjects, parseCSVFile } from '../../services/projectService';

const BulkImportModal = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResults, setImportResults] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['.csv', 'text/csv', 'application/vnd.ms-excel'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (fileExtension !== 'csv' && !validTypes.includes(file.type)) {
        showToast('Please select a CSV file', 'error');
        return;
      }

      setSelectedFile(file);
      setImportResults(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      showToast('Please select a file first', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Parse CSV file
      const projects = await parseCSVFile(selectedFile);
      
      if (projects.length === 0) {
        showToast('No valid projects found in file', 'error');
        setLoading(false);
        return;
      }

      console.log(`📤 Uploading ${projects.length} projects...`);

      // Import projects - this returns the full axios response
      const response = await bulkImportProjects(projects);
      
      console.log('✅ Bulk import response received:', response);
      
      // ============================================
      // FIXED: Correct response structure handling
      // Backend returns: { success: true, message: "...", data: { total, successful, failed, errors } }
      // projectService.js extracts response.data which contains the full response object
      // So response = { success: true, message: "...", data: { ... } }
      // ============================================
      
      // Check if response is valid
      if (!response) {
        throw new Error('No response received from server');
      }

      // Check for success flag
      if (!response.success) {
        throw new Error(response.message || 'Server returned error status');
      }
      
      // Extract the actual results - response.data contains the results
      const results = response.data;
      
      if (!results) {
        console.error('Response structure:', response);
        throw new Error('Invalid response structure from server');
      }
      
      // Validate that results has the required fields
      if (typeof results.total === 'undefined' || 
          typeof results.successful === 'undefined' || 
          typeof results.failed === 'undefined') {
        console.error('Missing required fields in results:', results);
        console.error('Full response:', response);
        throw new Error('Invalid data structure in server response');
      }
      
      console.log(`📊 Import results: ${results.successful}/${results.total} successful, ${results.failed} failed`);
      
      // Set results for display
      setImportResults(results);
      
      // Show appropriate notifications
      if (results.successful > 0) {
        showToast(
          `Successfully imported ${results.successful} of ${results.total} project(s)`,
          'success'
        );
        
        // ============================================
        // CRITICAL: Call onSuccess to trigger refresh
        // This will update the project list in real-time
        // ============================================
        onSuccess();
      }
      
      if (results.failed > 0) {
        showToast(
          `${results.failed} project(s) failed to import. Check details below.`,
          'warning'
        );
      }
      
      // If no projects were imported at all
      if (results.successful === 0 && results.total > 0) {
        showToast('No projects were imported successfully', 'error');
      }
      
    } catch (error) {
      console.error('❌ Bulk import error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      
      // Better error messaging
      let errorMessage = 'Failed to import projects';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = `title,year,abstract,department,supervisor_name,supervisor_id,technology_type,final_grade,keywords,student_names
"AI-Powered Healthcare System",2024,"This project develops an artificial intelligence system for medical diagnosis and patient care using deep learning algorithms and neural networks. The system can analyze medical images and provide diagnostic recommendations.",Computer Science,"Dr. Sarah Johnson",,Artificial Intelligence,A+,"AI, Healthcare, Deep Learning, Medical Diagnosis","John Doe, Jane Smith"
"Smart Campus IoT Platform",2024,"Implementation of comprehensive IoT infrastructure for smart campus management including automated lighting, climate control, security systems, and resource monitoring using wireless sensor networks.",Computer Engineering,"Prof. Michael Chen",,Internet of Things,A,"IoT, Smart Campus, Automation, Wireless Networks","Ahmed Ali, Fatima Khan"
"E-Commerce Web Application",2023,"Full-stack e-commerce platform with payment integration, inventory management, user authentication, and real-time order tracking built using modern web technologies.",Software Engineering,"Dr. Emily Rodriguez",,Web Development,A-,"E-Commerce, Full Stack, Payment Integration, Web Application","Sarah Williams, Tom Brown"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'project_import_template.csv';
    link.click();
    
    showToast('Template downloaded successfully', 'success');
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
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
            onClick={handleClose}
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#193869] to-[#234e92] p-6 relative">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">
                    Bulk Import Projects
                  </h2>
                </div>
                <p className="text-white/80 mt-2">
                  Upload a CSV file to import multiple projects at once
                </p>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
                {/* Download Template Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-1">
                        Before You Start
                      </h3>
                      <p className="text-sm text-blue-800 mb-3">
                        Download the CSV template and fill it with your project data. 
                        Make sure all required fields (title, year, abstract, department, supervisor_name) are filled.
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleDownloadTemplate}
                        className="inline-flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download CSV Template
                      </Button>
                    </div>
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select CSV File
                  </label>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#193869] transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    
                    {selectedFile ? (
                      <div className="space-y-3">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose Different File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
                          <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer text-[#193869] font-medium hover:text-[#234e92]"
                          >
                            Click to upload
                          </label>
                          <span className="text-gray-500"> or drag and drop</span>
                        </div>
                        <p className="text-xs text-gray-500">CSV files only</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Import Results */}
                {importResults && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Import Results</h3>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-gray-900">{importResults.total}</p>
                        <p className="text-sm text-gray-600">Total</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">{importResults.successful}</p>
                        <p className="text-sm text-gray-600">Success</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-600">{importResults.failed}</p>
                        <p className="text-sm text-gray-600">Failed</p>
                      </div>
                    </div>

                    {/* Error List */}
                    {importResults.errors && importResults.errors.length > 0 && (
                      <div className="bg-white rounded-lg p-3 max-h-48 overflow-y-auto">
                        <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Errors Found
                        </h4>
                        <ul className="space-y-2">
                          {importResults.errors.map((error, index) => (
                            <li key={index} className="text-sm">
                              <span className="font-medium">Row {error.row}:</span>{' '}
                              <span className="text-gray-600">{error.title}</span> - 
                              <span className="text-red-600"> {error.error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Required Fields Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Required CSV Columns</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>â€¢ <span className="font-medium">title</span> - Project title (minimum 5 characters)</li>
                    <li>â€¢ <span className="font-medium">year</span> - Project year (4-digit number)</li>
                    <li>â€¢ <span className="font-medium">abstract</span> - Project abstract (minimum 50 characters)</li>
                    <li>â€¢ <span className="font-medium">department</span> - Department name</li>
                    <li>â€¢ <span className="font-medium">supervisor_name</span> - Supervisor's name</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-3">
                    Optional columns: supervisor_id, technology_type, final_grade, keywords, student_names
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleImport}
                  loading={loading}
                  disabled={!selectedFile}
                  className="flex-1"
                >
                  Import Projects
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BulkImportModal;