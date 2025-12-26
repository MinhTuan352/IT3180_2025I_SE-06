// File: backend/models/residentModel.js

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
     * Lấy chi tiết 1 cư dân theo User ID (cho cư dân xem profile của chính mình)
     */
    findByUserId: async (userId) => {
        try {
            const query = `
                SELECT 
                    r.*, 
                    a.apartment_code, 
                    a.building,
                    a.floor,
                    u.email as account_email
                FROM residents r
                JOIN apartments a ON r.apartment_id = a.id
                LEFT JOIN users u ON r.user_id = u.id
                WHERE r.user_id = ?
            `;
            const [rows] = await db.execute(query, [userId]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    /**
     * Cập nhật thông tin cư dân (bản thân - giới hạn trường được sửa)
     */
    updateMyProfile: async (userId, data) => {
        try {
            const { phone, email, hometown, occupation } = data;

            const query = `
                UPDATE residents 
                SET phone=?, email=?, hometown=?, occupation=?
                WHERE user_id=?
            `;

            await db.execute(query, [
                phone || null,
                email || null,
                hometown || null,
                occupation || null,
                userId
            ]);

            return { userId, ...data };
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
                dob, gender, cccd, phone, email, status, hometown, occupation,
                relationship_with_owner, identity_date, identity_place
            } = data;

            const query = `
                INSERT INTO residents 
                (id, user_id, apartment_id, full_name, role, dob, gender, cccd, phone, email, status, hometown, occupation, relationship_with_owner, identity_date, identity_place)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            // Dùng (variable || null) để đảm bảo không bao giờ truyền undefined vào SQL
            await db.execute(query, [
                id, user_id || null, apartment_id, full_name, role,
                dob || null, gender || null, cccd || null, phone || null, email || null,
                status || 'Đang sinh sống', hometown || null, occupation || null,
                relationship_with_owner || 'Chủ hộ', identity_date || null, identity_place || null
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
    },

    /**
     * Lấy thông tin căn hộ kèm danh sách thành viên
     * Dùng cho cư dân xem căn hộ của chính mình
     */
    getApartmentWithMembers: async (apartmentId) => {
        try {
            // 1. Lấy thông tin căn hộ
            const apartmentQuery = `
                SELECT * FROM apartments WHERE id = ?
            `;
            const [apartmentRows] = await db.execute(apartmentQuery, [apartmentId]);

            if (apartmentRows.length === 0) {
                return null;
            }

            const apartment = apartmentRows[0];

            // 2. Lấy danh sách thành viên trong căn hộ
            const membersQuery = `
                SELECT 
                    r.id, r.full_name, r.role, r.phone, r.email, 
                    r.gender, r.dob, r.status
                FROM residents r
                WHERE r.apartment_id = ? AND r.status = 'Đang sinh sống'
                ORDER BY 
                    CASE WHEN r.role = 'owner' THEN 0 ELSE 1 END, 
                    r.full_name ASC
            `;
            const [members] = await db.execute(membersQuery, [apartmentId]);

            return {
                ...apartment,
                members: members
            };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Ghi lịch sử biến động nhân khẩu
     */
    addHistory: async (data, connection = null) => {
        const { resident_id, apartment_id, event_type, event_date, note } = data;
        const query = `
            INSERT INTO residence_history (resident_id, apartment_id, event_type, event_date, note)
            VALUES (?, ?, ?, ?, ?)
        `;
        await db.execute(query, [resident_id, apartment_id, event_type, event_date, note]);
    },

    /**
     * Lấy lịch sử cư trú của 1 người
     */
    getHistory: async (residentId) => {
        const [rows] = await db.execute(
            `SELECT * FROM residence_history WHERE resident_id = ? ORDER BY event_date DESC`, 
            [residentId]
        );
        return rows;
    },

    /**
     * Đăng ký tạm trú / tạm vắng
     */
    createTemporary: async (data) => {
        const { resident_id, type, start_date, end_date, reason } = data;
        const query = `
            INSERT INTO temporary_residence (resident_id, type, start_date, end_date, reason, status)
            VALUES (?, ?, ?, ?, ?, 'Chờ duyệt')
        `;
        await db.execute(query, [resident_id, type, start_date, end_date, reason]);
    },

    /**
     * Lấy danh sách đơn tạm trú/vắng
     */
    getAllTemporary: async (filters = {}) => {
        let query = `
            SELECT t.*, r.full_name, r.id as resident_code, a.apartment_code, u.username as approver_name
            FROM temporary_residence t
            JOIN residents r ON t.resident_id = r.id
            JOIN apartments a ON r.apartment_id = a.id
            LEFT JOIN users u ON t.approved_by = u.id
            WHERE 1=1
        `;
        const params = [];
        if (filters.status) {
            query += ` AND t.status = ?`;
            params.push(filters.status);
        }
        query += ` ORDER BY t.created_at DESC`;
        
        const [rows] = await db.execute(query, params);
        return rows;
    },

    getTemporaryById: async (id) => {
        const [rows] = await db.execute(`SELECT * FROM temporary_residence WHERE id = ?`, [id]);
        return rows[0];
    },

    /**
     * Duyệt đơn tạm trú/vắng
     */
    updateTemporaryStatus: async (id, status, approverId, connection = null) => {
        const dbConn = connection || db;
        await dbConn.execute(
            `UPDATE temporary_residence SET status = ?, approved_by = ? WHERE id = ?`,
            [status, approverId, id]
        );
    }
};

module.exports = Resident;