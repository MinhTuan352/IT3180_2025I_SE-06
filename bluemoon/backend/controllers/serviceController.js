// File: backend/controllers/serviceController.js

const Service = require('../models/serviceModel');
const AuditLog = require('../models/auditModel');
const db = require('../config/db');

// Helper: Tìm Resident ID từ User ID
const getResidentIdFromUser = async (userId) => {
    const query = `SELECT id FROM residents WHERE user_id = ?`;
    const [rows] = await db.execute(query, [userId]);
    if (rows.length > 0) return rows[0].id;
    return null;
};

const serviceController = {
    // 1. Lấy danh sách dịch vụ (cho BOD/Accountant - bao gồm cả inactive)
    getAllServices: async (req, res) => {
        try {
            const services = await Service.getAll();
            res.json({
                success: true,
                count: services.length,
                data: services
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server khi lấy danh sách dịch vụ.' });
        }
    },

    // 2. Lấy dịch vụ đang hoạt động (cho Resident)
    getActiveServices: async (req, res) => {
        try {
            const services = await Service.getActiveServices();
            res.json({
                success: true,
                count: services.length,
                data: services
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server khi lấy danh sách dịch vụ.' });
        }
    },

    // 3. Lấy chi tiết dịch vụ theo ID
    getServiceById: async (req, res) => {
        try {
            const { id } = req.params;
            const service = await Service.findById(id);
            if (!service) {
                return res.status(404).json({ message: 'Dịch vụ không tồn tại.' });
            }
            res.json({ success: true, data: service });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server.' });
        }
    },

    // 4. Thêm dịch vụ mới (BOD)
    createService: async (req, res) => {
        try {
            const { name, base_price, unit, description } = req.body;
            if (!name) return res.status(400).json({ message: 'Tên dịch vụ là bắt buộc.' });

            const newService = await Service.create(req.body);

            // Ghi log
            AuditLog.create({
                user_id: req.user.id,
                action_type: 'CREATE',
                entity_name: 'service_types',
                entity_id: newService.id,
                old_values: null,
                new_values: newService,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.status(201).json({ success: true, data: newService });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server khi thêm dịch vụ.' });
        }
    },

    // 5. Cập nhật dịch vụ (BOD)
    updateService: async (req, res) => {
        try {
            const { id } = req.params;
            const oldService = await Service.findById(id);
            if (!oldService) return res.status(404).json({ message: 'Dịch vụ không tồn tại.' });

            const updatedService = await Service.update(id, req.body);

            // Ghi log
            AuditLog.create({
                user_id: req.user.id,
                action_type: 'UPDATE',
                entity_name: 'service_types',
                entity_id: id,
                old_values: oldService,
                new_values: updatedService,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.json({ success: true, message: 'Cập nhật thành công.', data: updatedService });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server khi cập nhật dịch vụ.' });
        }
    },

    // 6. Xóa dịch vụ (BOD)
    deleteService: async (req, res) => {
        try {
            const { id } = req.params;
            const oldService = await Service.findById(id);
            if (!oldService) return res.status(404).json({ message: 'Dịch vụ không tồn tại.' });

            await Service.delete(id);

            // Ghi log
            AuditLog.create({
                user_id: req.user.id,
                action_type: 'DELETE',
                entity_name: 'service_types',
                entity_id: id,
                old_values: oldService,
                new_values: null,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.json({ success: true, message: 'Đã xóa dịch vụ.' });
        } catch (error) {
            // Xử lý lỗi ràng buộc khóa ngoại
            if (error.errno === 1451) {
                return res.status(400).json({
                    message: 'Không thể xóa dịch vụ này vì đã có dữ liệu đặt chỗ (Booking) liên quan.'
                });
            }
            res.status(500).json({ message: 'Lỗi server khi xóa dịch vụ.', error: error.message });
        }
    },

    // === BOOKING ENDPOINTS (Resident) ===

    // 7. Cư dân tạo booking mới
    createBooking: async (req, res) => {
        try {
            const { service_type_id, booking_date, quantity, note } = req.body;

            // Lấy resident_id từ user đang đăng nhập
            const resident_id = await getResidentIdFromUser(req.user.id);
            if (!resident_id) {
                return res.status(400).json({ message: 'Không tìm thấy thông tin cư dân. Chỉ cư dân mới có thể đặt dịch vụ.' });
            }

            // Lấy thông tin dịch vụ để tính total_amount
            const service = await Service.findById(service_type_id);
            if (!service) {
                return res.status(404).json({ message: 'Dịch vụ không tồn tại.' });
            }

            const total_amount = (service.base_price || 0) * (quantity || 1);

            const booking = await Service.createBooking({
                resident_id,
                service_type_id,
                booking_date,
                quantity: quantity || 1,
                total_amount,
                note
            });

            res.status(201).json({
                success: true,
                message: 'Đặt dịch vụ thành công! Chúng tôi sẽ liên hệ lại sớm.',
                data: booking
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server khi đặt dịch vụ.' });
        }
    },

    // 8. Cư dân xem lịch sử booking của mình
    getMyBookings: async (req, res) => {
        try {
            const resident_id = await getResidentIdFromUser(req.user.id);
            if (!resident_id) {
                return res.status(400).json({ message: 'Không tìm thấy thông tin cư dân.' });
            }

            const bookings = await Service.getBookingsByResident(resident_id);
            res.json({ success: true, data: bookings });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server.' });
        }
    },

    // 9. BOD xem tất cả bookings
    getAllBookings: async (req, res) => {
        try {
            const bookings = await Service.getAllBookings();
            res.json({ success: true, data: bookings });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server.' });
        }
    },

    // 10. BOD cập nhật trạng thái booking
    updateBookingStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const validStatuses = ['Chờ duyệt', 'Đã duyệt', 'Đã hủy', 'Hoàn thành'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
            }

            await Service.updateBookingStatus(id, status);
            res.json({ success: true, message: 'Cập nhật trạng thái thành công.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server.' });
        }
    }
};

module.exports = serviceController;

