// File: backend/routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const checkAuth = require('../middleware/checkAuth');

// BOD Dashboard stats
router.get('/bod', checkAuth, dashboardController.getBODStats);

// Accountant Dashboard stats
router.get('/accountant', checkAuth, dashboardController.getAccountantStats);

// Resident Dashboard stats
router.get('/resident', checkAuth, dashboardController.getResidentStats);

module.exports = router;
