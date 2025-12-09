// File: backend/routes/buildingRoutes.js

const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/buildingController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

// Public routes - Ai cũng xem được thông tin tòa nhà
router.get('/info', buildingController.getBuildingInfo);
router.get('/regulations', buildingController.getRegulations);

// Protected routes - Chỉ BOD mới được sửa
router.put('/info', checkAuth, checkRole(['bod']), buildingController.updateBuildingInfo);
router.post('/regulations', checkAuth, checkRole(['bod']), buildingController.createRegulation);
router.put('/regulations/:id', checkAuth, checkRole(['bod']), buildingController.updateRegulation);
router.delete('/regulations/:id', checkAuth, checkRole(['bod']), buildingController.deleteRegulation);

module.exports = router;
