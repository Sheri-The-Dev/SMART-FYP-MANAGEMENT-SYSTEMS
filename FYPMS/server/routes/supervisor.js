const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const marksController = require('../controllers/marksController');

// All supervisor routes require authentication
router.use(authenticate);

// Module 11: Supervisor Marks Entry endpoints
router.post('/marks-entry/save', authorize('Teacher'), marksController.upsertMarks);
router.get('/marks-entry/:batch_id/:student_sap_id', authorize('Teacher'), marksController.getStudentMarksRecord);
router.get('/marks-entry/:batch_id', authorize('Teacher'), marksController.getSupervisorStudentsForMarks);

// Module 10: Grade Summary (Admin / Coordinator)
router.get('/grade-summary/:batchId', authorize('Administrator', 'Committee', 'Coordinator'), marksController.getGradeSummary);

module.exports = router;
