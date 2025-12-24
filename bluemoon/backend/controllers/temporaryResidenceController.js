// File: backend/controllers/temporaryResidenceController.js

const TemporaryResidence = require('../models/temporaryResidenceModel');
const AuditLog = require('../models/auditModel');
const db = require('../config/db');

// Helper: Tìm Resident ID từ User ID
const getResidentIdFromUser = async (userId) => {
    const query = `SELECT id FROM residents WHERE user_id = ?`;
    const [rows] = await db.execute(query, [userId]);
    if (rows.length > 0) return rows[0].id;
    return null;
};

const temporaryResidenceController = {

    // ==========================================
    // 1. DÀNH CHO CƯ DÂN (RESIDENT)
    // ==========================================

    /**
     * [POST] /api/temporary-residence/register
     * Đăng ký Tạm trú / Tạm vắng mới
     * Yêu cầu: Upload ảnh giấy tờ (nếu có)
     */
    register: async (req, res) => {
        try {
            const { type, start_date, end_date, reason } = req.body;

            // 1. Validate
            if (!type || !start_date || !end_date || !reason) {
                return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
            }

            if (!['Tạm trú', 'Tạm vắng'].includes(type)) {
                return res.status(400).json({ message: 'Loại khai báo không hợp lệ.' });
            }

            // 2. Lấy thông tin cư dân
            const residentId = await getResidentIdFromUser(req.user.id);
            if (!residentId) {
                return res.status(403).json({ message: 'Bạn chưa có hồ sơ cư dân.' });
            }

            // 3. Xử lý file đính kèm (nếu có)
            let attachments = null;
            if (req.file) {
                attachments = `/uploads/temporary_residence/${req.file.filename}`;
            }

            // 4. Tạo đơn
            const newRecord = await TemporaryResidence.create({
                resident_id: residentId,
                type,
                start_date,
                end_date,
                reason,
                attachments
            });

            res.status(201).json({
                success: true,
                message: 'Gửi khai báo thành công! Vui lòng chờ duyệt.',
                data: newRecord
            });

        } catch (error) {
            console.error('Error register temporary residence:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [GET] /api/temporary-residence/me
     * Xem lịch sử khai báo của chính mình
     */
    getMyHistory: async (req, res) => {
        try {
            const residentId = await getResidentIdFromUser(req.user.id);
            if (!residentId) return res.status(403).json({ message: 'Không tìm thấy hồ sơ cư dân.' });

            const history = await TemporaryResidence.getByResidentId(residentId);
            res.json({ success: true, data: history });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [DELETE] /api/temporary-residence/:id
     * Hủy đơn (Chỉ được hủy khi còn ở trạng thái 'Chờ duyệt')
     */
    cancelRegistration: async (req, res) => {
        try {
            const { id } = req.params;
            const residentId = await getResidentIdFromUser(req.user.id);

            // Kiểm tra quyền sở hữu
            const record = await TemporaryResidence.getById(id);
            if (!record) return res.status(404).json({ message: 'Đơn không tồn tại.' });

            // Phải là chính chủ mới được xóa (hoặc Admin - nhưng ở đây làm cho Resident trước)
            // Lưu ý: getById trả về join bảng, cần check logic resident_id cẩn thận nếu model trả về resident_id của bảng con
            // Tuy nhiên hàm getById trong Model đang join nên cẩn thận tên cột. 
            // Tốt nhất query check đơn giản ở đây:
            const [checkOwner] = await db.execute('SELECT resident_id, status FROM temporary_residence WHERE id = ?', [id]);
            if (checkOwner.length === 0) return res.status(404).json({ message: 'Đơn không tồn tại.' });
            
            if (checkOwner[0].resident_id !== residentId) {
                return res.status(403).json({ message: 'Bạn không có quyền xóa đơn này.' });
            }

            if (checkOwner[0].status !== 'Chờ duyệt') {
                return res.status(400).json({ message: 'Chỉ được hủy đơn khi đang ở trạng thái Chờ duyệt.' });
            }

            await TemporaryResidence.delete(id);
            res.json({ success: true, message: 'Đã hủy đơn thành công.' });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // ==========================================
    // 2. DÀNH CHO QUẢN TRỊ (BOD / CÔNG AN / TỔ DÂN PHỐ)
    // ==========================================

    /**
     * [GET] /api/temporary-residence
     * Xem danh sách tất cả (Hỗ trợ lọc)
     */
    getAll: async (req, res) => {
        try {
            const filters = {
                status: req.query.status,
                type: req.query.type,
                keyword: req.query.keyword,
                startDate: req.query.startDate,
                endDate: req.query.endDate
            };

            const list = await TemporaryResidence.getAll(filters);
            res.json({ success: true, count: list.length, data: list });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [GET] /api/temporary-residence/:id
     * Xem chi tiết đơn
     */
    getDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const record = await TemporaryResidence.getById(id);

            if (!record) return res.status(404).json({ message: 'Đơn không tồn tại.' });

            res.json({ success: true, data: record });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [PUT] /api/temporary-residence/:id/status
     * Duyệt đơn (Chỉ dành cho Ban Quản Trị - BOD)
     * Công an chỉ xem chứ không duyệt trên phần mềm này (thường là BQT duyệt xong mới gửi báo cáo giấy/file cho CA)
     */
    updateStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body; // 'Đã duyệt' hoặc 'Từ chối'

            if (!['Đã duyệt', 'Từ chối'].includes(status)) {
                return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
            }

            const record = await TemporaryResidence.getById(id);
            if (!record) return res.status(404).json({ message: 'Đơn không tồn tại.' });

            // Cập nhật
            await TemporaryResidence.updateStatus(id, status, req.user.id);

            // Ghi Audit Log
            await AuditLog.create({
                user_id: req.user.id,
                action_type: 'UPDATE',
                entity_name: 'temporary_residence',
                entity_id: id,
                old_values: { status: record.status },
                new_values: { status },
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.json({ success: true, message: `Đã cập nhật trạng thái đơn thành: ${status}` });

        } catch (error) {
            console.error('Error updateStatus:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = temporaryResidenceController;