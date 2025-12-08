// File: backend/controllers/residentController.js

const Resident = require('../models/residentModel');

const residentController = {

    // ========================================================
    // [MỚI] CƯ DÂN XEM PROFILE CỦA CHÍNH MÌNH
    // ========================================================

    // [GET] /api/residents/me
    getMyProfile: async (req, res) => {
        try {
            const userId = req.user.id; // Lấy từ token
            const resident = await Resident.findByUserId(userId);

            if (!resident) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin cư dân. Có thể tài khoản của bạn chưa được liên kết với hồ sơ cư dân.'
                });
            }

            res.status(200).json({ success: true, data: resident });
        } catch (error) {
            console.error('Error in getMyProfile:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [PUT] /api/residents/me
    updateMyProfile: async (req, res) => {
        try {
            const userId = req.user.id;

            // Kiểm tra xem cư dân có tồn tại không
            const existingResident = await Resident.findByUserId(userId);
            if (!existingResident) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin cư dân.'
                });
            }

            // Chỉ cho phép cập nhật các trường hạn chế
            const allowedFields = {
                phone: req.body.phone,
                email: req.body.email,
                hometown: req.body.hometown,
                occupation: req.body.occupation
            };

            await Resident.updateMyProfile(userId, allowedFields);

            res.json({
                success: true,
                message: 'Cập nhật thông tin cá nhân thành công!'
            });
        } catch (error) {
            console.error('Error in updateMyProfile:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // ========================================================
    // CÁC HÀM QUẢN LÝ CƯ DÂN (CHO BOD/ACCOUNTANT)
    // ========================================================

    // [GET] /api/residents
    getAllResidents: async (req, res) => {
        try {
            // Lấy tham số từ URL
            // Ví dụ: /api/residents?name=Nam&apartment_code=A-101
            const filters = {
                name: req.query.name,
                apartment_code: req.query.apartment_code,
                status: req.query.status
            };

            const residents = await Resident.getAll(filters);

            res.status(200).json({
                success: true,
                count: residents.length,
                data: residents
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server khi lấy danh sách cư dân.', error: error.message });
        }
    },

    // [GET] /api/residents/:id
    getResidentDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const resident = await Resident.findById(id);

            if (!resident) {
                return res.status(404).json({ message: 'Không tìm thấy cư dân.' });
            }

            res.status(200).json({ success: true, data: resident });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [POST] /api/residents
    createResident: async (req, res) => {
        try {
            // Lấy dữ liệu từ form
            const {
                id, apartment_id, full_name, role,
                dob, gender, cccd, phone, email
            } = req.body;

            // 1. Validate cơ bản
            if (!id || !apartment_id || !full_name || !role || !cccd) {
                return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc (ID, Căn hộ, Họ tên, Vai trò, CCCD).' });
            }

            // 2. Gọi Model để tạo
            const newResident = await Resident.create(req.body);

            res.status(201).json({
                success: true,
                message: 'Thêm cư dân thành công!',
                data: newResident
            });

        } catch (error) {
            // Xử lý lỗi trùng lặp (Duplicate entry)
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Dữ liệu bị trùng lặp (ID hoặc CCCD đã tồn tại).' });
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ message: 'Mã căn hộ (apartment_id) không tồn tại.' });
            }
            res.status(500).json({ message: 'Lỗi server khi thêm cư dân.', error: error.message });
        }
    },

    // [PUT] /api/residents/:id
    updateResident: async (req, res) => {
        try {
            const { id } = req.params;
            const existingResident = await Resident.findById(id);

            if (!existingResident) {
                return res.status(404).json({ message: 'Cư dân không tồn tại.' });
            }

            await Resident.update(id, req.body);

            res.json({ success: true, message: 'Cập nhật thông tin thành công.' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'CCCD mới bị trùng với cư dân khác.' });
            }
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [DELETE] /api/residents/:id
    deleteResident: async (req, res) => {
        try {
            const { id } = req.params;
            const existingResident = await Resident.findById(id);

            if (!existingResident) {
                return res.status(404).json({ message: 'Cư dân không tồn tại.' });
            }

            // Kiểm tra ràng buộc (nếu cần): Ví dụ nếu cư dân đang nợ phí thì không cho xóa
            // Hiện tại ta cho phép xóa, DB sẽ báo lỗi nếu có ràng buộc khóa ngoại (Foreign Key)

            await Resident.delete(id);
            res.json({ success: true, message: 'Xóa cư dân thành công.' });
        } catch (error) {
            // Lỗi 1451: Cannot delete or update a parent row (do dính khóa ngoại bảng Fees, Reports...)
            if (error.errno === 1451) {
                return res.status(400).json({ message: 'Không thể xóa cư dân này vì dữ liệu liên quan (Hóa đơn, Phản ánh) vẫn còn.' });
            }
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = residentController;