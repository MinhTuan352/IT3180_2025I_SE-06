// File: backend/models/incidentModel.js

const db = require('../config/db');

const Incident = {
    
    /**
     * Lấy danh sách sự cố (Hỗ trợ nhiều bộ lọc)
     * @param {Object} filters - resident_id, status, assigned_to
     */
    getAll: async (filters = {}) => {
        try {
            // JOIN residents: Để biết ai báo
            // JOIN apartments: Để biết sự cố ở phòng nào
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

            // 2. Lọc theo trạng thái
            if (filters.status) {
                query += ` AND rp.status = ?`;
                params.push(filters.status);
            }

            // 3. Lọc theo nhân viên xử lý
            if (filters.assigned_to) {
                query += ` AND rp.assigned_to = ?`;
                params.push(filters.assigned_to);
            }

            // 4. Tìm kiếm theo tiêu đề (nếu cần)
            if (filters.keyword) {
                query += ` AND rp.title LIKE ?`;
                params.push(`%${filters.keyword}%`);
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
                    r.user_id as reporter_user_id,
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
     * Tạo báo cáo sự cố (Có Transaction để lưu ảnh an toàn)
     */
    create: async (reportData, files) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { id, title, description, location, reported_by, priority } = reportData;

            // Lưu ý: Có 2 dấu ? cho title, desc... sửa lại cú pháp cho đúng:
            const insertQuery = `
                 INSERT INTO reports (id, title, description, location, reported_by, priority, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'Mới')
            `;

            await connection.execute(insertQuery, [
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
     * Cập nhật sự cố (Dùng chung cho cả Admin và Cư dân)
     * - Admin update: status, priority, assigned_to, admin_response, completed_at
     * - Cư dân update: rating, feedback
     */
    update: async (id, updateData) => {
        try {
            // Xây dựng câu query động chỉ update các trường được gửi lên
            const fields = [];
            const values = [];

            // --- Nhóm Admin/BOD ---
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
            if (updateData.admin_response) {
                fields.push('admin_response = ?');
                values.push(updateData.admin_response);
            }
            // Tự động set thời gian hoàn thành nếu trạng thái là 'Hoàn thành'
            if (updateData.status === 'Hoàn thành') {
                fields.push('completed_at = NOW()');
            }

            // --- Nhóm Cư dân (Đánh giá) ---
            if (updateData.rating) {
                fields.push('rating = ?');
                values.push(updateData.rating);
            }
            if (updateData.feedback) {
                fields.push('feedback = ?');
                values.push(updateData.feedback);
            }

            if (fields.length === 0) return null; // Không có gì để update

            values.push(id); // Tham số cuối cùng cho WHERE id = ?

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