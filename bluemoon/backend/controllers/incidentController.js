// File: backend/controllers/incidentController.js

const Incident = require('../models/incidentModel');
const AuditLog = require('../models/auditModel');
const db = require('../config/db'); // Cần db để query ID cư dân thủ công

const incidentController = {

    // ==========================================
    // HELPER FUNCTIONS (Hàm phụ trợ)
    // ==========================================
    
    // Tìm Resident ID từ User ID (Do bảng reports lưu resident_id)
    getResidentIdFromUser: async (userId) => {
        const query = `SELECT id FROM residents WHERE user_id = ?`;
        const [rows] = await db.execute(query, [userId]);
        if (rows.length > 0) return rows[0].id;
        return null;
    },

    // ==========================================
    // 1. XEM DANH SÁCH & CHI TIẾT
    // ==========================================

    /**
     * [GET] /api/incidents
     */
    getAllIncidents: async (req, res) => {
        try {
            const filters = {};
            const userRole = req.user.role; // Lấy từ Token ('bod' hoặc 'resident')

            // PHÂN QUYỀN DỮ LIỆU
            if (userRole === 'resident') {
                // Cư dân: Chỉ xem sự cố của chính mình
                const residentId = await incidentController.getResidentIdFromUser(req.user.id);
                if (!residentId) {
                    return res.status(403).json({ message: 'Tài khoản chưa liên kết hồ sơ cư dân.' });
                }
                filters.resident_id = residentId;
            } else {
                // Admin: Xem hết, có thể lọc thêm
                if (req.query.status) filters.status = req.query.status;
                if (req.query.assigned_to) filters.assigned_to = req.query.assigned_to;
                if (req.query.keyword) filters.keyword = req.query.keyword;
            }

            const incidents = await Incident.getAll(filters);
            
            res.status(200).json({
                success: true,
                count: incidents.length,
                data: incidents
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [GET] /api/incidents/:id
     */
    getIncidentDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const incident = await Incident.getById(id);

            if (!incident) {
                return res.status(404).json({ message: 'Sự cố không tồn tại.' });
            }

            // BẢO MẬT: Cư dân A không được xem sự cố của Cư dân B
            if (req.user.role === 'resident') {
                const residentId = await incidentController.getResidentIdFromUser(req.user.id);
                // incident.reported_by là resident_id
                if (incident.reported_by !== residentId) {
                    return res.status(403).json({ message: 'Bạn không có quyền xem báo cáo này.' });
                }
            }

            res.status(200).json({ success: true, data: incident });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // ==========================================
    // 2. TẠO & CẬP NHẬT
    // ==========================================

    /**
     * [POST] /api/incidents
     * Chỉ dành cho Cư dân báo cáo
     */
    createIncident: async (req, res) => {
        try {
            // 1. Check Role
            if (req.user.role !== 'resident') {
                return res.status(403).json({ message: 'Chức năng chỉ dành cho Cư dân.' });
            }

            const { title, description, location, priority } = req.body;

            // 2. Validate
            if (!title || !description || !location) {
                return res.status(400).json({ message: 'Vui lòng điền tiêu đề, mô tả và địa điểm.' });
            }

            // 3. Lấy Resident ID
            const residentId = await incidentController.getResidentIdFromUser(req.user.id);
            if (!residentId) {
                return res.status(400).json({ message: 'Không tìm thấy hồ sơ cư dân.' });
            }

            // 4. Xử lý File ảnh (từ Multer)
            const filesData = [];
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    filesData.push({
                        filename: file.originalname,
                        path: `/uploads/incidents/${file.filename}`, // Lưu đường dẫn tương đối
                        size: file.size
                    });
                });
            }

            // 5. Tạo ID (SC + timestamp)
            const reportId = `SC${Date.now().toString().slice(-6)}`;

            const reportData = {
                id: reportId,
                title,
                description,
                location,
                priority: priority || 'Trung bình',
                reported_by: residentId
            };

            // 6. Gọi Model
            const result = await Incident.create(reportData, filesData);

            res.status(201).json({
                success: true,
                message: 'Gửi phản ánh thành công.',
                data: result
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [PUT] /api/incidents/:id
     * Xử lý đa năng:
     * - Admin: Update status, assign, response -> Ghi Audit Log
     * - Resident: Update rating, feedback -> Không cần Audit Log (hoặc tùy chọn)
     */
    updateIncident: async (req, res) => {
        try {
            const { id } = req.params;
            const userRole = req.user.role;
            const updateData = {};

            // Lấy dữ liệu cũ để check và ghi log
            const oldIncident = await Incident.getById(id);
            if (!oldIncident) return res.status(404).json({ message: 'Sự cố không tồn tại.' });

            // LOGIC CẬP NHẬT THEO VAI TRÒ
            if (userRole === 'bod') {
                // --- ADMIN ---
                const { status, priority, assigned_to, admin_response } = req.body;
                
                if (status) updateData.status = status;
                if (priority) updateData.priority = priority;
                if (assigned_to) updateData.assigned_to = assigned_to;
                if (admin_response) updateData.admin_response = admin_response;

            } else if (userRole === 'resident') {
                // --- CƯ DÂN ---
                // Chỉ được đánh giá khi sự cố đã hoàn thành
                if (oldIncident.status !== 'Hoàn thành') {
                    return res.status(400).json({ message: 'Chỉ được đánh giá khi sự cố đã xử lý xong.' });
                }

                // Check quyền sở hữu
                const residentId = await incidentController.getResidentIdFromUser(req.user.id);
                if (oldIncident.reported_by !== residentId) {
                    return res.status(403).json({ message: 'Bạn không có quyền đánh giá sự cố này.' });
                }

                const { rating, feedback } = req.body;
                if (rating) updateData.rating = rating;
                if (feedback) updateData.feedback = feedback;

            } else {
                return res.status(403).json({ message: 'Không có quyền thực hiện.' });
            }

            // Gọi Model update
            const result = await Incident.update(id, updateData);

            if (!result) return res.status(400).json({ message: 'Không có dữ liệu nào thay đổi.' });

            // [AUDIT LOG] Chỉ ghi log khi Admin thao tác (Thay đổi trạng thái/phản hồi)
            if (userRole === 'bod' || userRole === 'admin') {
                AuditLog.create({
                    user_id: req.user.id,
                    action_type: 'UPDATE',
                    entity_name: 'reports',
                    entity_id: id,
                    old_values: { 
                        status: oldIncident.status, 
                        priority: oldIncident.priority,
                        assigned_to: oldIncident.assigned_to
                    },
                    new_values: updateData,
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent']
                });
            }

            res.status(200).json({
                success: true,
                message: 'Cập nhật thành công.',
                data: result
            });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = incidentController;