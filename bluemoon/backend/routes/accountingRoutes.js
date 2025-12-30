// File: backend/routes/accountingRoutes.js
// Routes cho Quản lý Kế toán

const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const checkAuth = require('../middleware/checkAuth');

// Áp dụng middleware auth cho tất cả routes
router.use(checkAuth);

// ==========================================
// ACCOUNTING TASKS ROUTES
// ==========================================

// GET /api/accounting/tasks/stats - Thống kê (đặt trước :id để không bị conflict)
router.get('/tasks/stats', accountingController.getTaskStats);

// GET /api/accounting/tasks - Lấy danh sách công việc
router.get('/tasks', accountingController.getAllTasks);

// GET /api/accounting/tasks/:id - Lấy chi tiết công việc
router.get('/tasks/:id', accountingController.getTaskById);

// POST /api/accounting/tasks - Tạo công việc mới
router.post('/tasks', accountingController.createTask);

// PUT /api/accounting/tasks/:id - Cập nhật công việc
router.put('/tasks/:id', accountingController.updateTask);

// PATCH /api/accounting/tasks/:id/status - Cập nhật trạng thái
router.patch('/tasks/:id/status', accountingController.updateTaskStatus);

// DELETE /api/accounting/tasks/:id - Xóa công việc
router.delete('/tasks/:id', accountingController.deleteTask);

// ==========================================
// RECURRING SCHEDULES ROUTES
// ==========================================

// POST /api/accounting/schedules/run-now - Chạy lịch thủ công (đặt trước :id)
router.post('/schedules/run-now', accountingController.runSchedulesNow);

// GET /api/accounting/schedules - Lấy danh sách lịch định kỳ
router.get('/schedules', accountingController.getAllSchedules);

// GET /api/accounting/schedules/:id - Lấy chi tiết lịch định kỳ
router.get('/schedules/:id', accountingController.getScheduleById);

// POST /api/accounting/schedules - Tạo lịch định kỳ mới
router.post('/schedules', accountingController.createSchedule);

// PUT /api/accounting/schedules/:id - Cập nhật lịch định kỳ
router.put('/schedules/:id', accountingController.updateSchedule);

// PATCH /api/accounting/schedules/:id/toggle - Bật/Tắt lịch
router.patch('/schedules/:id/toggle', accountingController.toggleSchedule);

// DELETE /api/accounting/schedules/:id - Xóa lịch định kỳ
router.delete('/schedules/:id', accountingController.deleteSchedule);

// ==========================================
// UTILITY ROUTES
// ==========================================

// GET /api/accounting/categories - Lấy danh sách danh mục
router.get('/categories', accountingController.getCategories);

module.exports = router;
