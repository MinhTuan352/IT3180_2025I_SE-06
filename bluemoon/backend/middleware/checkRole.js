// File: backend/middleware/checkRole.js

/**
 * Hàm nhận vào một danh sách các vai trò được phép.
 * Ví dụ: checkRole(['bod', 'accountance']) => Chỉ Ban quản trị hoặc Kế toán mới được vào.
 */
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        // req.user đã có được từ middleware checkAuth chạy trước đó
        if (!req.user) {
            return res.status(401).json({ message: 'Chưa xác thực người dùng.' });
        }

        const userRole = req.user.role; // Lấy từ token: 'bod', 'resident', ...

        // Kiểm tra xem role của user có nằm trong danh sách cho phép không
        if (allowedRoles.includes(userRole)) {
            next(); // Được phép đi tiếp
        } else {
            return res.status(403).json({ 
                message: 'Bạn không có quyền thực hiện chức năng này (Forbidden).' 
            });
        }
    };
};

module.exports = checkRole;