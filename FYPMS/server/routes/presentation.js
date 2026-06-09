const express = require('express');
const router = express.Router();
const presentationController = require('../controllers/presentationController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Coordinator/Admin/Committee routes
router.post('/', authorize('Coordinator', 'Administrator', 'Committee'), presentationController.createPresentation);
router.get('/', authorize('Coordinator', 'Administrator', 'Committee'), presentationController.getPresentations);
router.get('/unscheduled-groups', authorize('Coordinator', 'Administrator', 'Committee'), presentationController.getUnscheduledGroups);
router.put('/:id', authorize('Coordinator', 'Administrator', 'Committee'), presentationController.updatePresentation);
router.delete('/:id', authorize('Coordinator', 'Administrator', 'Committee'), presentationController.deletePresentation);

// Report Generation
router.get('/report/export', authorize('Coordinator', 'Administrator'), presentationController.exportPresentationsReport);

// Panelist (Faculty) View
router.get('/my-evaluations', authorize('Teacher', 'Committee', 'Coordinator', 'Administrator'), presentationController.getPendingEvaluations);
router.post('/evaluate', authorize('Teacher', 'Committee', 'Coordinator', 'Administrator'), presentationController.submitEvaluation);

// Student View
router.get('/my-result', authorize('Student'), presentationController.getMyResult);

module.exports = router;
