// backend/controllers/incidentController.js

const Incident = require('../models/incidentModel');
const db = require('../config/db'); // Cần db để query ID cư dân

const incidentController = {

    // Helper: Tìm Resident ID từ User ID
    // (Vì bảng reports yêu cầu reported_by là resident_id chứ không phải user_id)
    getResidentIdFromUser: async (userId) => {
        const query = `SELECT id FROM residents WHERE user_id = ?`;
        const [rows] = await db.execute(query, [userId]);
        if (rows.length > 0) return rows[0].id;
        return null;
    },

    // [GET] /api/incidents
    getAllIncidents: async (req, res) => {
        try {
            const filters = {};

            // 1. Phân quyền xem dữ liệu
            if (req.user.role === 'resident') {
                // Nếu là cư dân -> Chỉ xem của mình
                const residentId = await incidentController.getResidentIdFromUser(req.user.id);
                if (!residentId) return res.status(403).json({ message: 'Tài khoản này chưa được liên kết với hồ sơ cư dân.' });
                
                filters.resident_id = residentId;
            } else {
                // Nếu là Admin/BOD -> Có thể lọc theo trạng thái gửi lên từ URL
                // VD: ?status=Mới
                if (req.query.status) filters.status = req.query.status;
                if (req.query.assigned_to) filters.assigned_to = req.query.assigned_to;
            }

            const incidents = await Incident.getAll(filters);
            res.json({ success: true, count: incidents.length, data: incidents });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [GET] /api/incidents/:id
    getIncidentDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const incident = await Incident.getById(id);

            if (!incident) {
                return res.status(404).json({ message: 'Sự cố không tồn tại.' });
            }

            // Bảo mật: Cư dân A không được xem sự cố của Cư dân B
            if (req.user.role === 'resident') {
                const residentId = await incidentController.getResidentIdFromUser(req.user.id);
                if (incident.reported_by !== residentId) {
                    return res.status(403).json({ message: 'Bạn không có quyền xem báo cáo này.' });
                }
            }

            res.json({ success: true, data: incident });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [POST] /api/incidents - Tạo báo cáo mới
    createIncident: async (req, res) => {
        try {
            const { title, description, location, priority } = req.body;

            // 1. Validate input
            if (!title || !description || !location) {
                return res.status(400).json({ message: 'Vui lòng điền tiêu đề, mô tả và địa điểm.' });
            }

            // 2. Xác định người báo cáo (Resident ID)
            // Chỉ cư dân mới được báo cáo (Theo logic DB)
            if (req.user.role !== 'resident') {
                // Mở rộng: Nếu Admin muốn báo thay, cần logic khác. Tạm thời chặn.
                return res.status(403).json({ message: 'Chức năng này dành cho Cư dân báo cáo.' });
            }

            const residentId = await incidentController.getResidentIdFromUser(req.user.id);
            if (!residentId) {
                return res.status(400).json({ message: 'Không tìm thấy hồ sơ cư dân liên kết với tài khoản này.' });
            }

            // 3. Xử lý File ảnh (nếu có)
            const filesData = [];
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    filesData.push({
                        filename: file.originalname,
                        // Lưu vào folder incidents
                        path: `/uploads/incidents/${file.filename}`,
                        size: file.size
                    });
                });
            }

            // 4. Tạo ID (SC + timestamp)
            const reportId = `SC${Date.now().toString().slice(-6)}`;

            const reportData = {
                id: reportId,
                title,
                description,
                location,
                priority: priority || 'Trung bình',
                reported_by: residentId
            };

            // 5. Gọi Model
            const result = await Incident.create(reportData, filesData);

            res.status(201).json({
                success: true,
                message: 'Gửi phản ánh thành công!',
                data: result
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server khi tạo phản ánh.', error: error.message });
        }
    },

    // [PUT] /api/incidents/:id - Cập nhật trạng thái (Admin)
    updateIncidentStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, priority, assigned_to } = req.body;

            // Validate: Ít nhất phải có 1 trường để update
            if (!status && !priority && !assigned_to) {
                return res.status(400).json({ message: 'Không có dữ liệu cập nhật.' });
            }

            const updateData = {};
            if (status) updateData.status = status;
            if (priority) updateData.priority = priority;
            if (assigned_to) updateData.assigned_to = assigned_to;

            const result = await Incident.update(id, updateData);

            if (!result) return res.status(404).json({ message: 'Sự cố không tồn tại.' });

            res.json({
                success: true,
                message: 'Cập nhật trạng thái thành công.',
                data: result
            });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = incidentController;