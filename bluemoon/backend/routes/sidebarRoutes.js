// File: backend/routes/sidebarRoutes.js

const express = require('express');
const router = express.Router();
const sidebarController = require('../controllers/sidebarController');
const checkAuth = require('../middleware/checkAuth');

// GET /api/sidebar/badges - Lấy số lượng badge cho sidebar
router.get('/badges', checkAuth, sidebarController.getBadgeCounts);

// POST /api/sidebar/mark-fees-viewed - Đánh dấu đã xem trang Công nợ
router.post('/mark-fees-viewed', checkAuth, sidebarController.markFeesViewed);

module.exports = router;
