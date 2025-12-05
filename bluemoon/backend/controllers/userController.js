// backend/controllers/userController.js

const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const userController = {
    
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
            const { is_active } = req.body; // true hoặc false

            if (typeof is_active !== 'boolean') {
                return res.status(400).json({ message: 'Trạng thái is_active phải là true hoặc false.' });
            }

            // Không cho phép tự khóa chính mình
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

            // Mã hóa mật khẩu mới
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);

            await User.resetPassword(id, passwordHash);

            res.json({ success: true, message: 'Đã đặt lại mật khẩu thành công cho user.' });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = userController;