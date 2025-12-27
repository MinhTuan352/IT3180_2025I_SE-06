// File: backend/routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

router.use(checkAuth);

router.get('/bod', checkRole(['bod']), dashboardController.getBODStats);
router.get('/accountant', checkRole(['accountance', 'bod']), dashboardController.getAccountantStats);
router.get('/resident', checkRole(['resident']), dashboardController.getResidentStats);
router.get('/cqcn', checkRole(['cqcn', 'bod']), dashboardController.getCQCNStats);

module.exports = router;