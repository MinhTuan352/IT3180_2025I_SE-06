const db = require('../config/db');

const TemporaryResidence = {
    /**
     * Tạo đơn đăng ký mới
     */
    create: async (data) => {
        const query = `
            INSERT INTO temporary_residence 
            (resident_id, type, start_date, end_date, reason, attachments, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Chờ duyệt')
        `;
        const params = [
            data.resident_id,
            data.type,       // 'Tạm trú' hoặc 'Tạm vắng'
            data.start_date,
            data.end_date,
            data.reason,
            data.attachments || null // Đường dẫn ảnh giấy tờ
        ];

        const [result] = await db.execute(query, params);
        return { id: result.insertId, ...data };
    },

    /**
     * Lấy danh sách đơn (Dành cho Admin/Công an)
     * Hỗ trợ lọc theo trạng thái, loại, hoặc tìm theo tên cư dân
     */
    getAll: async (filters = {}) => {
        let query = `
            SELECT tr.*, 
                   r.full_name, r.cccd, r.phone,
                   a.apartment_code, a.building
            FROM temporary_residence tr
            JOIN residents r ON tr.resident_id = r.id
            JOIN apartments a ON r.apartment_id = a.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            query += ` AND tr.status = ?`;
            params.push(filters.status);
        }

        if (filters.type) {
            query += ` AND tr.type = ?`;
            params.push(filters.type);
        }

        if (filters.keyword) {
            query += ` AND (r.full_name LIKE ? OR r.cccd LIKE ? OR a.apartment_code LIKE ?)`;
            params.push(`%${filters.keyword}%`, `%${filters.keyword}%`, `%${filters.keyword}%`);
        }

        // Nếu là công an (role='cqcn'), có thể muốn lọc theo khoảng thời gian báo cáo
        if (filters.startDate && filters.endDate) {
            query += ` AND tr.created_at BETWEEN ? AND ?`;
            params.push(filters.startDate, filters.endDate);
        }

        query += ` ORDER BY tr.created_at DESC`;

        const [rows] = await db.execute(query, params);
        return rows;
    },

    /**
     * Lấy danh sách đơn của một cư dân (Để cư dân xem lịch sử)
     */
    getByResidentId: async (residentId) => {
        const query = `
            SELECT tr.*
            FROM temporary_residence tr
            WHERE tr.resident_id = ?
            ORDER BY tr.created_at DESC
        `;
        const [rows] = await db.execute(query, [residentId]);
        return rows;
    },

    /**
     * Lấy chi tiết một đơn
     */
    getById: async (id) => {
        const query = `
            SELECT tr.*, 
                   r.full_name, r.cccd, r.dob, r.gender, r.hometown,
                   a.apartment_code
            FROM temporary_residence tr
            JOIN residents r ON tr.resident_id = r.id
            JOIN apartments a ON r.apartment_id = a.id
            WHERE tr.id = ?
        `;
        const [rows] = await db.execute(query, [id]);
        return rows[0] || null;
    },

    /**
     * Duyệt hoặc Từ chối đơn
     */
    updateStatus: async (id, status, approvedBy) => {
        const query = `
            UPDATE temporary_residence 
            SET status = ?, approved_by = ?, updated_at = NOW()
            WHERE id = ?
        `;
        const [result] = await db.execute(query, [status, approvedBy, id]);
        return result.affectedRows > 0;
    },

    /**
     * Xóa đơn (Chỉ cho phép xóa khi đang ở trạng thái 'Chờ duyệt')
     */
    delete: async (id) => {
        const query = `DELETE FROM temporary_residence WHERE id = ? AND status = 'Chờ duyệt'`;
        const [result] = await db.execute(query, [id]);
        return result.affectedRows > 0;
    }
};

module.exports = TemporaryResidence;