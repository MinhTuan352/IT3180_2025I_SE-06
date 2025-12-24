// File: backend/models/vehicleModel.js

const db = require('../config/db');

const Vehicle = {
    /**
     * Lấy danh sách xe (Hỗ trợ lọc cho Admin)
     * @param {Object} filters - { apartment_id, status, keyword (biển số/tên chủ) }
     */
    getAll: async (filters = {}) => {
        let query = `
            SELECT v.*, 
                   r.full_name as owner_name, 
                   a.apartment_code, a.building
            FROM vehicles v
            JOIN residents r ON v.resident_id = r.id
            JOIN apartments a ON v.apartment_id = a.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.apartment_id) {
            query += ` AND v.apartment_id = ?`;
            params.push(filters.apartment_id);
        }

        if (filters.status) {
            query += ` AND v.status = ?`;
            params.push(filters.status);
        }

        if (filters.keyword) {
            query += ` AND (v.license_plate LIKE ? OR r.full_name LIKE ?)`;
            params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
        }

        query += ` ORDER BY v.created_at DESC`;

        const [rows] = await db.execute(query, params);
        return rows;
    },

    /**
     * Lấy danh sách xe của một cư dân cụ thể
     */
    getByResidentId: async (residentId) => {
        const query = `
            SELECT v.*, a.apartment_code
            FROM vehicles v
            JOIN apartments a ON v.apartment_id = a.id
            WHERE v.resident_id = ?
            ORDER BY v.created_at DESC
        `;
        const [rows] = await db.execute(query, [residentId]);
        return rows;
    },

    /**
     * Lấy chi tiết một xe theo ID
     */
    getById: async (id) => {
        const query = `
            SELECT v.*, r.full_name as owner_name, r.phone, r.email, a.apartment_code
            FROM vehicles v
            JOIN residents r ON v.resident_id = r.id
            JOIN apartments a ON v.apartment_id = a.id
            WHERE v.id = ?
        `;
        const [rows] = await db.execute(query, [id]);
        return rows[0] || null;
    },

    /**
     * Kiểm tra biển số xe đã tồn tại chưa
     */
    checkPlateExists: async (licensePlate) => {
        const query = `SELECT id FROM vehicles WHERE license_plate = ?`;
        const [rows] = await db.execute(query, [licensePlate]);
        return rows.length > 0;
    },

    /**
     * Đăng ký xe mới
     */
    create: async (data) => {
        const query = `
            INSERT INTO vehicles 
            (resident_id, apartment_id, vehicle_type, license_plate, brand, model, vehicle_image, registration_cert, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.resident_id,
            data.apartment_id,
            data.vehicle_type,
            data.license_plate,
            data.brand || null,
            data.model || null,
            data.vehicle_image || null,     // Ảnh xe
            data.registration_cert || null, // Ảnh đăng ký xe
            data.status || 'Chờ duyệt'      // Mặc định là chờ duyệt nếu cư dân đăng ký
        ];

        const [result] = await db.execute(query, params);
        return { id: result.insertId, ...data };
    },

    /**
     * Cập nhật thông tin xe (hoặc duyệt xe)
     */
    update: async (id, data) => {
        // Tạo câu query động để chỉ update các trường có dữ liệu
        const fields = [];
        const params = [];

        if (data.vehicle_type) { fields.push('vehicle_type = ?'); params.push(data.vehicle_type); }
        if (data.license_plate) { fields.push('license_plate = ?'); params.push(data.license_plate); }
        if (data.brand) { fields.push('brand = ?'); params.push(data.brand); }
        if (data.model) { fields.push('model = ?'); params.push(data.model); }
        if (data.status) { fields.push('status = ?'); params.push(data.status); }
        if (data.vehicle_image) { fields.push('vehicle_image = ?'); params.push(data.vehicle_image); }
        
        // Cập nhật timestamp
        fields.push('updated_at = NOW()');

        if (fields.length === 0) return null;

        const query = `UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?`;
        params.push(id);

        const [result] = await db.execute(query, params);
        return result.affectedRows > 0;
    },

    /**
     * Xóa xe (Hủy đăng ký)
     */
    delete: async (id) => {
        const query = `DELETE FROM vehicles WHERE id = ?`;
        const [result] = await db.execute(query, [id]);
        return result.affectedRows > 0;
    },

    /**
     * [CRON JOB Support] Lấy danh sách xe để tính phí hàng tháng
     * Chỉ lấy xe 'Đang sử dụng'
     */
    getAllActiveForBilling: async () => {
        const query = `
            SELECT v.id, v.resident_id, v.apartment_id, v.vehicle_type, v.license_plate
            FROM vehicles v
            WHERE v.status = 'Đang sử dụng'
        `;
        const [rows] = await db.execute(query);
        return rows;
    }
};

module.exports = Vehicle;