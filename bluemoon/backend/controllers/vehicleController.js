// File: backend/controllers/vehicleController.js

const Vehicle = require('../models/vehicleModel');
const AuditLog = require('../models/auditModel'); // Ghi log khi BQT duyệt xe
const db = require('../config/db');

// Helper: Tìm Resident ID từ User ID
const getResidentIdFromUser = async (userId) => {
    const query = `SELECT id FROM residents WHERE user_id = ?`;
    const [rows] = await db.execute(query, [userId]);
    if (rows.length > 0) return rows[0].id;
    return null;
};

const vehicleController = {

    // ==========================================
    // 1. DÀNH CHO CƯ DÂN (RESIDENT)
    // ==========================================

    /**
     * [GET] /api/vehicles/me
     * Xem danh sách xe của chính mình
     */
    getMyVehicles: async (req, res) => {
        try {
            const residentId = await getResidentIdFromUser(req.user.id);
            if (!residentId) {
                return res.status(403).json({ message: 'Không tìm thấy hồ sơ cư dân.' });
            }

            const vehicles = await Vehicle.getByResidentId(residentId);
            res.json({ success: true, data: vehicles });
        } catch (error) {
            console.error('Error getMyVehicles:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [POST] /api/vehicles/register
     * Đăng ký xe mới (Cư dân tự đăng ký -> Trạng thái: Chờ duyệt)
     * Yêu cầu: Upload ảnh xe & ảnh đăng ký xe
     */
    registerVehicle: async (req, res) => {
        try {
            const { vehicle_type, license_plate, brand, model } = req.body;

            // 1. Validate cơ bản
            if (!vehicle_type || !license_plate) {
                return res.status(400).json({ message: 'Loại xe và Biển số là bắt buộc.' });
            }

            // 2. Lấy thông tin cư dân & căn hộ
            // Cần lấy cả apartment_id để lưu vào bảng vehicles
            const [residents] = await db.execute(
                `SELECT id, apartment_id FROM residents WHERE user_id = ?`, 
                [req.user.id]
            );
            
            if (residents.length === 0) {
                return res.status(403).json({ message: 'Bạn chưa có hồ sơ cư dân.' });
            }
            const resident = residents[0];

            // 3. Kiểm tra biển số trùng
            const isExist = await Vehicle.checkPlateExists(license_plate);
            if (isExist) {
                return res.status(409).json({ message: `Biển số ${license_plate} đã được đăng ký trong hệ thống.` });
            }

            // 4. Xử lý File Upload (Từ Multer)
            // Frontend gửi: formData.append('vehicle_image', file1) và formData.append('registration_cert', file2)
            let vehicle_image = null;
            let registration_cert = null;

            if (req.files) {
                if (req.files.vehicle_image) {
                    vehicle_image = `/uploads/vehicles/${req.files.vehicle_image[0].filename}`;
                }
                if (req.files.registration_cert) {
                    registration_cert = `/uploads/vehicles/${req.files.registration_cert[0].filename}`;
                }
            }

            // 5. Tạo dữ liệu
            const newVehicle = await Vehicle.create({
                resident_id: resident.id,
                apartment_id: resident.apartment_id,
                vehicle_type,
                license_plate,
                brand,
                model,
                vehicle_image,
                registration_cert,
                status: 'Chờ duyệt' // Mặc định
            });

            res.status(201).json({
                success: true,
                message: 'Đăng ký xe thành công! Vui lòng chờ Ban Quản Trị duyệt.',
                data: newVehicle
            });

        } catch (error) {
            console.error('Error registerVehicle:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [DELETE] /api/vehicles/:id
     * Hủy đăng ký xe (Cư dân tự hủy hoặc báo bán xe)
     */
    cancelRegistration: async (req, res) => {
        try {
            const { id } = req.params;
            const residentId = await getResidentIdFromUser(req.user.id);

            // Kiểm tra quyền sở hữu
            const vehicle = await Vehicle.getById(id);
            if (!vehicle) {
                return res.status(404).json({ message: 'Xe không tồn tại.' });
            }

            if (vehicle.resident_id !== residentId) {
                return res.status(403).json({ message: 'Bạn không có quyền xóa xe này.' });
            }

            // Thực hiện xóa
            await Vehicle.delete(id);

            res.json({ success: true, message: 'Đã hủy đăng ký xe thành công.' });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // ==========================================
    // 2. DÀNH CHO BAN QUẢN TRỊ (BOD)
    // ==========================================

    /**
     * [GET] /api/vehicles
     * Xem danh sách tất cả xe (Hỗ trợ lọc theo trạng thái/căn hộ)
     */
    getAllVehicles: async (req, res) => {
        try {
            // Lấy params lọc từ URL
            const filters = {
                status: req.query.status,           // 'Chờ duyệt', 'Đang sử dụng'
                apartment_id: req.query.apartment_id,
                keyword: req.query.keyword          // Tìm theo biển số hoặc tên chủ xe
            };

            const vehicles = await Vehicle.getAll(filters);
            
            res.json({
                success: true,
                count: vehicles.length,
                data: vehicles
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [PUT] /api/vehicles/:id/status
     * Duyệt hoặc Từ chối xe
     */
    updateVehicleStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body; // 'Đang sử dụng' hoặc 'Ngừng sử dụng'

            if (!['Đang sử dụng', 'Ngừng sử dụng', 'Chờ duyệt'].includes(status)) {
                return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
            }

            const vehicle = await Vehicle.getById(id);
            if (!vehicle) return res.status(404).json({ message: 'Xe không tồn tại.' });

            // Cập nhật
            await Vehicle.update(id, { status });

            // Ghi Audit Log
            await AuditLog.create({
                user_id: req.user.id,
                action_type: 'UPDATE',
                entity_name: 'vehicles',
                entity_id: id,
                old_values: { status: vehicle.status },
                new_values: { status },
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.json({
                success: true,
                message: `Đã cập nhật trạng thái xe thành: ${status}`
            });

        } catch (error) {
            console.error('Error updateVehicleStatus:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [PUT] /api/vehicles/:id
     * Admin chỉnh sửa thông tin xe (VD: sửa sai biển số, loại xe)
     */
    updateVehicleInfo: async (req, res) => {
        try {
            const { id } = req.params;
            const { license_plate, brand, model, vehicle_type } = req.body;

            const vehicle = await Vehicle.getById(id);
            if (!vehicle) return res.status(404).json({ message: 'Xe không tồn tại.' });

            await Vehicle.update(id, { license_plate, brand, model, vehicle_type });

            res.json({ success: true, message: 'Cập nhật thông tin xe thành công.' });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = vehicleController;