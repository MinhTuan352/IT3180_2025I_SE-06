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
                        u.username as creator_name,
                        (SELECT COUNT(*) FROM notification_recipients nr WHERE nr.notification_id = n.id) as recipient_count
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

    getById: async (id, userId) => {
        try {
            // Lấy thông tin chính
            const [rows] = await db.execute(`
                SELECT n.*, nt.type_name, u.username as creator_name
                FROM notifications n
                JOIN notification_types nt ON n.type_id = nt.id
                JOIN users u ON n.created_by = u.id
                WHERE n.id = ?
            `, [id]);

            if (rows.length === 0) return null;
            const notification = rows[0];

            // Lấy file đính kèm
            const [attachments] = await db.execute(`
                SELECT * FROM notification_attachments WHERE notification_id = ?
            `, [id]);

            return { ...notification, attachments };
        } catch (error) {
            throw error;
        }
    },

    // ===========================
    // 2. TẠO MỚI (FIX LỖI BIND PARAMETERS)
    // ===========================

    create: async (data, files) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { id, title, content, type_id, target, target_value, scheduled_at, is_sent, created_by } = data;

            // 1. Tạo Notification
            // [FIXED] Dùng toán tử || null để tránh undefined
            await connection.execute(`
                INSERT INTO notifications (id, title, content, type_id, target, target_value, scheduled_at, is_sent, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id, 
                title, 
                content, 
                type_id, 
                target, 
                target_value || null,  // Nếu không có target_value thì truyền null
                scheduled_at || null,  // Nếu không có scheduled_at thì truyền null
                is_sent, 
                created_by
            ]);

            // 2. Lưu Attachments (Nếu có)
            if (files && files.length > 0) {
                for (const file of files) {
                    await connection.execute(`
                        INSERT INTO notification_attachments (notification_id, file_name, file_path, file_size)
                        VALUES (?, ?, ?, ?)
                    `, [id, file.originalname, `/uploads/notifications/${file.filename}`, file.size]);
                }
            }

            // 3. Tạo danh sách người nhận (Recipients)
            // Lấy ID cư dân phù hợp
            const recipientIds = await Notification.getRecipientIdsByTarget(target, target_value);
            
            if (recipientIds.length > 0) {
                // Bulk Insert recipients
                // Cú pháp: INSERT INTO ... VALUES (id, r1), (id, r2)...
                const values = recipientIds.map(rid => [id, rid]);
                
                // MySQL2 helper `query` hỗ trợ bulk insert mảng 2 chiều tốt hơn execute
                await connection.query(
                    `INSERT INTO notification_recipients (notification_id, recipient_id) VALUES ?`,
                    [values]
                );
            }

            await connection.commit();
            return { id, ...data };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    delete: async (id) => {
        await db.execute('DELETE FROM notifications WHERE id = ?', [id]);
    },

    markAsRead: async (notiId, userId) => {
        // Cần tìm resident_id từ user_id trước
        const [res] = await db.execute('SELECT id FROM residents WHERE user_id = ?', [userId]);
        if (res.length > 0) {
            await db.execute(`
                UPDATE notification_recipients SET is_read = TRUE, read_at = NOW()
                WHERE notification_id = ? AND recipient_id = ?
            `, [notiId, res[0].id]);
        }
    },

    // Helper: Lấy danh sách ID cư dân dựa trên tiêu chí
    getRecipientIdsByTarget: async (targetType, targetValue) => {
        try {
            // Luôn đặt alias là 'r' để tránh lỗi 'Unknown column r.status'
            let baseQuery = `SELECT r.id FROM residents r WHERE r.status IN ('Đang sinh sống', 'Tạm vắng')`;
            let params = [];

            if (targetType === 'Theo tòa nhà' && targetValue) {
                // targetValue = 'A'
                baseQuery += ` AND r.apartment_id IN (SELECT id FROM apartments WHERE building = ?)`;
                params.push(targetValue);
            } 
            else if (targetType === 'Theo căn hộ' && targetValue) {
                // targetValue = 'A-101'
                baseQuery += ` AND r.apartment_id IN (SELECT id FROM apartments WHERE apartment_code = ?)`;
                params.push(targetValue);
            } 
            else if (targetType === 'Cá nhân' && targetValue) {
                return [targetValue];
            }
            // Nếu targetType === 'Tất cả Cư dân', query sẽ giữ nguyên baseQuery -> Lấy tất cả

            const [rows] = await db.execute(baseQuery, params);
            return rows.map(row => row.id);
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Notification;