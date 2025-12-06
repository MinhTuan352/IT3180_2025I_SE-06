// File: backend/models/userModel.js

const db = require('../config/db');

const User = {
    /**
     * Tìm user theo username
     */
    findByUsername: async (username) => {
        try {
            const query = `
                SELECT u.*, r.role_code, r.role_name 
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.username = ? AND u.is_active = TRUE
            `;
            const [rows] = await db.execute(query, [username]);
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

    // =================================================
    // [MỚI] ADMIN QUẢN LÝ USER
    // =================================================

    /**
     * Lấy danh sách tất cả người dùng (Kèm thông tin Role)
     */
    getAllUsers: async () => {
        try {
            const query = `
                SELECT u.id, u.username, u.email, u.phone, u.is_active, u.created_at, r.role_name, r.role_code
                FROM users u
                JOIN roles r ON u.role_id = r.id
                ORDER BY u.created_at DESC
            `;
            const [rows] = await db.execute(query);
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
    }
};

module.exports = User;