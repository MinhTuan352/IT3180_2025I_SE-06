// File: backend/controllers/profileEditRequestController.js

const ProfileEditRequest = require('../models/profileEditRequestModel');
const Resident = require('../models/residentModel');
const db = require('../config/db');

const profileEditRequestController = {
    /**
     * [POST] /api/profile-requests
     * Cư dân tạo yêu cầu chỉnh sửa
     */
    createRequest: async (req, res) => {
        try {
            const { requested_changes, reason } = req.body;

            // Lấy resident_id từ user đang đăng nhập
            const resident = await Resident.findByUserId(req.user.id);
            if (!resident) {
                return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ cư dân.' });
            }

            // Validate có ít nhất 1 trường thay đổi
            if (!requested_changes || Object.keys(requested_changes).length === 0) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập ít nhất 1 thông tin cần thay đổi.' });
            }

            const newRequest = await ProfileEditRequest.create({
                resident_id: resident.id,
                requested_changes,
                reason
            });

            res.status(201).json({
                success: true,
                message: 'Đã gửi yêu cầu chỉnh sửa thành công! Vui lòng chờ BQT xử lý.',
                data: newRequest
            });
        } catch (error) {
            console.error('Error createRequest:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * [GET] /api/profile-requests/me
     * Cư dân xem yêu cầu của mình
     */
    getMyRequests: async (req, res) => {
        try {
            const resident = await Resident.findByUserId(req.user.id);
            if (!resident) {
                return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ cư dân.' });
            }

            const requests = await ProfileEditRequest.getByResidentId(resident.id);
            res.json({ success: true, data: requests });
        } catch (error) {
            console.error('Error getMyRequests:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * [GET] /api/profile-requests/all
     * BOD xem tất cả yêu cầu (pending + đã xử lý)
     */
    getAllRequests: async (req, res) => {
        try {
            const [requests, pendingCount] = await Promise.all([
                ProfileEditRequest.getAll(),
                ProfileEditRequest.getTotalPendingCount()
            ]);
            res.json({
                success: true,
                data: requests,
                totalCount: requests.length,
                pendingCount
            });
        } catch (error) {
            console.error('Error getAllRequests:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * [GET] /api/profile-requests/resident/:id
     * BOD xem yêu cầu của 1 cư dân
     */
    getRequestsByResidentId: async (req, res) => {
        try {
            const { id } = req.params;
            const requests = await ProfileEditRequest.getByResidentIdForAdmin(id);
            const pendingCount = await ProfileEditRequest.getPendingCount(id);

            res.json({
                success: true,
                data: requests,
                pendingCount
            });
        } catch (error) {
            console.error('Error getRequestsByResidentId:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * [GET] /api/profile-requests/:id
     * Lấy chi tiết 1 yêu cầu
     */
    getRequestDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const request = await ProfileEditRequest.getById(id);

            if (!request) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu.' });
            }

            res.json({ success: true, data: request });
        } catch (error) {
            console.error('Error getRequestDetail:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * [PUT] /api/profile-requests/:id/status
     * BOD cập nhật trạng thái yêu cầu
     */
    updateRequestStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, admin_note } = req.body;

            if (!['Đã duyệt', 'Từ chối'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
            }

            const request = await ProfileEditRequest.getById(id);
            if (!request) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu.' });
            }

            // Cập nhật trạng thái
            await ProfileEditRequest.updateStatus(id, status, admin_note, req.user.id);

            // Nếu duyệt, tự động cập nhật thông tin cư dân
            if (status === 'Đã duyệt' && request.requested_changes) {
                const updateData = { ...request.requested_changes };
                // Lọc bỏ các field không được phép update từ request
                delete updateData.id;
                delete updateData.user_id;
                delete updateData.apartment_id;
                delete updateData.role;

                if (Object.keys(updateData).length > 0) {
                    await Resident.update(request.resident_id, updateData);
                }
            }

            res.json({
                success: true,
                message: status === 'Đã duyệt'
                    ? 'Đã duyệt và cập nhật thông tin cư dân.'
                    : 'Đã từ chối yêu cầu.'
            });
        } catch (error) {
            console.error('Error updateRequestStatus:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = profileEditRequestController;
