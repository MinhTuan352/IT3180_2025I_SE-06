// File: backend/models/notificationModel.js

const db = require('../config/db');

const Notification = {
    
    // ===========================
    // 1. LẤY DANH SÁCH
    // ===========================

    /**
     * Lấy danh sách thông báo
     * @param {Object} filters - userId (để lọc xem ai đang request), role (admin hay resident)
     */
    getAll: async (filters = {}) => {
        try {
            let query = '';
            let params = [];

            if (filters.role === 'resident') {
                // CƯ DÂN: Chỉ xem các thông báo được gửi cho mình (trong bảng recipients)
                // JOIN notification_recipients để kiểm tra
                query = `
                    SELECT 
                        n.*, 
                        nt.type_name,
                        nr.is_read, 
                        nr.read_at
                    FROM notifications n
                    JOIN notification_types nt ON n.type_id = nt.id
                    JOIN notification_recipients nr ON n.id = nr.notification_id
                    WHERE nr.recipient_id = ? AND n.is_sent = TRUE
                    ORDER BY n.created_at DESC
                `;
                params.push(filters.userId);
            } else {
                // ADMIN: Xem toàn bộ thông báo đã tạo
                query = `
                    SELECT 
                        n.*, 
                        nt.type_name,
                        u.username as created_by_name
                    FROM notifications n
                    JOIN notification_types nt ON n.type_id = nt.id
                    JOIN users u ON n.created_by = u.id
                    ORDER BY n.created_at DESC
                `;
            }

            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Lấy chi tiết 1 thông báo (Kèm file đính kèm)
     */
    getById: async (id, userId = null) => {
        try {
            // 1. Lấy thông tin chung
            let query = `
                SELECT n.*, nt.type_name 
                FROM notifications n
                JOIN notification_types nt ON n.type_id = nt.id
                WHERE n.id = ?
            `;
            const [rows] = await db.execute(query, [id]);
            if (rows.length === 0) return null;
            
            const notification = rows[0];

            // 2. Lấy danh sách file đính kèm
            const [attachments] = await db.execute(
                `SELECT * FROM notification_attachments WHERE notification_id = ?`, 
                [id]
            );

            // 3. Nếu là Cư dân xem -> Đánh dấu trạng thái 'is_read' của riêng họ
            let readStatus = null;
            if (userId) {
                const [recipient] = await db.execute(
                    `SELECT is_read, read_at FROM notification_recipients WHERE notification_id = ? AND recipient_id = ?`,
                    [id, userId]
                );
                if (recipient.length > 0) readStatus = recipient[0];
            }

            return { 
                ...notification, 
                attachments, 
                read_status: readStatus 
            };

        } catch (error) {
            throw error;
        }
    },

    // ===========================
    // 2. TẠO MỚI (TRANSACTION)
    // ===========================

    createWithTransaction: async (notiData, recipients, files) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { id, title, content, type_id, target, created_by } = notiData;

            // B1: Insert bảng NOTIFICATIONS
            const queryNoti = `
                INSERT INTO notifications (id, title, content, type_id, target, created_by, is_sent)
                VALUES (?, ?, ?, ?, ?, ?, TRUE) 
            `; 
            // Lưu ý: Tạm thời set is_sent = TRUE (gửi ngay). Nếu làm chức năng hẹn giờ thì set FALSE.
            await connection.execute(queryNoti, [id, title, content, type_id, target, created_by]);

            // B2: Insert bảng NOTIFICATION_ATTACHMENTS (Nếu có file)
            if (files && files.length > 0) {
                const queryFile = `INSERT INTO notification_attachments (notification_id, file_name, file_path, file_size) VALUES (?, ?, ?, ?)`;
                for (const file of files) {
                    await connection.execute(queryFile, [id, file.filename, file.path, file.size]);
                }
            }

            // B3: Insert bảng NOTIFICATION_RECIPIENTS (Bulk Insert)
            // Nếu danh sách người nhận > 0
            if (recipients && recipients.length > 0) {
                // Tạo câu lệnh INSERT nhiều dòng: VALUES (id, u1), (id, u2), (id, u3)...
                // Cách tối ưu cho MySQL
                const recipientValues = recipients.map(rId => [id, rId]); // Mảng 2 chiều [[id, 'R01'], [id, 'R02']]
                
                const queryRecipient = `INSERT INTO notification_recipients (notification_id, recipient_id) VALUES ?`;
                
                // mysql2 hỗ trợ bulk insert thông qua phương thức query (không phải execute)
                await connection.query(queryRecipient, [recipientValues]);
            }

            await connection.commit();
            return { id, ...notiData, attachment_count: files.length, recipient_count: recipients.length };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // ===========================
    // 3. TÁC VỤ KHÁC
    // ===========================

    markAsRead: async (notificationId, residentId) => {
        try {
            const query = `
                UPDATE notification_recipients 
                SET is_read = TRUE, read_at = NOW() 
                WHERE notification_id = ? AND recipient_id = ?
            `;
            await db.execute(query, [notificationId, residentId]);
        } catch (error) {
            throw error;
        }
    },

    // Helper: Lấy danh sách ID cư dân dựa trên tiêu chí (Để dùng khi target = 'Tất cả' hoặc 'Tòa nhà')
    getRecipientIdsByTarget: async (targetType, targetValue) => {
        try {
            let query = `SELECT id FROM residents WHERE status = 'Đang sinh sống'`;
            let params = [];

            if (targetType === 'Theo tòa nhà' && targetValue) {
                // targetValue ví dụ: 'A' (Tòa A)
                // Cần JOIN bảng apartments để lọc building
                query = `
                    SELECT r.id FROM residents r
                    JOIN apartments a ON r.apartment_id = a.id
                    WHERE r.status = 'Đang sinh sống' AND a.building = ?
                `;
                params.push(targetValue);
            }
            // Nếu targetType === 'Tất cả Cư dân' thì không cần thêm điều kiện

            const [rows] = await db.execute(query, params);
            return rows.map(row => row.id); // Trả về mảng ['R001', 'R002']
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Notification;