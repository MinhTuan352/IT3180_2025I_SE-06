// File: backend/controllers/visitorController.js

const Visitor = require('../models/visitorModel');

const visitorController = {
    
    /**
     * [GET] /api/visitors
     * Xem danh sách khách (Hỗ trợ lọc)
     */
    getAllVisitors: async (req, res) => {
        try {
            // Lấy tham số lọc từ URL
            const filters = {
                status: req.query.status,       // 'active' (chưa về) hoặc 'history' (đã về)
                keyword: req.query.keyword,     // Tên, CCCD, Biển số
                apartment_id: req.query.apartment_id
            };

            const visitors = await Visitor.getAll(filters);

            res.json({
                success: true,
                count: visitors.length,
                data: visitors
            });
        } catch (error) {
            console.error('Error getAllVisitors:', error);
            res.status(500).json({ message: 'Lỗi server khi lấy danh sách khách.', error: error.message });
        }
    },

    /**
     * [POST] /api/visitors/check-in
     * Ghi nhận khách vào
     */
    checkIn: async (req, res) => {
        try {
            const { apartment_id, visitor_name, identity_card, vehicle_plate } = req.body;

            // 1. Validate
            if (!apartment_id || !visitor_name) {
                return res.status(400).json({ message: 'Vui lòng nhập Căn hộ và Tên khách.' });
            }

            // 2. Tạo bản ghi
            // security_guard_id lấy từ token người đang đăng nhập (Bảo vệ/BQT)
            const newVisitor = await Visitor.create({
                apartment_id,
                visitor_name,
                identity_card,
                vehicle_plate,
                security_guard_id: req.user.id 
            });

            res.status(201).json({
                success: true,
                message: 'Ghi nhận khách vào thành công.',
                data: newVisitor
            });

        } catch (error) {
            console.error('Error checkIn:', error);
            res.status(500).json({ message: 'Lỗi server khi check-in.', error: error.message });
        }
    },

    /**
     * [PUT] /api/visitors/:id/check-out
     * Ghi nhận khách ra
     */
    checkOut: async (req, res) => {
        try {
            const { id } = req.params;

            // 1. Kiểm tra tồn tại (Optional - Model update sẽ trả về false nếu ko tìm thấy)
            
            // 2. Cập nhật giờ ra
            const isSuccess = await Visitor.updateCheckOut(id);

            if (!isSuccess) {
                return res.status(400).json({ 
                    message: 'Không thể check-out. Có thể khách đã về rồi hoặc ID không tồn tại.' 
                });
            }

            res.json({
                success: true,
                message: 'Ghi nhận khách ra thành công.'
            });

        } catch (error) {
            console.error('Error checkOut:', error);
            res.status(500).json({ message: 'Lỗi server khi check-out.', error: error.message });
        }
    },

    /**
     * [DELETE] /api/visitors/:id
     * Xóa lịch sử khách (Chỉ Admin/BOD)
     */
    deleteVisitor: async (req, res) => {
        try {
            const { id } = req.params;
            
            await Visitor.delete(id);

            res.json({ success: true, message: 'Đã xóa thông tin khách.' });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = visitorController;