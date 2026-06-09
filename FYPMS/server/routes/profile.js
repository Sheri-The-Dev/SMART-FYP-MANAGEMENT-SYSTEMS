const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { validationRules, validate } = require('../middleware/validation');
const {
  getMyProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  checkUserExists,
  getMyResult
} = require('../controllers/profileController');

// Get current user profile
router.get('/', authenticate, getMyProfile);

// Check user existence
router.get('/lookup-user', authenticate, checkUserExists);

// Update profile
router.put('/', authenticate, validationRules.updateProfile, validate, updateProfile);

// Upload profile picture
router.post(
  '/picture',
  authenticate,
  upload.single('profile_picture'),
  handleUploadError,
  uploadProfilePicture
);

// Delete profile picture
router.delete('/picture', authenticate, deleteProfilePicture);

// Get student result (Module 10)
router.get('/my-result', authenticate, getMyResult);

module.exports = router;
