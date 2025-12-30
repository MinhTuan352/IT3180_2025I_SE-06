// File: backend/models/accountingTaskModel.js
// Model quản lý công việc kế toán (accounting_tasks)

const db = require('../config/db');

const AccountingTask = {
    // ==========================================
    // LẤY DANH SÁCH CÔNG VIỆC (CÓ FILTER)
    // ==========================================
    async getAllTasks(filters = {}) {
        let query = `
            SELECT 
                t.*,
                u_assigned.username as assigned_to_name,
                u_assigned.username as assigned_to_username,
                u_by.username as assigned_by_name,
                rs.title as schedule_title
            FROM accounting_tasks t
            LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
            LEFT JOIN users u_by ON t.assigned_by = u_by.id
            LEFT JOIN recurring_schedules rs ON t.recurring_schedule_id = rs.id
            WHERE 1=1
        `;
        const params = [];

        // Filter theo status
        if (filters.status) {
            query += ' AND t.status = ?';
            params.push(filters.status);
        }

        // Filter theo category
        if (filters.category) {
            query += ' AND t.category = ?';
            params.push(filters.category);
        }

        // Filter theo assigned_to
        if (filters.assigned_to) {
            query += ' AND t.assigned_to = ?';
            params.push(filters.assigned_to);
        }

        // Filter theo period_value (tháng/quý/năm)
        if (filters.period_value) {
            query += ' AND t.period_value = ?';
            params.push(filters.period_value);
        }

        // Filter theo period_type
        if (filters.period_type) {
            query += ' AND t.period_type = ?';
            params.push(filters.period_type);
        }

        // Filter theo task_type (manual/recurring)
        if (filters.task_type) {
            query += ' AND t.task_type = ?';
            params.push(filters.task_type);
        }

        // Filter theo date range
        if (filters.from_date) {
            query += ' AND t.due_date >= ?';
            params.push(filters.from_date);
        }
        if (filters.to_date) {
            query += ' AND t.due_date <= ?';
            params.push(filters.to_date);
        }

        // Search theo title
        if (filters.search) {
            query += ' AND t.title LIKE ?';
            params.push(`%${filters.search}%`);
        }

        // Sort
        const sortField = filters.sort_by || 'id';
        const sortOrder = filters.sort_order || 'DESC';
        query += ` ORDER BY t.${sortField} ${sortOrder}`;

        // Pagination
        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
            if (filters.offset) {
                query += ' OFFSET ?';
                params.push(parseInt(filters.offset));
            }
        }

        const [rows] = await db.query(query, params);
        return rows;
    },

    // ==========================================
    // LẤY CHI TIẾT CÔNG VIỆC
    // ==========================================
    async getTaskById(id) {
        const query = `
            SELECT 
                t.*,
                u_assigned.username as assigned_to_name,
                u_assigned.email as assigned_to_email,
                u_by.username as assigned_by_name,
                rs.title as schedule_title,
                rs.frequency as schedule_frequency
            FROM accounting_tasks t
            LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
            LEFT JOIN users u_by ON t.assigned_by = u_by.id
            LEFT JOIN recurring_schedules rs ON t.recurring_schedule_id = rs.id
            WHERE t.id = ?
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0];
    },

    // ==========================================
    // TẠO CÔNG VIỆC MỚI
    // ==========================================
    async createTask(data) {
        const query = `
            INSERT INTO accounting_tasks (
                title, description, task_type, category,
                period_type, period_value, start_date, due_date,
                assigned_to, assigned_by, status, priority,
                recurring_schedule_id, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.title,
            data.description || null,
            data.task_type || 'manual',
            data.category || null,
            data.period_type || 'monthly',
            data.period_value || null,
            data.start_date || new Date().toISOString().split('T')[0],
            data.due_date,
            data.assigned_to || null,
            data.assigned_by || null,
            data.status || 'pending',
            data.priority || 'medium',
            data.recurring_schedule_id || null,
            data.notes || null
        ];

        const [result] = await db.query(query, params);
        return { id: result.insertId, ...data };
    },

    // ==========================================
    // CẬP NHẬT CÔNG VIỆC
    // ==========================================
    async updateTask(id, data) {
        const allowedFields = [
            'title', 'description', 'category', 'period_type', 'period_value',
            'start_date', 'due_date', 'completed_date', 'assigned_to',
            'status', 'priority', 'notes'
        ];

        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(data[field]);
            }
        }

        if (updates.length === 0) {
            return { affectedRows: 0 };
        }

        params.push(id);
        const query = `UPDATE accounting_tasks SET ${updates.join(', ')} WHERE id = ?`;

        const [result] = await db.query(query, params);
        return result;
    },

    // ==========================================
    // CẬP NHẬT TRẠNG THÁI
    // ==========================================
    async updateStatus(id, status, completedDate = null) {
        let query = 'UPDATE accounting_tasks SET status = ?';
        const params = [status];

        if (status === 'completed' && completedDate) {
            query += ', completed_date = ?';
            params.push(completedDate);
        } else if (status === 'completed') {
            query += ', completed_date = NOW()';
        }

        query += ' WHERE id = ?';
        params.push(id);

        const [result] = await db.query(query, params);
        return result;
    },

    // ==========================================
    // XÓA CÔNG VIỆC
    // ==========================================
    async deleteTask(id) {
        const query = 'DELETE FROM accounting_tasks WHERE id = ?';
        const [result] = await db.query(query, [id]);
        return result;
    },

    // ==========================================
    // THỐNG KÊ CÔNG VIỆC
    // ==========================================
    async getTaskStats(filters = {}) {
        let whereClause = '1=1';
        const params = [];

        if (filters.period_value) {
            whereClause += ' AND period_value = ?';
            params.push(filters.period_value);
        }

        if (filters.assigned_to) {
            whereClause += ' AND assigned_to = ?';
            params.push(filters.assigned_to);
        }

        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as review,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
                SUM(CASE WHEN due_date < CURDATE() AND status NOT IN ('completed', 'overdue') THEN 1 ELSE 0 END) as about_to_overdue
            FROM accounting_tasks
            WHERE ${whereClause}
        `;

        const [rows] = await db.query(query, params);
        return rows[0];
    },

    // ==========================================
    // LẤY CÔNG VIỆC THEO DANH MỤC
    // ==========================================
    async getTasksByCategory() {
        const query = `
            SELECT 
                category,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM accounting_tasks
            GROUP BY category
            ORDER BY total DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // ==========================================
    // KIỂM TRA VÀ CẬP NHẬT CÔNG VIỆC QUÁ HẠN
    // ==========================================
    async markOverdueTasks() {
        const query = `
            UPDATE accounting_tasks 
            SET status = 'overdue' 
            WHERE due_date < CURDATE() 
            AND status NOT IN ('completed', 'overdue')
        `;
        const [result] = await db.query(query);
        return result;
    }
};

module.exports = AccountingTask;
