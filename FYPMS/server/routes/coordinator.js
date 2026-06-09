const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const evalController = require('../controllers/evaluationController');

// All coordinator routes require authentication and Coordinator role
router.use(authenticate);
router.use(authorize('Coordinator'));

// Create Evaluation Session
router.post('/create-session', evalController.createSession);

module.exports = router;
