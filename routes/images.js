const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

// Upload profile image
router.post('/upload-profile', imageController.uploadProfileImage);

// Get image by filename
router.get('/:filename', imageController.getImage);

// Get user's profile image
router.get('/profile/:userId', imageController.getUserProfileImage);

// Delete image
router.delete('/:imageId', imageController.deleteImage);

module.exports = router;





