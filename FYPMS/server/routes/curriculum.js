const express = require('express');
const router = express.Router();
const curriculumController = require('../controllers/curriculumController');
const trackController = require('../controllers/trackController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadCSV, uploadPDF } = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

// ==============================
// BATCH MANAGEMENT (Admin Only)
// ==============================
router.post('/batches', authorize('Administrator'), curriculumController.createBatch);
router.get('/batches/my-batch', authenticate, curriculumController.getMyBatch);
router.get('/batches', authorize('Administrator', 'Committee', 'Coordinator'), curriculumController.getBatches);
router.put('/batches/:id/state', authorize('Administrator'), curriculumController.updateBatchState);
router.put('/batches/:id', authorize('Administrator'), curriculumController.updateBatch);
router.delete('/batches/:id', authorize('Administrator'), curriculumController.deleteBatch);
router.get('/batches/:id/checklist', authorize('Administrator'), curriculumController.getPreActivationChecklist);
router.get('/batches/:id/students', authorize('Administrator', 'Committee'), curriculumController.getBatchStudents);
router.post('/batches/enroll', authorize('Administrator'), uploadCSV.single('file'), curriculumController.enrollStudents);
router.post('/batches/transition', authorize('Administrator'), curriculumController.transitionBatch);

router.get('/batches/:id/flags', authorize('Administrator', 'Coordinator', 'Committee'), curriculumController.getTransitionFlags);
router.post('/batches/flags', authorize('Coordinator', 'Committee'), curriculumController.flagTransitionIssue);
router.put('/batches/flags/:flagId/resolve', authorize('Administrator', 'Coordinator', 'Committee'), curriculumController.resolveTransitionIssue);


// ==============================
// TRACK & TASK MANAGEMENT (Coordinator & Admin)
// ==============================
router.post('/tracks', authorize('Coordinator', 'Administrator', 'Committee'), trackController.createTrack);
router.get('/tracks', authorize('Coordinator', 'Administrator', 'Committee'), trackController.getTracks);
router.get('/tracks/my-tasks', authorize('Student'), trackController.getMyTasks);
router.post('/tracks/:trackId/clone', authorize('Coordinator', 'Administrator', 'Committee'), trackController.cloneTrack);
router.delete('/tracks/:trackId', authorize('Coordinator', 'Administrator', 'Committee'), trackController.deleteTrack);
router.put('/tracks/:trackId', authorize('Coordinator', 'Administrator', 'Committee'), trackController.updateTrack);
router.post('/tracks/:trackId/tasks', authorize('Coordinator', 'Administrator', 'Committee'), uploadPDF.single('template'), trackController.addTask);
router.get('/tracks/:trackId/tasks', authorize('Coordinator', 'Administrator', 'Committee', 'Student'), trackController.getTasks);
router.put('/tasks/:taskId', authorize('Coordinator', 'Administrator', 'Committee'), trackController.updateTask);
router.delete('/tasks/:taskId', authorize('Coordinator', 'Administrator', 'Committee'), trackController.deleteTask);
router.post('/tasks/:taskId/submit', authorize('Student'), uploadPDF.single('file'), trackController.submitTask);
router.post('/tasks/:taskId/release', authorize('Coordinator', 'Administrator', 'Committee'), trackController.releaseTask);
router.put('/batches/:batchId/track', authorize('Administrator'), trackController.assignTrackToBatch);
router.post('/batches/:batchId/extend', authorize('Administrator'), trackController.globalExtendDeadline);
router.post('/tasks/reopen', authorize('Coordinator', 'Administrator', 'Committee'), trackController.reopenGroupDeadline);

// ==============================
// COMPLIANCE & MONITORING
// ==============================
router.get('/compliance', authorize('Coordinator', 'Administrator', 'Committee'), curriculumController.getComplianceDashboard);

// Supervisor: view task submissions for their assigned groups
router.get('/tracks/my-groups-tasks', authorize('Teacher'), trackController.getSupervisorGroupTasks);

// Supervisor: Review Group Submissions (Milestone Evaluation)
router.get('/tracks/group-submissions-review', authorize('Teacher'), trackController.getGroupSubmissionsForReview);
router.post('/tasks/evaluate', authorize('Teacher'), trackController.evaluateSubmission);

module.exports = router;
