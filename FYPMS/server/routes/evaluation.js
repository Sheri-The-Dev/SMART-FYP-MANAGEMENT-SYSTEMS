const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const evalController = require('../controllers/evaluationController');

router.use(authenticate);

// Committee Evaluation Routes
router.get('/committee/my-groups', authorize('Committee'), evalController.getMyAssignedGroups);
router.post('/committee/submit', authorize('Committee'), evalController.submitCommitteeMarks);

// Grade Summary & Result Release
router.get('/grades/summary', authorize('Administrator', 'Coordinator'), evalController.getGradeSummary);
router.post('/grades/release', authorize('Coordinator'), evalController.releaseResults);

// Student Result
router.get('/grades/my-result', authorize('Student'), evalController.getMyGrade);

module.exports = router;
