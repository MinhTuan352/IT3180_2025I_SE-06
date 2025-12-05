// backend/models/residentModel.js

const db = require('../config/db');

const Resident = {
    /**
     * Lấy danh sách cư dân (Có hỗ trợ bộ lọc)
     * @param {Object} filters - name, apartment_code, status
     */
    getAll: async (filters = {}) => {
        try {
            let query = `
                SELECT 
                    r.*, 
                    a.apartment_code, 
                    a.building, 
                    a.floor,
                    u.username as account_username
                FROM residents r
                JOIN apartments a ON r.apartment_id = a.id
                LEFT JOIN users u ON r.user_id = u.id
                WHERE 1=1
            `;
            const params = [];

            // 1. Lọc theo Tên (Tìm gần đúng)
            if (filters.name) {
                query += ` AND r.full_name LIKE ?`;
                params.push(`%${filters.name}%`); // %Nam%
            }

            // 2. Lọc theo Mã căn hộ (Tìm chính xác hoặc gần đúng tùy nhu cầu)
            if (filters.apartment_code) {
                query += ` AND a.apartment_code LIKE ?`;
                params.push(`%${filters.apartment_code}%`);
            }

            // 3. Lọc theo Trạng thái (Đang sinh sống / Đã chuyển đi)
            if (filters.status) {
                query += ` AND r.status = ?`;
                params.push(filters.status);
            }

            // Sắp xếp: Mới nhất lên đầu
            query += ` ORDER BY r.created_at DESC`;

            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Lấy chi tiết 1 cư dân theo ID
     */
    findById: async (id) => {
        try {
            const query = `
                SELECT 
                    r.*, 
                    a.apartment_code, 
                    a.building,
                    u.email as account_email
                FROM residents r
                JOIN apartments a ON r.apartment_id = a.id
                LEFT JOIN users u ON r.user_id = u.id
                WHERE r.id = ?
            `;
            const [rows] = await db.execute(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    /**
     * Thêm mới cư dân
     */
    create: async (data) => {
        try {
            const { 
                id, user_id, apartment_id, full_name, role, 
                dob, gender, cccd, phone, email, status, hometown, occupation 
            } = data;

            const query = `
                INSERT INTO residents 
                (id, user_id, apartment_id, full_name, role, dob, gender, cccd, phone, email, status, hometown, occupation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            // Dùng (variable || null) để đảm bảo không bao giờ truyền undefined vào SQL
            await db.execute(query, [
                id, 
                user_id || null, 
                apartment_id, 
                full_name, 
                role, 
                dob || null, 
                gender || null, 
                cccd || null, 
                phone || null, 
                email || null, 
                status || 'Đang sinh sống', 
                hometown || null,   // Fix lỗi undefined
                occupation || null  // Fix lỗi undefined
            ]);
            
            return { id, ...data };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Cập nhật thông tin cư dân
     */
    update: async (id, data) => {
        try {
            const { 
                full_name, role, dob, gender, cccd, phone, email, 
                status, hometown, occupation, apartment_id 
            } = data;

            const query = `
                UPDATE residents 
                SET full_name=?, role=?, dob=?, gender=?, cccd=?, phone=?, email=?, 
                    status=?, hometown=?, occupation=?, apartment_id=?
                WHERE id=?
            `;
            
            await db.execute(query, [
                full_name, role, dob, gender, cccd, phone, email, 
                status, hometown, occupation, apartment_id, id
            ]);
            
            return { id, ...data };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Xóa cư dân (Cần cẩn thận nếu cư dân đã có hóa đơn)
     */
    delete: async (id) => {
        try {
            const query = `DELETE FROM residents WHERE id = ?`;
            await db.execute(query, [id]);
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Resident;