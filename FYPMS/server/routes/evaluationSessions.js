const express = require('express');
const router = express.Router();
const evaluationSessionController = require('../controllers/evaluationSessionController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Admin/Coordinator routes
router.get('/', 
  authorize('Administrator', 'Coordinator'), 
  evaluationSessionController.getAllEvaluationSessions
);

router.post('/', 
  authorize('Administrator', 'Coordinator'), 
  evaluationSessionController.createEvaluationSession
);

router.put('/:id', 
  authorize('Administrator', 'Coordinator'), 
  evaluationSessionController.updateEvaluationSession
);

router.delete('/:id', 
  authorize('Administrator', 'Coordinator'), 
  evaluationSessionController.deleteEvaluationSession
);

// Student route
router.get('/my-schedule', 
  authorize('Student'), 
  evaluationSessionController.getMyEvaluationSchedule
);

// Committee route
router.get('/committee-groups', 
  authorize('Committee'), 
  evaluationSessionController.getCommitteeAssignedGroups
);

module.exports = router;
