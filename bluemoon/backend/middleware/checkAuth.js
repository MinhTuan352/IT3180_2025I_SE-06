// backend/middleware/checkAuth.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
    try {
        // 1. Lấy token từ header
        // Chuẩn gửi lên: "Authorization: Bearer <token_o_day>"
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'Bạn chưa đăng nhập (Thiếu Token).' });
        }

        // Tách chữ "Bearer" ra để lấy token
        const token = authHeader.split(' ')[1]; 
        if (!token) {
            return res.status(401).json({ message: 'Token không đúng định dạng.' });
        }

        // 2. Giải mã token (Verify)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Lưu thông tin user vào req để dùng ở các bước sau
        // Các controller phía sau có thể lấy ID bằng cách gọi: req.user.id
        req.user = decoded; 

        // 4. Cho phép đi tiếp
        next();

    } catch (error) {
        return res.status(401).json({ 
            message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ.',
            error: error.message 
        });
    }
};