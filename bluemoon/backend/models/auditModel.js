// File: backend/models/auditModel.js

const db = require('../config/db');

const AuditLog = {
    
    /**
     * Ghi lại hành động của người dùng vào hệ thống
     * Hàm này được gọi từ các Controller khi có thao tác quan trọng (Thêm/Sửa/Xóa)
     * * @param {Object} logData
     * @param {string} logData.user_id - ID người thực hiện (Lấy từ req.user.id)
     * @param {string} logData.action_type - Loại hành động: 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
     * @param {string} logData.entity_name - Tên bảng bị tác động (vd: 'assets', 'fees')
     * @param {string} logData.entity_id - ID của dòng dữ liệu bị tác động
     * @param {Object} logData.old_values - Dữ liệu cũ (Dùng cho UPDATE/DELETE)
     * @param {Object} logData.new_values - Dữ liệu mới (Dùng cho CREATE/UPDATE)
     * @param {string} logData.ip_address - IP người dùng
     * @param {string} logData.user_agent - Trình duyệt/Thiết bị
     */
    create: async (logData) => {
        try {
            const { 
                user_id, action_type, entity_name, entity_id, 
                old_values, new_values, ip_address, user_agent 
            } = logData;

            const query = `
                INSERT INTO audit_logs 
                (user_id, action_type, entity_name, entity_id, old_values, new_values, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            // Xử lý dữ liệu JSON: MySQL cần chuỗi string cho cột JSON
            // Nếu không có dữ liệu (null/undefined) thì lưu là NULL
            const oldValStr = old_values ? JSON.stringify(old_values) : null;
            const newValStr = new_values ? JSON.stringify(new_values) : null;

            await db.execute(query, [
                user_id || null, // Nếu hệ thống tự chạy cronjob thì user_id có thể null
                action_type, 
                entity_name, 
                String(entity_id), // Ép kiểu về string cho an toàn
                oldValStr, 
                newValStr, 
                ip_address || null, 
                user_agent || null
            ]);

            return true;
        } catch (error) {
            // Quan trọng: Chỉ log lỗi ra console server, KHÔNG throw error
            // Để tránh việc lỗi ghi log làm gián đoạn nghiệp vụ chính của user
            console.error('❌ [AUDIT LOG ERROR] Không thể ghi log:', error.message);
            return false;
        }
    },

    /**
     * Lấy danh sách lịch sử hoạt động (Dành cho Admin)
     * Có hỗ trợ bộ lọc để tìm kiếm nhanh
     * * @param {Object} filters - Các tiêu chí lọc (entity_name, user_id, action_type)
     */
    getAll: async (filters = {}) => {
        try {
            // JOIN với bảng users để lấy tên người thực hiện (username, email)
            let query = `
                SELECT 
                    a.*, 
                    u.username as actor_name, 
                    u.email as actor_email,
                    r.role_name as actor_role
                FROM audit_logs a
                LEFT JOIN users u ON a.user_id = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE 1=1
            `;
            const params = [];

            // 1. Lọc theo bảng (VD: Chỉ xem lịch sử sửa Tài sản)
            if (filters.entity_name) {
                query += ` AND a.entity_name = ?`;
                params.push(filters.entity_name);
            }

            // 2. Lọc theo ID đối tượng (VD: Xem lịch sử của căn hộ A-101)
            if (filters.entity_id) {
                query += ` AND a.entity_id = ?`;
                params.push(String(filters.entity_id));
            }

            // 3. Lọc theo người thực hiện (VD: Xem ông Admin A đã làm gì)
            if (filters.user_id) {
                query += ` AND a.user_id = ?`;
                params.push(filters.user_id);
            }

            // 4. Lọc theo loại hành động
            if (filters.action_type) {
                query += ` AND a.action_type = ?`;
                params.push(filters.action_type);
            }

            // Mặc định lấy mới nhất trước, giới hạn 100 dòng để tránh overload
            query += ` ORDER BY a.created_at DESC LIMIT 100`;

            const [rows] = await db.execute(query, params);
            
            // Parse ngược lại chuỗi JSON thành Object để Frontend dễ dùng
            const parsedRows = rows.map(row => ({
                ...row,
                old_values: row.old_values ? JSON.parse(row.old_values) : null,
                new_values: row.new_values ? JSON.parse(row.new_values) : null
            }));

            return parsedRows;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = AuditLog;