const express = require('express');
const router = express.Router();
const studentFeesController = require('../controllers/studentFeesController');

// Upload CSV file
router.post('/upload-csv', studentFeesController.uploadCSV);

// Get all student fees data with filters and pagination
router.get('/', studentFeesController.getStudentFees);

// Get dashboard summary
router.get('/dashboard-summary', studentFeesController.getDashboardSummary);

// Get student by registration number
router.get('/student/:regNumber', studentFeesController.getStudentByRegNumber);

// Update student payment status
router.put('/student/:regNumber/payment-status', studentFeesController.updatePaymentStatus);

module.exports = router;





