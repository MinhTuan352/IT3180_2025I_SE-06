// File: backend/controllers/accountingController.js
// Controller xử lý API cho Quản lý Kế toán

const AccountingTask = require('../models/accountingTaskModel');
const RecurringSchedule = require('../models/recurringScheduleModel');

const accountingController = {
    // ==========================================
    // ACCOUNTING TASKS APIs
    // ==========================================

    // GET /api/accounting/tasks - Lấy danh sách công việc
    async getAllTasks(req, res) {
        try {
            const filters = {
                status: req.query.status,
                category: req.query.category,
                assigned_to: req.query.assigned_to,
                period_value: req.query.period_value,
                period_type: req.query.period_type,
                task_type: req.query.task_type,
                from_date: req.query.from_date,
                to_date: req.query.to_date,
                search: req.query.search,
                sort_by: req.query.sort_by,
                sort_order: req.query.sort_order,
                limit: req.query.limit,
                offset: req.query.offset
            };

            const tasks = await AccountingTask.getAllTasks(filters);
            res.json({
                success: true,
                data: tasks,
                count: tasks.length
            });
        } catch (error) {
            console.error('Error fetching tasks:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách công việc',
                error: error.message
            });
        }
    },

    // GET /api/accounting/tasks/:id - Lấy chi tiết công việc
    async getTaskById(req, res) {
        try {
            const task = await AccountingTask.getTaskById(req.params.id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy công việc'
                });
            }
            res.json({
                success: true,
                data: task
            });
        } catch (error) {
            console.error('Error fetching task:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy chi tiết công việc',
                error: error.message
            });
        }
    },

    // POST /api/accounting/tasks - Tạo công việc mới
    async createTask(req, res) {
        try {
            const { title, due_date } = req.body;

            // Validate required fields
            if (!title || !due_date) {
                return res.status(400).json({
                    success: false,
                    message: 'Tiêu đề và deadline là bắt buộc'
                });
            }

            const taskData = {
                ...req.body,
                assigned_by: req.user?.id || null,
                task_type: 'manual'
            };

            const result = await AccountingTask.createTask(taskData);
            res.status(201).json({
                success: true,
                message: 'Tạo công việc thành công',
                data: result
            });
        } catch (error) {
            console.error('Error creating task:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo công việc',
                error: error.message
            });
        }
    },

    // PUT /api/accounting/tasks/:id - Cập nhật công việc
    async updateTask(req, res) {
        try {
            const result = await AccountingTask.updateTask(req.params.id, req.body);
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy công việc hoặc không có gì thay đổi'
                });
            }
            res.json({
                success: true,
                message: 'Cập nhật công việc thành công'
            });
        } catch (error) {
            console.error('Error updating task:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật công việc',
                error: error.message
            });
        }
    },

    // PATCH /api/accounting/tasks/:id/status - Cập nhật trạng thái
    async updateTaskStatus(req, res) {
        try {
            const { status } = req.body;
            const validStatuses = ['pending', 'in_progress', 'review', 'completed', 'overdue'];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Trạng thái không hợp lệ'
                });
            }

            const result = await AccountingTask.updateStatus(req.params.id, status);
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy công việc'
                });
            }
            res.json({
                success: true,
                message: 'Cập nhật trạng thái thành công'
            });
        } catch (error) {
            console.error('Error updating status:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật trạng thái',
                error: error.message
            });
        }
    },

    // DELETE /api/accounting/tasks/:id - Xóa công việc
    async deleteTask(req, res) {
        try {
            const result = await AccountingTask.deleteTask(req.params.id);
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy công việc'
                });
            }
            res.json({
                success: true,
                message: 'Xóa công việc thành công'
            });
        } catch (error) {
            console.error('Error deleting task:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa công việc',
                error: error.message
            });
        }
    },

    // GET /api/accounting/tasks/stats - Thống kê công việc
    async getTaskStats(req, res) {
        try {
            const filters = {
                period_value: req.query.period_value,
                assigned_to: req.query.assigned_to
            };
            const stats = await AccountingTask.getTaskStats(filters);
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thống kê',
                error: error.message
            });
        }
    },

    // ==========================================
    // RECURRING SCHEDULES APIs
    // ==========================================

    // GET /api/accounting/schedules - Lấy danh sách lịch định kỳ
    async getAllSchedules(req, res) {
        try {
            const filters = {
                is_active: req.query.is_active === 'true' ? true :
                    req.query.is_active === 'false' ? false : undefined,
                frequency: req.query.frequency,
                category: req.query.category
            };

            const schedules = await RecurringSchedule.getAllSchedules(filters);
            res.json({
                success: true,
                data: schedules,
                count: schedules.length
            });
        } catch (error) {
            console.error('Error fetching schedules:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách lịch định kỳ',
                error: error.message
            });
        }
    },

    // GET /api/accounting/schedules/:id - Lấy chi tiết lịch định kỳ
    async getScheduleById(req, res) {
        try {
            const schedule = await RecurringSchedule.getScheduleById(req.params.id);
            if (!schedule) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy lịch định kỳ'
                });
            }
            res.json({
                success: true,
                data: schedule
            });
        } catch (error) {
            console.error('Error fetching schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy chi tiết lịch định kỳ',
                error: error.message
            });
        }
    },

    // POST /api/accounting/schedules - Tạo lịch định kỳ mới
    async createSchedule(req, res) {
        try {
            const { title, frequency } = req.body;

            // Validate required fields
            if (!title || !frequency) {
                return res.status(400).json({
                    success: false,
                    message: 'Tiêu đề và tần suất là bắt buộc'
                });
            }

            const scheduleData = {
                ...req.body,
                created_by: req.user?.id || null
            };

            const result = await RecurringSchedule.createSchedule(scheduleData);
            res.status(201).json({
                success: true,
                message: 'Tạo lịch định kỳ thành công',
                data: result
            });
        } catch (error) {
            console.error('Error creating schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo lịch định kỳ',
                error: error.message
            });
        }
    },

    // PUT /api/accounting/schedules/:id - Cập nhật lịch định kỳ
    async updateSchedule(req, res) {
        try {
            const result = await RecurringSchedule.updateSchedule(req.params.id, req.body);
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy lịch định kỳ hoặc không có gì thay đổi'
                });
            }
            res.json({
                success: true,
                message: 'Cập nhật lịch định kỳ thành công'
            });
        } catch (error) {
            console.error('Error updating schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật lịch định kỳ',
                error: error.message
            });
        }
    },

    // PATCH /api/accounting/schedules/:id/toggle - Bật/Tắt lịch
    async toggleSchedule(req, res) {
        try {
            const { is_active } = req.body;
            const result = await RecurringSchedule.toggleActive(req.params.id, is_active);
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy lịch định kỳ'
                });
            }
            res.json({
                success: true,
                message: is_active ? 'Đã kích hoạt lịch định kỳ' : 'Đã tắt lịch định kỳ'
            });
        } catch (error) {
            console.error('Error toggling schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi thay đổi trạng thái lịch',
                error: error.message
            });
        }
    },

    // DELETE /api/accounting/schedules/:id - Xóa lịch định kỳ
    async deleteSchedule(req, res) {
        try {
            const result = await RecurringSchedule.deleteSchedule(req.params.id);
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy lịch định kỳ'
                });
            }
            res.json({
                success: true,
                message: 'Xóa lịch định kỳ thành công'
            });
        } catch (error) {
            console.error('Error deleting schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa lịch định kỳ',
                error: error.message
            });
        }
    },

    // POST /api/accounting/schedules/run-now - Chạy thủ công để tạo task từ lịch
    async runSchedulesNow(req, res) {
        try {
            const schedules = await RecurringSchedule.getSchedulesToRun();
            const createdTasks = [];

            for (const schedule of schedules) {
                // Tạo task từ schedule
                const periodValue = RecurringSchedule.calculatePeriodValue(schedule);
                const startDate = new Date().toISOString().split('T')[0];
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + (schedule.deadline_offset_days || 7));

                const taskData = {
                    title: schedule.title,
                    description: schedule.description,
                    task_type: 'recurring',
                    category: schedule.category,
                    period_type: schedule.frequency,
                    period_value: periodValue,
                    start_date: startDate,
                    due_date: dueDate.toISOString().split('T')[0],
                    assigned_to: schedule.default_assignee,
                    priority: schedule.priority,
                    recurring_schedule_id: schedule.id
                };

                const task = await AccountingTask.createTask(taskData);
                createdTasks.push(task);

                // Cập nhật next_run_date
                const nextRunDate = RecurringSchedule.calculateNextRunDate(schedule);
                await RecurringSchedule.updateAfterRun(schedule.id, nextRunDate);
            }

            res.json({
                success: true,
                message: `Đã tạo ${createdTasks.length} công việc từ lịch định kỳ`,
                data: createdTasks
            });
        } catch (error) {
            console.error('Error running schedules:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi chạy lịch định kỳ',
                error: error.message
            });
        }
    },

    // GET /api/accounting/categories - Lấy danh sách danh mục
    async getCategories(req, res) {
        try {
            const categories = [
                { value: 'thu_phi', label: 'Thu phí', icon: '💰' },
                { value: 'bao_cao', label: 'Báo cáo', icon: '📊' },
                { value: 'kiem_ke', label: 'Kiểm kê', icon: '📦' },
                { value: 'cong_no', label: 'Công nợ', icon: '📋' },
                { value: 'dien_nuoc', label: 'Điện nước', icon: '⚡' },
                { value: 'khac', label: 'Khác', icon: '📁' }
            ];
            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh mục',
                error: error.message
            });
        }
    }
};

module.exports = accountingController;
