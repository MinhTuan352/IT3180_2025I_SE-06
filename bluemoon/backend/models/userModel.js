// File: backend/models/userModel.js

const db = require('../config/db');

const User = {
    /**
     * Tìm user theo username
     */
    findByUsername: async (username) => {
        try {
            const query = `
                SELECT u.*, r.role_code, r.role_name,
                       COALESCE(a.full_name, res.full_name) as full_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                LEFT JOIN admins a ON u.id = a.user_id
                LEFT JOIN residents res ON u.id = res.user_id
                WHERE u.username = ? AND u.is_active = TRUE
            `;
            const [rows] = await db.execute(query, [username]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    /**
     * Tìm user theo email (cho chức năng quên mật khẩu)
     */
    findByEmail: async (email) => {
        try {
            const query = `
                SELECT u.*, r.role_code, r.role_name 
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.email = ? AND u.is_active = TRUE
            `;
            const [rows] = await db.execute(query, [email]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    /**
     * Tìm user theo ID (Có lấy thêm password để dùng cho chức năng đổi mật khẩu)
     */
    findById: async (id) => {
        try {
            const query = `
                SELECT u.*, r.role_code, r.role_name 
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = ?
            `;
            const [rows] = await db.execute(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    updateRefreshToken: async (userId, refreshToken) => {
        try {
            const query = `UPDATE users SET refresh_token = ? WHERE id = ?`;
            await db.execute(query, [refreshToken, userId]);
        } catch (error) {
            throw error;
        }
    },

    create: async (userData) => {
        try {
            const { id, username, password, email, phone, role_id } = userData;
            const query = `
                INSERT INTO users (id, username, password, email, phone, role_id) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            await db.execute(query, [id, username, password, email, phone, role_id]);
            return { id, ...userData };
        } catch (error) {
            throw error;
        }
    },

    // =================================================
    // [MỚI] BỔ SUNG CÁC HÀM CHO SPRINT 1 (AUDIT)
    // =================================================

    /**
     * Cập nhật mật khẩu mới
     */
    changePassword: async (userId, newPasswordHash) => {
        try {
            const query = `UPDATE users SET password = ? WHERE id = ?`;
            await db.execute(query, [newPasswordHash, userId]);
        } catch (error) {
            throw error;
        }
    },

    /**
     * Ghi lịch sử đăng nhập
     * Thông tin này rất quan trọng để audit bảo mật
     */
    createLoginHistory: async (userId, ipAddress, userAgent) => {
        try {
            const query = `
                INSERT INTO login_history (user_id, ip_address, user_agent)
                VALUES (?, ?, ?)
            `;
            // userAgent là chuỗi thông tin trình duyệt (Chrome/Firefox, Windows/Mac...)
            await db.execute(query, [userId, ipAddress, userAgent]);
        } catch (error) {
            // Lưu ý: Lỗi ghi log không nên làm sập app, chỉ cần console.error
            console.error('Lỗi ghi lịch sử đăng nhập:', error.message);
        }
    },

    /**
     * Lấy danh sách lịch sử đăng nhập của 1 user
     * (Cho chức năng: "Cư dân muốn xem lịch sử đăng nhập")
     */
    getLoginHistory: async (userId) => {
        try {
            const query = `
                SELECT login_time, ip_address, user_agent 
                FROM login_history 
                WHERE user_id = ? 
                ORDER BY login_time DESC 
                LIMIT 10
            `;
            // Chỉ lấy 10 lần gần nhất
            const [rows] = await db.execute(query, [userId]);
            return rows;
        } catch (error) {
            throw error;
        }
    },

    /**
     * [BOD] Lấy TOÀN BỘ lịch sử đăng nhập của hệ thống
     * Join với các bảng để lấy tên và thông tin chi tiết
     */
    getAllLoginHistory: async () => {
        try {
            const query = `
                SELECT 
                    lh.log_id as id, 
                    lh.user_id, 
                    lh.login_time, 
                    lh.ip_address, 
                    lh.user_agent,
                    u.username, 
                    r.role_code, 
                    r.role_name,
                    COALESCE(a.full_name, res.full_name, 'Unknown') as full_name,
                    res.apartment_id,
                    apt.apartment_code,
                    apt.building
                FROM login_history lh
                JOIN users u ON lh.user_id = u.id
                JOIN roles r ON u.role_id = r.id
                LEFT JOIN admins a ON u.id = a.user_id
                LEFT JOIN residents res ON u.id = res.user_id
                LEFT JOIN apartments apt ON res.apartment_id = apt.id
                ORDER BY lh.login_time DESC
                LIMIT 500
            `;
            // Limit 500 để tránh quá tải
            const [rows] = await db.execute(query);
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // =================================================
    // [MỚI] ADMIN QUẢN LÝ USER
    // =================================================

    /**
     * Lấy danh sách tất cả người dùng (Kèm thông tin Role)
     */
    getAllUsers: async (filters = {}) => { // Nhận thêm tham số filters
        try {
            let query = `
                SELECT 
                    u.id, u.username, u.email, u.phone, u.is_active, u.created_at, 
                    r.role_name, r.role_code,
                    COALESCE(a.full_name, res.full_name) as full_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                LEFT JOIN admins a ON u.id = a.user_id
                LEFT JOIN residents res ON u.id = res.user_id
                WHERE 1=1
            `;
            const params = [];

            // 1. Lọc theo Role (VD: chỉ lấy bod, accountance)
            if (filters.role_code) {
                query += ` AND r.role_code = ?`;
                params.push(filters.role_code);
            }

            // 2. Tìm kiếm theo Username hoặc Tên hiển thị
            if (filters.keyword) {
                query += ` AND (u.username LIKE ? OR COALESCE(a.full_name, res.full_name) LIKE ?)`;
                const kw = `%${filters.keyword}%`;
                params.push(kw, kw);
            }

            query += ` ORDER BY u.created_at DESC`;

            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Cập nhật trạng thái hoạt động (Khóa/Mở khóa)
     */
    updateStatus: async (userId, isActive) => {
        try {
            const query = `UPDATE users SET is_active = ? WHERE id = ?`;
            await db.execute(query, [isActive, userId]);
        } catch (error) {
            throw error;
        }
    },

    /**
     * Admin Reset mật khẩu (Ghi đè mật khẩu cũ)
     */
    resetPassword: async (userId, newPasswordHash) => {
        try {
            // Hàm này giống changePassword, nhưng tách riêng để phân biệt ngữ nghĩa
            // Admin có quyền ghi đè mà không cần check pass cũ
            const query = `UPDATE users SET password = ? WHERE id = ?`;
            await db.execute(query, [newPasswordHash, userId]);
        } catch (error) {
            throw error;
        }
    },

    /**
     * Lấy chi tiết admin theo user_id (Join cả users và admins)
     * Dùng cho trang hồ sơ quản trị viên
     */
    getAdminById: async (userId) => {
        try {
            const query = `
                SELECT 
                    u.id, u.username, u.email, u.phone, u.is_active, u.role_id, u.created_at,
                    r.role_code, r.role_name,
                    a.full_name, a.dob, a.gender, a.cccd
                FROM users u
                JOIN roles r ON u.role_id = r.id
                LEFT JOIN admins a ON u.id = a.user_id
                WHERE u.id = ?
            `;
            const [rows] = await db.execute(query, [userId]);
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    },

    // ==========================================
    // 2. CÁC HÀM MỚI (SPRINT 2) - TRANSACTION CAO CẤP
    // ==========================================

    /**
     * Kiểm tra trùng lặp thông tin trước khi tạo
     * Trả về thông báo lỗi cụ thể nếu trùng
     */
    checkDuplicate: async (username, email, cccd, tableProfile) => {
        // 1. Check bảng Users
        const [userRows] = await db.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        if (userRows.length > 0) return 'Username hoặc Email đã tồn tại trong hệ thống.';

        // 2. Check bảng Profile (Admins hoặc Residents)
        if (cccd) {
            const [profileRows] = await db.execute(
                `SELECT id FROM ${tableProfile} WHERE cccd = ?`,
                [cccd]
            );
            if (profileRows.length > 0) return `Số CCCD ${cccd} đã tồn tại.`;
        }

        return null; // Không trùng
    },

    /**
     * Transaction: Tạo tài khoản Quản trị (Admin/Kế toán)
     * Insert đồng thời vào users và admins
     */
    createManagementAccount: async (data, connection = null) => {
        const dbConn = connection || db;
        const { id, username, password, email, phone, role_id, full_name, dob, gender, cccd } = data;

        // 1. Insert Users
        await dbConn.execute(
            `INSERT INTO users (id, username, password, email, phone, role_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, username, password, email, phone, role_id]
        );

        // 2. Insert Admins Profile
        await dbConn.execute(
            `INSERT INTO admins (id, user_id, full_name, dob, gender, cccd, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, id, full_name, dob, gender, cccd, phone, email]
        );

        return { id, username };
    },
    /**
     * Transaction: Cập nhật thông tin Admin
     * Update đồng thời vào users và admins
     */
    updateAdmin: async (userId, data) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { email, phone, role_id, full_name, dob, gender, cccd } = data;

            // 1. Update bảng Users
            await connection.execute(
                `UPDATE users SET email = ?, phone = ?, role_id = ? WHERE id = ?`,
                [email, phone, role_id, userId]
            );

            // 2. Update bảng Admins (Profile)
            await connection.execute(
                `UPDATE admins SET full_name = ?, dob = ?, gender = ?, cccd = ?, phone = ?, email = ? WHERE user_id = ?`,
                [full_name, dob, gender, cccd, phone, email, userId]
            );

            await connection.commit();
            return { success: true };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = User;