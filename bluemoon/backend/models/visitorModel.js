// File: backend/models/visitorModel.js

const db = require('../config/db');

const Visitor = {

    /**
     * Lấy danh sách khách ra vào (Hỗ trợ lọc)
     * @param {Object} filters 
     * - status: 'active' (đang ở lại), 'history' (đã về)
     * - keyword: Tìm theo tên, CCCD, biển số
     * - apartment_id: Lọc theo căn hộ
     */
    getAll: async (filters = {}) => {
        try {
            let query = `
                SELECT 
                    v.id, v.visitor_name, v.identity_card, v.vehicle_plate,
                    v.check_in_time, v.check_out_time,
                    v.expected_arrival, v.purpose, v.status,
                    a.apartment_code, a.building,
                    u.username as security_name,
                    r.full_name as resident_name
                FROM visitors v
                LEFT JOIN apartments a ON v.apartment_id = a.id
                LEFT JOIN users u ON v.security_guard_id = u.id
                LEFT JOIN residents r ON r.apartment_id = a.id AND r.role = 'owner'
                WHERE 1=1
            `;
            const params = [];

            // 1. Lọc theo trạng thái
            if (filters.status === 'active') {
                query += ` AND v.check_out_time IS NULL`;
            } else if (filters.status === 'history') {
                query += ` AND v.check_out_time IS NOT NULL`;
            }

            // 2. Lọc theo căn hộ
            if (filters.apartment_id) {
                query += ` AND v.apartment_id = ?`;
                params.push(filters.apartment_id);
            }

            // 2b. Lọc theo cư dân (cho Resident view)
            if (filters.resident_id) {
                // Join thêm bảng residents để lọc theo resident_id (user_id của resident)
                // Lưu ý: filters.resident_id here is passed from req.user.id (which is user_id)
                // We need to check if apartment belongs to this resident
                // Query: Select visitors where apartment_id IN (Select apartment_id from residents where user_id = ?)
                query += ` AND v.apartment_id IN (SELECT apartment_id FROM residents WHERE user_id = ?)`;
                params.push(filters.resident_id);
            }

            // 3. Tìm kiếm từ khóa
            if (filters.keyword) {
                query += ` AND (v.visitor_name LIKE ? OR v.identity_card LIKE ? OR v.vehicle_plate LIKE ?)`;
                const kw = `%${filters.keyword}%`;
                params.push(kw, kw, kw);
            }

            // Sắp xếp: Ai vào sau cùng lên đầu (Check-in gần nhất)
            query += ` ORDER BY v.check_in_time DESC`;

            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Lấy chi tiết một lượt khách
     */
    findById: async (id) => {
        try {
            const query = `
                SELECT v.*, a.apartment_code 
                FROM visitors v
                JOIN apartments a ON v.apartment_id = a.id
                WHERE v.id = ?
            `;
            const [rows] = await db.execute(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    /**
     * Đăng ký khách (Cư dân)
     */
    createRegistration: async (data) => {
        try {
            const { resident_id, visitor_name, visitor_id_card, expected_arrival, expected_departure, purpose } = data;

            // Tìm apartment_id từ bảng RESIDENTS (vì resident_id không nằm trong bảng apartments)
            const [apt] = await db.execute('SELECT apartment_id FROM residents WHERE user_id = ?', [resident_id]);
            const apartment_id = apt.length > 0 ? apt[0].apartment_id : null;

            const query = `
                INSERT INTO visitors 
                (apartment_id, visitor_name, identity_card, expected_arrival, expected_departure, purpose, status)
                VALUES (?, ?, ?, ?, ?, ?, 'Đăng ký')
            `;

            const [result] = await db.execute(query, [
                apartment_id,
                visitor_name,
                visitor_id_card,
                expected_arrival,
                expected_departure,
                purpose
            ]);

            return { id: result.insertId, ...data, status: 'Đăng ký' };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Ghi nhận khách vào (Check-in)
     * - Case 1: Khách vãng lai (Tạo mới)
     * - Case 2: Khách đã đăng ký (Cập nhật giờ vào)
     */
    updateCheckIn: async (id, security_guard_id) => {
        try {
            const query = `
                UPDATE visitors 
                SET check_in_time = NOW(), status = 'Đã vào', security_guard_id = ?
                WHERE id = ? AND status = 'Đăng ký'
            `;
            const [result] = await db.execute(query, [security_guard_id, id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Ghi nhận khách vào (Check-in trực tiếp tại cổng - Tạo mới)
     */
    createCheckIn: async (data) => {
        try {
            const { apartment_id, visitor_name, identity_card, vehicle_plate, security_guard_id } = data;

            const query = `
                INSERT INTO visitors 
                (apartment_id, visitor_name, identity_card, vehicle_plate, security_guard_id, check_in_time, status)
                VALUES (?, ?, ?, ?, ?, NOW(), 'Đã vào')
            `;

            const [result] = await db.execute(query, [
                apartment_id,
                visitor_name,
                identity_card || null,
                vehicle_plate || null,
                security_guard_id
            ]);

            return { id: result.insertId, ...data, check_in_time: new Date(), status: 'Đã vào' };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Ghi nhận khách ra (Check-out)
     */
    updateCheckOut: async (id) => {
        try {
            const query = `
                UPDATE visitors 
                SET check_out_time = NOW(), status = 'Đã ra'
                WHERE id = ? AND check_out_time IS NULL
            `;
            const [result] = await db.execute(query, [id]);
            return result.affectedRows > 0; // Trả về true nếu update thành công
        } catch (error) {
            throw error;
        }
    },

    /**
     * Xóa lịch sử khách (Chỉ admin dùng khi nhập sai)
     */
    delete: async (id) => {
        try {
            await db.execute('DELETE FROM visitors WHERE id = ?', [id]);
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Visitor;