// backend/models/incidentModel.js

const db = require('../config/db');

const Incident = {
    
    /**
     * Lấy danh sách sự cố (Hỗ trợ nhiều bộ lọc)
     * @param {Object} filters - resident_id, status, assigned_to
     */
    getAll: async (filters = {}) => {
        try {
            // JOIN residents: Để biết ai báo
            // JOIN apartments: Để biết sự cố ở phòng nào (nếu cần hiển thị)
            // JOIN users (assigned): Để biết nhân viên nào đang xử lý
            let query = `
                SELECT 
                    rp.*, 
                    r.full_name as reporter_name, 
                    r.phone as reporter_phone,
                    a.apartment_code,
                    a.building,
                    u.username as assigned_to_name
                FROM reports rp
                JOIN residents r ON rp.reported_by = r.id
                JOIN apartments a ON r.apartment_id = a.id
                LEFT JOIN users u ON rp.assigned_to = u.id
                WHERE 1=1
            `;
            const params = [];

            // 1. Lọc theo cư dân (Cư dân chỉ xem được của mình)
            if (filters.resident_id) {
                query += ` AND rp.reported_by = ?`;
                params.push(filters.resident_id);
            }

            // 2. Lọc theo trạng thái (Admin lọc: xem các sự cố 'Mới')
            if (filters.status) {
                query += ` AND rp.status = ?`;
                params.push(filters.status);
            }

            // 3. Lọc theo nhân viên xử lý (Nhân viên xem việc mình được giao)
            if (filters.assigned_to) {
                query += ` AND rp.assigned_to = ?`;
                params.push(filters.assigned_to);
            }

            query += ` ORDER BY rp.created_at DESC`;

            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Lấy chi tiết 1 sự cố kèm ảnh minh chứng
     */
    getById: async (id) => {
        try {
            // 1. Lấy thông tin chính
            const query = `
                SELECT 
                    rp.*, 
                    r.full_name as reporter_name,
                    a.apartment_code,
                    u.username as assigned_to_name
                FROM reports rp
                JOIN residents r ON rp.reported_by = r.id
                JOIN apartments a ON r.apartment_id = a.id
                LEFT JOIN users u ON rp.assigned_to = u.id
                WHERE rp.id = ?
            `;
            const [rows] = await db.execute(query, [id]);
            if (rows.length === 0) return null;

            // 2. Lấy danh sách ảnh đính kèm
            const [attachments] = await db.execute(
                `SELECT * FROM report_attachments WHERE report_id = ?`, 
                [id]
            );

            return { ...rows[0], attachments };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Tạo báo cáo sự cố (Có Transaction để lưu ảnh)
     */
    create: async (reportData, files) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { id, title, description, location, reported_by, priority } = reportData;

            // B1: Insert vào bảng REPORTS
            const queryReport = `
                INSERT INTO reports (id, title, description, location, reported_by, priority, status)
                VALUES (?, ?, ?, ?, ?, ?, 'Mới')
            `;
            await connection.execute(queryReport, [
                id, title, description, location, reported_by, priority || 'Trung bình'
            ]);

            // B2: Insert vào bảng REPORT_ATTACHMENTS (Nếu có file)
            if (files && files.length > 0) {
                const queryFile = `INSERT INTO report_attachments (report_id, file_name, file_path, file_size) VALUES (?, ?, ?, ?)`;
                for (const file of files) {
                    await connection.execute(queryFile, [id, file.filename, file.path, file.size]);
                }
            }

            await connection.commit();
            return { id, ...reportData, attachment_count: files ? files.length : 0 };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Cập nhật trạng thái sự cố (Dành cho Admin/Nhân viên kỹ thuật)
     * Có thể cập nhật: Status, Priority, Assigned_to
     */
    update: async (id, updateData) => {
        try {
            // Chỉ cập nhật những trường được gửi lên (Dynamic Update)
            // status, priority, assigned_to
            const fields = [];
            const values = [];

            if (updateData.status) {
                fields.push('status = ?');
                values.push(updateData.status);
            }
            if (updateData.priority) {
                fields.push('priority = ?');
                values.push(updateData.priority);
            }
            if (updateData.assigned_to) {
                fields.push('assigned_to = ?');
                values.push(updateData.assigned_to);
            }

            if (fields.length === 0) return null; // Không có gì để update

            values.push(id); // Tham số cho WHERE id = ?

            const query = `UPDATE reports SET ${fields.join(', ')} WHERE id = ?`;
            await db.execute(query, values);
            
            return { id, ...updateData };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Xóa báo cáo (Chỉ cho phép xóa khi trạng thái là 'Mới' hoặc 'Đã hủy')
     */
    delete: async (id) => {
        try {
            const query = `DELETE FROM reports WHERE id = ?`;
            await db.execute(query, [id]);
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Incident;