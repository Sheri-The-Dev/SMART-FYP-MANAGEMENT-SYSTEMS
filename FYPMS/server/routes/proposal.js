const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');
const { authenticate, isAdmin, requireSupervisor } = require('../middleware/auth');
const { uploadProposalPDF } = require('../middleware/upload');
const { proposalValidation } = require('../middleware/proposalValidation');

// ============================================
// STUDENT ROUTES
// ============================================

// Create new proposal (draft)
router.post(
  '/create',
  authenticate,
  proposalValidation.create,
  proposalController.createProposal
);

// Get student's own proposals
router.get(
  '/my-proposals',
  authenticate,
  proposalController.getMyProposals
);

// Respond to group invitation (public endpoint)
router.get('/invitation/respond', proposalController.respondToInvitation);

// External: Submit without member (from rejection email)
router.get('/public/submit-without-member', proposalController.externalSubmitWithoutMember);

// Get single proposal details
router.get(
  '/:id',
  authenticate,
  proposalController.getProposalDetails
);

// Update proposal (draft or revision_requested only)
router.put(
  '/:id',
  authenticate,
  proposalValidation.update,
  proposalController.updateProposal
);

// Upload proposal PDF
router.post(
  '/:id/upload-pdf',
  authenticate,
  uploadProposalPDF.single('proposal_pdf'),
  proposalController.uploadProposalPDF
);

// Submit proposal to supervisor
router.post(
  '/:id/submit',
  authenticate,
  proposalController.submitProposal
);

// Delete proposal (draft only)
router.delete(
  '/:id',
  authenticate,
  proposalController.deleteProposal
);

// ============================================
// SUPERVISOR ROUTES
// ============================================

// Get proposals assigned to supervisor
router.get(
  '/supervisor/assigned',
  authenticate,
  requireSupervisor,
  proposalController.getSupervisorProposals
);

// Approve proposal
router.post(
  '/:id/approve',
  authenticate,
  requireSupervisor,
  proposalController.approveProposal
);

// Reject proposal
router.post(
  '/:id/reject',
  authenticate,
  requireSupervisor,
  proposalValidation.feedback,
  proposalController.rejectProposal
);

// Request revision
router.post(
  '/:id/request-revision',
  authenticate,
  requireSupervisor,
  proposalValidation.feedback,
  proposalController.requestRevision
);

// ============================================
// COMMON ROUTES
// ============================================

// Get available supervisors
router.get(
  '/supervisors/available',
  authenticate,
  proposalController.getAvailableSupervisors
);

// Download proposal template
router.get(
  '/templates/download',
  authenticate,
  proposalController.downloadTemplate
);

// Get current active template (NEW - for checking if template exists)
router.get(
  '/templates/current',
  authenticate,
  proposalController.getCurrentTemplate
);

// ============================================
// ADMIN ROUTES
// ============================================

// Upload proposal template
router.post(
  '/templates/upload',
  authenticate,
  isAdmin,
  uploadProposalPDF.single('template'),
  proposalController.uploadTemplate
);

// Delete proposal template
router.delete(
  '/templates/:id',
  authenticate,
  isAdmin,
  proposalController.deleteTemplate
);

// Get all proposals (admin)
router.get(
  '/admin/all',
  authenticate,
  isAdmin,
  proposalController.getAllProposals
);

// Get proposal analytics
router.get(
  '/admin/analytics',
  authenticate,
  isAdmin,
  proposalController.getProposalAnalytics
);

// Get proposal activity logs
router.get(
  '/admin/activity-logs/:proposalId',
  authenticate,
  isAdmin,
  proposalController.getProposalActivityLogs
);

// Delete proposal (admin full authority)
router.delete(
  '/admin/:id',
  authenticate,
  isAdmin,
  proposalController.adminDeleteProposal
);

module.exports = router;
