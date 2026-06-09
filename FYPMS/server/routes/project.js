const express = require('express');
const router = express.Router();
const {
  createProject,
  bulkImportProjects,
  searchProjects,
  getProjectDetails,
  updateProject,
  deleteProject,
  getProjectStats,
  getFilterOptions
} = require('../controllers/projectController');
const { authenticate, isAdmin } = require('../middleware/auth');

// ============================================
// PUBLIC/AUTHENTICATED ROUTES (All Roles)
// ============================================

// Search projects (accessible to all authenticated users)
router.get('/search', authenticate, searchProjects);

// Get project details (accessible to all authenticated users)
router.get('/:id', authenticate, getProjectDetails);

// Get filter options (accessible to all authenticated users)
router.get('/filters/options', authenticate, getFilterOptions);

// ============================================
// ADMIN-ONLY ROUTES
// ============================================

// Admin middleware for remaining routes
router.use(authenticate);
router.use(isAdmin);

// Create project
router.post('/', createProject);

// Bulk import projects
router.post('/bulk-import', bulkImportProjects);

// Update project
router.put('/:id', updateProject);

// Delete project
router.delete('/:id', deleteProject);

// Get statistics
router.get('/stats/overview', getProjectStats);

module.exports = router;
