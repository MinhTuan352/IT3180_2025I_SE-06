// File: backend/routes/chatbotRoutes.js

const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const checkAuth = require('../middleware/checkAuth');

// GET /api/chatbot/context - Lấy context cho chatbot
router.get('/context', checkAuth, chatbotController.getUserContext);

module.exports = router;
