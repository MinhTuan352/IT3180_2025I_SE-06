// File: backend/routes/auditRoutes.js

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const checkAuth = require('../middleware/checkAuth');
const checkRole = require('../middleware/checkRole');

router.use(checkAuth);

// Chỉ Ban Quản Trị mới được xem nhật ký hệ thống
router.get('/', 
    checkRole(['bod']), 
    auditController.getSystemLogs
);

module.exports = router;