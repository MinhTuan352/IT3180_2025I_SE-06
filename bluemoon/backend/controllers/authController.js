// File: backend/controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config();

// Helper: Hàm tạo Access Token
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role_code },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

// Helper: Hàm tạo Refresh Token
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role_code },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

const authController = {

    // 1. XỬ LÝ ĐĂNG NHẬP
    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' });
            }

            const user = await User.findByUsername(username);
            if (!user) {
                return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
            }

            // Tạo Tokens
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);

            // Lưu Refresh Token
            await User.updateRefreshToken(user.id, refreshToken);

            // ========================================================
            // [CẬP NHẬT SỬA LỖI] GHI LỊCH SỬ ĐĂNG NHẬP
            // ========================================================

            // 1. Lấy chuỗi IP thô
            let ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';

            // 2. Xử lý nếu là chuỗi nhiều IP (VD: "IP_Client, IP_Proxy1, IP_Proxy2")
            if (typeof ipAddress === 'string' && ipAddress.includes(',')) {
                // Cắt lấy cái đầu tiên và xóa khoảng trắng thừa
                ipAddress = ipAddress.split(',')[0].trim();
            }

            // 3. Đảm bảo không quá 45 ký tự (Cắt bớt nếu vẫn dài - phòng hờ)
            if (ipAddress.length > 45) {
                ipAddress = ipAddress.substring(0, 45);
            }

            // Lấy thông tin trình duyệt/thiết bị
            const userAgent = req.headers['user-agent'] || 'Unknown Device';

            // Gọi Model để lưu
            User.createLoginHistory(user.id, ipAddress, userAgent);
            // =======================================================

            res.json({
                success: true,
                message: 'Đăng nhập thành công!',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role_code,
                        role_name: user.role_name,
                        full_name: user.full_name
                    },
                    accessToken,
                    refreshToken
                }
            });

        } catch (error) {
            console.error('Login Error:', error);
            res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
        }
    },

    // 2. LÀM MỚI TOKEN (Giữ nguyên)
    refreshToken: async (req, res) => {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(401).json({ message: 'Không tìm thấy Refresh Token.' });

        try {
            const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
            const decoded = jwt.verify(refreshToken, secret);
            const user = await User.findById(decoded.id);

            if (!user) return res.status(403).json({ message: 'User không tồn tại.' });

            const newAccessToken = generateAccessToken(user);
            res.json({ accessToken: newAccessToken });

        } catch (error) {
            return res.status(403).json({ message: 'Refresh Token không hợp lệ.' });
        }
    },

    // 3. ĐĂNG XUẤT (Giữ nguyên)
    logout: async (req, res) => {
        try {
            const userId = req.body.userId;
            if (userId) {
                await User.updateRefreshToken(userId, null);
            }
            res.json({ success: true, message: 'Đăng xuất thành công.' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server khi đăng xuất.' });
        }
    },

    // ========================================================
    // [MỚI] QUÊN MẬT KHẨU
    // ========================================================
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ message: 'Vui lòng nhập email.' });
            }

            // 1. Tìm user theo email
            const user = await User.findByEmail(email);
            if (!user) {
                // Không tiết lộ email có tồn tại hay không (bảo mật)
                return res.json({
                    success: true,
                    message: 'Nếu email tồn tại trong hệ thống, mật khẩu mới đã được gửi đến email của bạn.'
                });
            }

            // 2. Tạo mật khẩu tạm ngẫu nhiên (8 ký tự)
            const tempPassword = Math.random().toString(36).slice(-8);

            // 3. Mã hóa và lưu mật khẩu mới
            const salt = await bcrypt.genSalt(10);
            const newPasswordHash = await bcrypt.hash(tempPassword, salt);
            await User.changePassword(user.id, newPasswordHash);

            // 4. Gửi email chứa mật khẩu tạm
            try {
                const emailService = require('../services/emailService');
                await emailService.sendPasswordResetEmail(email, tempPassword, user.full_name || user.username);

                res.json({
                    success: true,
                    message: 'Mật khẩu mới đã được gửi đến email của bạn.'
                });
            } catch (emailError) {
                console.error('[EMAIL ERROR]', emailError);
                // Nếu gửi email thất bại, vẫn trả về thành công nhưng log lỗi
                // (mật khẩu đã được đổi trong DB)
                res.json({
                    success: true,
                    message: 'Mật khẩu mới đã được gửi đến email của bạn.',
                    // Chỉ hiện khi không gửi được email (fallback cho dev)
                    warning: 'Email service unavailable',
                    tempPassword: tempPassword
                });
            }

        } catch (error) {
            console.error('Forgot Password Error:', error);
            res.status(500).json({ message: 'Lỗi server khi xử lý yêu cầu.' });
        }
    },

    // ========================================================
    // [MỚI] CHỨC NĂNG ĐỔI MẬT KHẨU
    // ========================================================
    changePassword: async (req, res) => {
        try {
            const userId = req.user.id; // Lấy ID từ Token (do middleware checkAuth cấp)
            const { oldPassword, newPassword } = req.body;

            if (!oldPassword || !newPassword) {
                return res.status(400).json({ message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới.' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
            }

            // 1. Lấy thông tin user hiện tại để lấy mật khẩu cũ (hash)
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại.' });

            // 2. Kiểm tra mật khẩu cũ có đúng không
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Mật khẩu cũ không chính xác.' });
            }

            // 3. Mã hóa mật khẩu mới
            const salt = await bcrypt.genSalt(10);
            const newPasswordHash = await bcrypt.hash(newPassword, salt);

            // 4. Lưu vào DB
            await User.changePassword(userId, newPasswordHash);

            res.json({ success: true, message: 'Đổi mật khẩu thành công!' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu.' });
        }
    },

    // ========================================================
    // [MỚI] XEM LỊCH SỬ ĐĂNG NHẬP
    // ========================================================
    getLoginHistory: async (req, res) => {
        try {
            const userId = req.user.id;
            const history = await User.getLoginHistory(userId);

            res.json({
                success: true,
                count: history.length,
                data: history
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [BOD] Xem toàn bộ lịch sử
    getSystemLoginHistory: async (req, res) => {
        try {
            const history = await User.getAllLoginHistory();
            res.json({
                success: true,
                count: history.length,
                data: history
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server khi lấy lịch sử hệ thống.' });
        }
    },

    // ========================================================
    // [BOD] XEM LỊCH SỬ ĐĂNG NHẬP CỦA QUẢN TRỊ VIÊN
    // ========================================================
    getAdminLoginHistory: async (req, res) => {
        try {
            const allHistory = await User.getAllLoginHistory();
            // Lọc chỉ lấy admin (BOD, ACCOUNTANT)
            const adminHistory = allHistory.filter(item =>
                item.role_code === 'BOD' || item.role_code === 'ACCOUNTANT'
            ).map(item => ({
                id: item.id,
                username: item.username,
                fullName: item.full_name,
                role: item.role_name,
                time: item.login_time,
                ip: item.ip_address,
                device: item.user_agent,
                status: 'Thành công'
            }));

            res.json({
                success: true,
                count: adminHistory.length,
                data: adminHistory
            });
        } catch (error) {
            console.error('Error fetching admin login history:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // ========================================================
    // [BOD] XEM LỊCH SỬ ĐĂNG NHẬP CỦA CƯ DÂN
    // ========================================================
    getResidentLoginHistory: async (req, res) => {
        try {
            const allHistory = await User.getAllLoginHistory();
            // Lọc chỉ lấy cư dân (RESIDENT)
            const residentHistory = allHistory.filter(item =>
                item.role_code === 'RESIDENT'
            ).map(item => ({
                id: item.id,
                username: item.username,
                fullName: item.full_name,
                apartment: item.apartment_id || 'N/A',
                time: item.login_time,
                ip: item.ip_address,
                device: item.user_agent,
                status: 'Thành công'
            }));

            res.json({
                success: true,
                count: residentHistory.length,
                data: residentHistory
            });
        } catch (error) {
            console.error('Error fetching resident login history:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = authController;