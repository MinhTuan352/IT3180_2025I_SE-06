// File: backend/controllers/userController.js

const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const userController = {

    // ==========================================
    // 1. CÁC HÀM QUẢN LÝ CŨ (GIỮ NGUYÊN)
    // ==========================================

    // [GET] /api/users - Lấy danh sách tài khoản
    getAllUsers: async (req, res) => {
        try {
            const users = await User.getAllUsers();
            res.json({
                success: true,
                count: users.length,
                data: users
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [PUT] /api/users/:id/status - Khóa/Mở khóa tài khoản
    toggleStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { is_active } = req.body;

            if (typeof is_active !== 'boolean') {
                return res.status(400).json({ message: 'Trạng thái is_active phải là true hoặc false.' });
            }

            if (id === req.user.id) {
                return res.status(400).json({ message: 'Bạn không thể tự khóa tài khoản của chính mình.' });
            }

            await User.updateStatus(id, is_active);

            res.json({
                success: true,
                message: is_active ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.'
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [POST] /api/users/:id/reset-password - Admin reset mật khẩu
    resetPassword: async (req, res) => {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;

            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);

            await User.resetPassword(id, passwordHash);

            res.json({ success: true, message: 'Đã đặt lại mật khẩu thành công cho user.' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // ==========================================
    // 2. CÁC HÀM TẠO TÀI KHOẢN MỚI (SPRINT 2)
    // ==========================================

    /**
     * [POST] /api/users/create-admin
     * Tạo tài khoản quản trị (Admin/Kế toán)
     */
    createManagementAccount: async (req, res) => {
        try {
            const { username, password, email, phone, role_id, full_name, gender, dob, cccd } = req.body;

            // 1. Validate
            if (!username || !password || !email || !role_id || !full_name || !cccd) {
                return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
            }
            // Role ID: 1=BOD, 2=Accountance
            if (![1, 2].includes(Number(role_id))) {
                return res.status(400).json({ message: 'Role ID không hợp lệ (Phải là 1 hoặc 2).' });
            }

            // 2. Check trùng lặp (Gọi Model helper)
            const duplicateError = await User.checkDuplicate(username, email, cccd, 'admins');
            if (duplicateError) {
                return res.status(409).json({ message: duplicateError });
            }

            // 3. Hash Password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 4. Gọi Model thực hiện Transaction
            const newUser = await User.createManagementAccount({
                ...req.body,
                password: hashedPassword
            });

            res.status(201).json({
                success: true,
                message: 'Tạo tài khoản quản trị thành công!',
                data: { id: newUser.id, username, role_id }
            });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server khi tạo tài khoản.', error: error.message });
        }
    },

    /**
     * [POST] /api/users/create-resident
     * Tạo tài khoản cư dân
     */
    createResidentAccount: async (req, res) => {
        try {
            const {
                username, password, email, phone,
                full_name, gender, dob, cccd,
                apartment_id, role, hometown, occupation
            } = req.body;

            // 1. Validate
            if (!username || !password || !email || !full_name || !cccd || !apartment_id || !role) {
                return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin cư dân và căn hộ.' });
            }

            // 2. Check trùng lặp
            const duplicateError = await User.checkDuplicate(username, email, cccd, 'residents');
            if (duplicateError) {
                return res.status(409).json({ message: duplicateError });
            }

            // 3. Hash Password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 4. Gọi Model thực hiện Transaction
            const newUser = await User.createResidentAccount({
                ...req.body,
                password: hashedPassword
            });

            res.status(201).json({
                success: true,
                message: 'Tạo tài khoản cư dân thành công!',
                data: { id: newUser.id, username, apartment_id }
            });

        } catch (error) {
            // Bắt lỗi khóa ngoại nếu apartment_id không tồn tại
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ message: 'Mã căn hộ không tồn tại.' });
            }
            res.status(500).json({ message: 'Lỗi server khi tạo tài khoản.', error: error.message });
        }
    },

    /**
     * [GET] /api/users/:id
     * Lấy chi tiết admin theo ID
     */
    getAdminById: async (req, res) => {
        try {
            const { id } = req.params;
            const admin = await User.getAdminById(id);

            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng.'
                });
            }

            res.json({
                success: true,
                data: admin
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = userController;