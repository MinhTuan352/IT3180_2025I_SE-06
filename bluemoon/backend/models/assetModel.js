// File: backend/models/assetModel.js

const db = require('../config/db');

const Asset = {

    /**
     * Lấy danh sách tài sản (Có hỗ trợ bộ lọc và tìm kiếm)
     * @param {Object} filters - { status, keyword }
     */
    getAll: async (filters = {}) => {
        try {
            let query = `
                SELECT 
                    a.*,
                    (SELECT MAX(completed_date) FROM maintenance_schedules ms WHERE ms.asset_id = a.id AND ms.status = 'Hoàn thành') as last_maintenance,
                    (SELECT MIN(scheduled_date) FROM maintenance_schedules ms WHERE ms.asset_id = a.id AND ms.status = 'Lên lịch' AND ms.scheduled_date >= CURRENT_DATE) as next_maintenance
                FROM assets a 
                WHERE 1=1
            `;
            const params = [];

            // 1. Lọc theo trạng thái (VD: Chỉ xem tài sản 'Hỏng')
            if (filters.status) {
                query += ` AND a.status = ?`;
                params.push(filters.status);
            }

            // 2. Tìm kiếm theo tên hoặc mã tài sản
            if (filters.keyword) {
                query += ` AND (a.name LIKE ? OR a.asset_code LIKE ?)`;
                params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
            }

            // Sắp xếp: Mới nhất lên đầu
            query += ` ORDER BY a.created_at DESC`;

            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Lấy chi tiết tài sản theo ID
     */
    findById: async (id) => {
        try {
            const query = `SELECT * FROM assets WHERE id = ?`;
            const [rows] = await db.execute(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    /**
     * Kiểm tra mã tài sản có bị trùng không
     * Trả về true nếu đã tồn tại
     */
    checkDuplicateCode: async (assetCode) => {
        try {
            const query = `SELECT id FROM assets WHERE asset_code = ?`;
            const [rows] = await db.execute(query, [assetCode]);
            return rows.length > 0;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Thêm tài sản mới
     */
    create: async (data) => {
        try {
            const { asset_code, name, description, location, purchase_date, price, status } = data;

            const query = `
                INSERT INTO assets (asset_code, name, description, location, purchase_date, price, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            // Sử dụng toán tử || null để tránh lỗi undefined nếu người dùng không nhập các trường không bắt buộc
            const [result] = await db.execute(query, [
                asset_code,
                name,
                description || null,
                location || null,
                purchase_date || null,
                price || 0,
                status || 'Đang hoạt động'
            ]);

            return { id: result.insertId, ...data };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Cập nhật thông tin tài sản
     */
    update: async (id, data) => {
        try {
            const { name, description, location, purchase_date, price, status, next_maintenance } = data;

            // Lưu ý: Không cho phép cập nhật asset_code (Mã tài sản thường cố định)
            const query = `
                UPDATE assets 
                SET name = ?, description = ?, location = ?, purchase_date = ?, price = ?, status = ?
                WHERE id = ?
            `;

            await db.execute(query, [
                name,
                description || null,
                location || null,
                purchase_date || null,
                price || 0,
                status,
                id
            ]);

            // Cập nhật lịch bảo trì nếu có next_maintenance
            if (next_maintenance) {
                // Kiểm tra xem đã có lịch bảo trì "Lên lịch" nào chưa
                const checkQuery = `SELECT id FROM maintenance_schedules WHERE asset_id = ? AND status = 'Lên lịch'`;
                const [existing] = await db.execute(checkQuery, [id]);

                if (existing.length > 0) {
                    // Update existing
                    await db.execute(
                        `UPDATE maintenance_schedules SET scheduled_date = ? WHERE id = ?`,
                        [next_maintenance, existing[0].id]
                    );
                } else {
                    // Create new
                    await db.execute(
                        `INSERT INTO maintenance_schedules (asset_id, title, scheduled_date, status) VALUES (?, ?, ?, 'Lên lịch')`,
                        [id, `Bảo trì định kỳ tài sản ${name}`, next_maintenance]
                    );
                }
            }

            return { id, ...data };
        } catch (error) {
            console.error("Error updating asset:", error);
            throw error;
        }
    },

    /**
     * Xóa tài sản
     */
    delete: async (id) => {
        try {
            const query = `DELETE FROM assets WHERE id = ?`;
            await db.execute(query, [id]);
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Asset;