// File: backend/models/profileEditRequestModel.js

const db = require('../config/db');

const ProfileEditRequest = {
    /**
     * Tạo yêu cầu chỉnh sửa mới
     */
    create: async (data) => {
        const query = `
            INSERT INTO profile_edit_requests 
            (resident_id, requested_changes, reason)
            VALUES (?, ?, ?)
        `;
        const [result] = await db.execute(query, [
            data.resident_id,
            JSON.stringify(data.requested_changes),
            data.reason || null
        ]);
        return { id: result.insertId, ...data };
    },

    /**
     * Lấy yêu cầu của cư dân (cho cư dân xem của mình)
     */
    getByResidentId: async (residentId) => {
        const query = `
            SELECT 
                per.*,
                u.username as processed_by_name
            FROM profile_edit_requests per
            LEFT JOIN users u ON per.processed_by = u.id
            WHERE per.resident_id = ?
            ORDER BY per.created_at DESC
        `;
        const [rows] = await db.execute(query, [residentId]);
        return rows.map(row => ({
            ...row,
            requested_changes: typeof row.requested_changes === 'string'
                ? JSON.parse(row.requested_changes)
                : row.requested_changes
        }));
    },

    /**
     * Lấy yêu cầu theo resident (cho BOD xem)
     */
    getByResidentIdForAdmin: async (residentId) => {
        const query = `
            SELECT 
                per.*,
                r.full_name as resident_name,
                u.username as processed_by_name
            FROM profile_edit_requests per
            JOIN residents r ON per.resident_id = r.id
            LEFT JOIN users u ON per.processed_by = u.id
            WHERE per.resident_id = ?
            ORDER BY per.created_at DESC
        `;
        const [rows] = await db.execute(query, [residentId]);
        return rows.map(row => ({
            ...row,
            requested_changes: typeof row.requested_changes === 'string'
                ? JSON.parse(row.requested_changes)
                : row.requested_changes
        }));
    },

    /**
     * Lấy TẤT CẢ yêu cầu (cho BOD xem tổng quan)
     */
    getAll: async () => {
        const query = `
            SELECT 
                per.*,
                r.full_name as resident_name,
                a.apartment_code
            FROM profile_edit_requests per
            JOIN residents r ON per.resident_id = r.id
            LEFT JOIN apartments a ON r.apartment_id = a.id
            ORDER BY per.created_at DESC
        `;
        const [rows] = await db.execute(query);
        return rows.map(row => ({
            ...row,
            requested_changes: typeof row.requested_changes === 'string'
                ? JSON.parse(row.requested_changes)
                : row.requested_changes
        }));
    },

    /**
     * Đếm tổng số yêu cầu chờ duyệt (toàn hệ thống)
     */
    getTotalPendingCount: async () => {
        const query = `SELECT COUNT(*) as count FROM profile_edit_requests WHERE status = 'Chờ duyệt'`;
        const [rows] = await db.execute(query);
        return rows[0].count;
    },

    /**
     * Đếm số yêu cầu chờ duyệt của 1 cư dân
     */
    getPendingCount: async (residentId) => {
        const query = `
            SELECT COUNT(*) as count 
            FROM profile_edit_requests 
            WHERE resident_id = ? AND status = 'Chờ duyệt'
        `;
        const [rows] = await db.execute(query, [residentId]);
        return rows[0].count;
    },

    /**
     * Cập nhật trạng thái yêu cầu
     */
    updateStatus: async (id, status, adminNote, processedBy) => {
        const query = `
            UPDATE profile_edit_requests 
            SET status = ?, admin_note = ?, processed_by = ?, processed_at = NOW()
            WHERE id = ?
        `;
        const [result] = await db.execute(query, [status, adminNote || null, processedBy, id]);
        return result.affectedRows > 0;
    },

    /**
     * Lấy chi tiết 1 yêu cầu
     */
    getById: async (id) => {
        const query = `
            SELECT 
                per.*,
                r.full_name as resident_name,
                r.phone as current_phone,
                r.email as current_email,
                u.username as processed_by_name
            FROM profile_edit_requests per
            JOIN residents r ON per.resident_id = r.id
            LEFT JOIN users u ON per.processed_by = u.id
            WHERE per.id = ?
        `;
        const [rows] = await db.execute(query, [id]);
        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            ...row,
            requested_changes: typeof row.requested_changes === 'string'
                ? JSON.parse(row.requested_changes)
                : row.requested_changes
        };
    }
};

module.exports = ProfileEditRequest;
