// File: backend/controllers/userController.js

const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const idGenerator = require('../utils/idGenerator');

const userController = {

    // ==========================================
    // 1. CÁC HÀM QUẢN LÝ CŨ (GIỮ NGUYÊN)
    // ==========================================

    // [GET] /api/users - Lấy danh sách tài khoản
    getAllUsers: async (req, res) => {
        try {
            // [CẬP NHẬT] Lấy tham số lọc từ URL
            const filters = {
                role_code: req.query.role_code, // Lọc theo vai trò (bod, resident...)
                keyword: req.query.keyword      // Tìm theo username hoặc tên thật
            };

            // Truyền filters vào Model
            const users = await User.getAllUsers(filters);

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
            // Role ID: 1=BOD, 2=Accountance, 4=CQCN
            if (![1, 2, 4].includes(Number(role_id))) {
                return res.status(400).json({ message: 'Role ID không hợp lệ (Phải là 1, 2 hoặc 4).' });
            }

            // [MỚI] Sinh ID tự động (ID0001...)
            const newId = await idGenerator.generateIncrementalId('users', 'ID', 'id', 4);

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
                id: newId,
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

            // [MỚI] Sinh ID cư dân (R0001...)
            // ID này sẽ dùng chung cho bảng users và residents
            const newId = await idGenerator.generateIncrementalId('residents', 'R', 'id', 4);

            // 3. Hash Password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 4. Gọi Model thực hiện Transaction
            const newUser = await User.createResidentAccount({
                id: newId,
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
     * [PUT] /api/users/:id
     * Cập nhật thông tin admin
     */
    updateAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            const { email, phone, role_id, full_name, dob, gender, cccd } = req.body;

            // Validate required fields
            if (!email || !full_name) {
                return res.status(400).json({ message: 'Email và Họ tên là bắt buộc.' });
            }

            // Kiểm tra user tồn tại
            const existingUser = await User.getAdminById(id);
            if (!existingUser) {
                return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
            }

            // Cập nhật thông tin
            await User.updateAdmin(id, {
                email,
                phone: phone || null,
                role_id: role_id || existingUser.role_id,
                full_name,
                dob: dob || null,
                gender: gender || 'Nam',
                cccd: cccd || null
            });

            res.json({
                success: true,
                message: 'Cập nhật thông tin thành công!'
            });

        } catch (error) {
            console.error('Update admin error:', error);
            res.status(500).json({ message: 'Lỗi server khi cập nhật.', error: error.message });
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