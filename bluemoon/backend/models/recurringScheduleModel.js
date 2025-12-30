// File: backend/models/recurringScheduleModel.js
// Model quản lý lịch định kỳ (recurring_schedules)

const db = require('../config/db');

const RecurringSchedule = {
    // ==========================================
    // LẤY DANH SÁCH LỊCH ĐỊNH KỲ
    // ==========================================
    async getAllSchedules(filters = {}) {
        let query = `
            SELECT 
                rs.*,
                u_assignee.username as default_assignee_name,
                u_creator.username as created_by_name
            FROM recurring_schedules rs
            LEFT JOIN users u_assignee ON rs.default_assignee = u_assignee.id
            LEFT JOIN users u_creator ON rs.created_by = u_creator.id
            WHERE 1=1
        `;
        const params = [];

        // Filter theo is_active
        if (filters.is_active !== undefined) {
            query += ' AND rs.is_active = ?';
            params.push(filters.is_active);
        }

        // Filter theo frequency
        if (filters.frequency) {
            query += ' AND rs.frequency = ?';
            params.push(filters.frequency);
        }

        // Filter theo category
        if (filters.category) {
            query += ' AND rs.category = ?';
            params.push(filters.category);
        }

        // Sort
        query += ' ORDER BY rs.is_active DESC, rs.next_run_date ASC';

        const [rows] = await db.query(query, params);
        return rows;
    },

    // ==========================================
    // LẤY CHI TIẾT LỊCH ĐỊNH KỲ
    // ==========================================
    async getScheduleById(id) {
        const query = `
            SELECT 
                rs.*,
                u_assignee.username as default_assignee_name,
                u_assignee.email as default_assignee_email,
                u_creator.username as created_by_name
            FROM recurring_schedules rs
            LEFT JOIN users u_assignee ON rs.default_assignee = u_assignee.id
            LEFT JOIN users u_creator ON rs.created_by = u_creator.id
            WHERE rs.id = ?
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0];
    },

    // ==========================================
    // TẠO LỊCH ĐỊNH KỲ MỚI
    // ==========================================
    async createSchedule(data) {
        // Tính next_run_date dựa trên cấu hình
        const nextRunDate = this.calculateNextRunDate(data);

        const query = `
            INSERT INTO recurring_schedules (
                title, description, category, frequency,
                day_of_week, day_of_month, month_of_year,
                deadline_offset_days, default_assignee, priority,
                is_active, next_run_date, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.title,
            data.description || null,
            data.category || null,
            data.frequency,
            data.day_of_week || null,
            data.day_of_month || null,
            data.month_of_year || null,
            data.deadline_offset_days || 7,
            data.default_assignee || null,
            data.priority || 'medium',
            data.is_active !== false,
            nextRunDate,
            data.created_by || null
        ];

        const [result] = await db.query(query, params);
        return { id: result.insertId, next_run_date: nextRunDate, ...data };
    },

    // ==========================================
    // CẬP NHẬT LỊCH ĐỊNH KỲ
    // ==========================================
    async updateSchedule(id, data) {
        const allowedFields = [
            'title', 'description', 'category', 'frequency',
            'day_of_week', 'day_of_month', 'month_of_year',
            'deadline_offset_days', 'default_assignee', 'priority',
            'is_active', 'next_run_date'
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
        const query = `UPDATE recurring_schedules SET ${updates.join(', ')} WHERE id = ?`;

        const [result] = await db.query(query, params);
        return result;
    },

    // ==========================================
    // BẬT/TẮT LỊCH ĐỊNH KỲ
    // ==========================================
    async toggleActive(id, isActive) {
        const query = 'UPDATE recurring_schedules SET is_active = ? WHERE id = ?';
        const [result] = await db.query(query, [isActive, id]);
        return result;
    },

    // ==========================================
    // XÓA LỊCH ĐỊNH KỲ
    // ==========================================
    async deleteSchedule(id) {
        const query = 'DELETE FROM recurring_schedules WHERE id = ?';
        const [result] = await db.query(query, [id]);
        return result;
    },

    // ==========================================
    // LẤY LỊCH CẦN CHẠY HÔM NAY
    // ==========================================
    async getSchedulesToRun() {
        const query = `
            SELECT 
                rs.*,
                u_assignee.username as default_assignee_name
            FROM recurring_schedules rs
            LEFT JOIN users u_assignee ON rs.default_assignee = u_assignee.id
            WHERE rs.is_active = TRUE 
            AND rs.next_run_date <= CURDATE()
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // ==========================================
    // CẬP NHẬT SAU KHI TẠO TASK
    // ==========================================
    async updateAfterRun(id, nextRunDate) {
        const query = `
            UPDATE recurring_schedules 
            SET last_run_date = CURDATE(), 
                next_run_date = ?
            WHERE id = ?
        `;
        const [result] = await db.query(query, [nextRunDate, id]);
        return result;
    },

    // ==========================================
    // TÍNH TOÁN NGÀY CHẠY TIẾP THEO
    // ==========================================
    calculateNextRunDate(schedule, fromDate = null) {
        const now = fromDate ? new Date(fromDate) : new Date();
        let nextDate = new Date(now);

        switch (schedule.frequency) {
            case 'daily':
                // Ngày tiếp theo
                nextDate.setDate(nextDate.getDate() + 1);
                break;

            case 'weekly':
                // Tuần tiếp theo vào ngày day_of_week (0=CN, 1=T2...)
                const targetDay = schedule.day_of_week || 1; // Mặc định thứ 2
                const currentDay = nextDate.getDay();
                let daysUntil = targetDay - currentDay;
                if (daysUntil <= 0) daysUntil += 7;
                nextDate.setDate(nextDate.getDate() + daysUntil);
                break;

            case 'monthly':
                // Tháng tiếp theo vào ngày day_of_month
                const targetDayOfMonth = schedule.day_of_month || 1;
                nextDate.setMonth(nextDate.getMonth() + 1);
                nextDate.setDate(Math.min(targetDayOfMonth, this.getDaysInMonth(nextDate)));
                break;

            case 'quarterly':
                // Quý tiếp theo (3 tháng) vào ngày day_of_month
                const targetDayQ = schedule.day_of_month || 1;
                nextDate.setMonth(nextDate.getMonth() + 3);
                nextDate.setDate(Math.min(targetDayQ, this.getDaysInMonth(nextDate)));
                break;

            case 'yearly':
                // Năm tiếp theo vào tháng month_of_year, ngày day_of_month
                const targetMonth = (schedule.month_of_year || 1) - 1; // 0-indexed
                const targetDayY = schedule.day_of_month || 1;
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                nextDate.setMonth(targetMonth);
                nextDate.setDate(Math.min(targetDayY, this.getDaysInMonth(nextDate)));
                break;

            default:
                // Mặc định: 1 tháng sau
                nextDate.setMonth(nextDate.getMonth() + 1);
        }

        return nextDate.toISOString().split('T')[0];
    },

    // Helper: Lấy số ngày trong tháng
    getDaysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    },

    // ==========================================
    // TÍNH GIÁ TRỊ KỲ (period_value) CHO TASK
    // ==========================================
    calculatePeriodValue(schedule) {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');

        switch (schedule.frequency) {
            case 'daily':
                return `${year}-${month}-${now.getDate().toString().padStart(2, '0')}`;
            case 'weekly':
                // Tuần của năm
                const weekNum = this.getWeekNumber(now);
                return `W${weekNum}-${year}`;
            case 'monthly':
                return `${year}-${month}`;
            case 'quarterly':
                const quarter = Math.ceil((now.getMonth() + 1) / 3);
                return `Q${quarter}-${year}`;
            case 'yearly':
                return `${year}`;
            default:
                return `${year}-${month}`;
        }
    },

    // Helper: Lấy số tuần trong năm
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
};

module.exports = RecurringSchedule;
