import React, { useState, useEffect } from 'react';
import { Download, FileText, AlertCircle, Info } from 'lucide-react';
import proposalService from '../../services/proposalService';

// ============================================
// TEMPLATE DOWNLOAD COMPONENT - FINAL FIX
// ============================================
// FIXED: Handles undefined responses from API interceptor
// FIXED: Better blob validation and error messages
// ============================================

const TemplateDownload = () => {
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    checkTemplateAvailability();
  }, []);

  const checkTemplateAvailability = async () => {
    try {
      setLoading(true);
      const response = await proposalService.getCurrentTemplate();
      const templateData = response.data || response;
      
      if (templateData) {
        setHasTemplate(true);
        setTemplateName(templateData.template_name || 'Proposal Template');
      } else {
        setHasTemplate(false);
      }
    } catch (err) {
      // 404 means no template exists
      if (err.response?.status === 404 || err.status === 404) {
        setHasTemplate(false);
      } else {
        console.error('Error checking template:', err);
        setHasTemplate(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);

      console.log('Starting template download...');
      const blob = await proposalService.downloadTemplate();
      
      console.log('Download response:', blob);
      console.log('Is Blob?', blob instanceof Blob);
      console.log('Blob type:', blob?.type);
      console.log('Blob size:', blob?.size);

      // Check if response exists
      if (!blob) {
        console.error('Response is null or undefined');
        throw new Error('No response received from server');
      }

      // Check if response is actually a Blob
      if (!(blob instanceof Blob)) {
        console.error('Response is not a Blob:', typeof blob, blob);
        throw new Error('Invalid response format from server');
      }

      // Check if blob is actually a PDF (not an error JSON response)
      if (blob.type === 'application/json') {
        // This means the server returned an error as JSON
        try {
          const text = await blob.text();
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Failed to download template');
        } catch (jsonError) {
          throw new Error('Server returned an error response');
        }
      }

      // Validate blob size
      if (blob.size === 0) {
        throw new Error('Template file is empty');
      }

      // Verify it's a PDF
      if (blob.type && blob.type !== 'application/pdf') {
        console.warn('Unexpected file type:', blob.type);
      }

      console.log('Creating download URL...');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${templateName}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      console.log('Download initiated successfully');

      // Cleanup
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
        console.log('Cleanup completed');
      }, 100);

    } catch (err) {
      console.error('Download error:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      if (err.response?.status === 404 || err.status === 404) {
        setError('Template not available. The admin may have removed it.');
        setHasTemplate(false);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to download template. Please try again.');
      }
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#193869]"></div>
          <span className="ml-3 text-sm text-gray-600">Checking template availability...</span>
        </div>
      </div>
    );
  }

  // No template available
  if (!hasTemplate) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              No Template Available Yet
            </h3>
            <p className="text-sm text-gray-600">
              The proposal template hasn't been uploaded by the admin yet. You can still create your proposal without it, or check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Template available
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-[#193869] rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {templateName}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Download the official template to help structure your proposal correctly.
          </p>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#193869] hover:bg-[#234e92] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Downloading...' : 'Download Template'}
          </button>

          {error && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateDownload;