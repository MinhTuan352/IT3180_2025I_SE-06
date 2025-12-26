// File: backend/models/accessModel.js

const db = require('../config/db');

const AccessLog = {
    /**
     * Lấy danh sách logs (Hỗ trợ phân trang & lọc)
     */
    getAll: async (limit, offset) => {
        const query = `
            SELECT 
                al.id, al.plate_number, al.vehicle_type, al.direction,
                al.gate, al.status, al.note, al.image_url, al.created_at,
                r.full_name as resident_name,
                a.apartment_code
            FROM access_logs al
            LEFT JOIN residents r ON al.resident_id = r.id
            LEFT JOIN apartments a ON r.apartment_id = a.id
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query(query, [limit, offset]);
        return rows;
    },

    countAll: async () => {
        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM access_logs');
        return total;
    },

    /**
     * [QUAN TRỌNG] Lấy trạng thái ra vào gần nhất của một biển số
     * Dùng để check logic "Ra vào theo cặp" (Anti-passback)
     */
    getLastLogByPlate: async (plateNumber) => {
        const query = `
            SELECT direction, created_at, status 
            FROM access_logs 
            WHERE plate_number = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        const [rows] = await db.query(query, [plateNumber]);
        return rows[0] || null;
    },

    /**
     * Ghi nhận lượt ra vào mới
     */
    create: async (data) => {
        const query = `
            INSERT INTO access_logs (plate_number, vehicle_type, direction, gate, status, resident_id, note, image_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        const [result] = await db.query(query, [
            data.plate_number, data.vehicle_type, data.direction, 
            data.gate, data.status, data.resident_id, data.note, data.image_url
        ]);
        
        return { id: result.insertId, ...data, created_at: new Date() };
    },

    /**
     * Lấy dữ liệu cho báo cáo Excel (Lọc theo ngày)
     */
    getByDateRange: async (startDate, endDate) => {
        const query = `
            SELECT 
                al.*, r.full_name as resident_name, a.apartment_code
            FROM access_logs al
            LEFT JOIN residents r ON al.resident_id = r.id
            LEFT JOIN apartments a ON r.apartment_id = a.id
            WHERE DATE(al.created_at) BETWEEN ? AND ?
            ORDER BY al.created_at DESC
        `;
        const [rows] = await db.query(query, [startDate, endDate]);
        return rows;
    },

    /**
     * Thống kê nhanh trong ngày
     */
    getStatsToday: async () => {
        const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM access_logs WHERE DATE(created_at) = CURDATE()`);
        const [[{ warnings }]] = await db.query(`SELECT COUNT(*) as warnings FROM access_logs WHERE DATE(created_at) = CURDATE() AND status IN ('Warning', 'Alert')`);
        return { totalToday: total, warningCount: warnings };
    }
};

module.exports = AccessLog;