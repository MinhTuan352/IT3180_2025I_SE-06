// File: backend/controllers/auditController.js

const AuditLog = require('../models/auditModel');

const auditController = {
    
    /**
     * [GET] /api/audits
     * Xem nhật ký hệ thống (Chỉ BOD)
     */
    getSystemLogs: async (req, res) => {
        try {
            const filters = {
                entity_name: req.query.entity_name, // Lọc theo bảng (assets, fees...)
                action_type: req.query.action_type, // CREATE, UPDATE, DELETE
                user_id: req.query.user_id,         // Ai làm?
                start_date: req.query.start_date,
                end_date: req.query.end_date
            };

            const logs = await AuditLog.getAll(filters);

            res.json({
                success: true,
                count: logs.length,
                data: logs
            });
        } catch (error) {
            console.error('Get Audit Logs Error:', error);
            res.status(500).json({ message: 'Lỗi server khi lấy nhật ký.' });
        }
    }
};

module.exports = auditController;