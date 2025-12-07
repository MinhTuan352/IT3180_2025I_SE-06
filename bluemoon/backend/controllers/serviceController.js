// File: backend/controllers/serviceController.js

const Service = require('../models/serviceModel');
const AuditLog = require('../models/auditModel');

const serviceController = {
    // 1. Lấy danh sách dịch vụ
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

    // 2. Thêm dịch vụ mới
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

    // 3. Cập nhật dịch vụ
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

    // 4. Xóa dịch vụ (Soft delete hoặc Hard delete tùy logic, ở đây làm Hard delete cho đơn giản theo init.sql)
    // Lưu ý: Nếu đã có booking liên quan thì có thể lỗi FK.
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
    }
};

module.exports = serviceController;
