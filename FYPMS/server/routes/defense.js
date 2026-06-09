const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { uploadDefense } = require('../middleware/upload');
const { submitDefense, getMyDefenseSchedule } = require('../controllers/defenseController');
const { submitEvaluation, getScheduledDefenses } = require('../controllers/defenseEvaluationController');

// Student: check if their proposal is scheduled for defense
router.get('/my-schedule',
    authenticate,
    authorize('Student'),
    getMyDefenseSchedule
);

// Student: submit defense file (PDF or PPTX)
router.post('/submit',
    authenticate,
    authorize('Student'),
    uploadDefense.single('file'),
    submitDefense
);

// Teacher/Admin: get presentations scheduled for today and upcoming
router.get('/scheduled',
    authenticate,
    authorize('Teacher', 'Administrator'),
    getScheduledDefenses
);

// Teacher/Admin: submit evaluation for a presentation
router.post('/evaluate',
    authenticate,
    authorize('Teacher', 'Administrator'),
    submitEvaluation
);

module.exports = router;