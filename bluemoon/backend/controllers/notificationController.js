// File: backend/controllers/notificationController.js

const Notification = require('../models/notificationModel');
const emailService = require('../services/emailService');
const db = require('../config/db');

const notificationController = {

    // [GET] /api/notifications
    getAllNotifications: async (req, res) => {
        try {
            const filters = {
                userId: req.user.id,
                role: req.user.role // 'bod' hoặc 'resident'
            };
            const notifications = await Notification.getAll(filters);

            res.json({
                success: true,
                count: notifications.length,
                data: notifications
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [GET] /api/notifications/:id
    getNotificationDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const notification = await Notification.getById(id, req.user.id);

            if (!notification) {
                return res.status(404).json({ message: 'Thông báo không tồn tại.' });
            }

            res.json({ success: true, data: notification });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [POST] /api/notifications - Tạo thông báo mới (Kèm file)
    createNotification: async (req, res) => {
        try {
            // 1. Lấy dữ liệu Text
            const { title, content, type_id, target, specific_recipient_id, target_value } = req.body;
            // target: 'Tất cả Cư dân', 'Theo tòa nhà', 'Cá nhân'
            // target_value: 'A' (nếu chọn tòa nhà)
            // specific_recipient_id: 'R001' (nếu chọn cá nhân)

            if (!title || !content || !type_id || !target) {
                return res.status(400).json({ message: 'Vui lòng điền đầy đủ tiêu đề, nội dung và đối tượng nhận.' });
            }

            // 2. Lấy danh sách Người nhận (Recipients)
            let recipients = [];

            if (target === 'Cá nhân') {
                if (!specific_recipient_id) return res.status(400).json({ message: 'Vui lòng chọn người nhận.' });
                recipients = [specific_recipient_id];
            } else {
                // Nếu là 'Tất cả Cư dân' hoặc 'Theo tòa nhà'
                recipients = await Notification.getRecipientIdsByTarget(target, target_value);
            }

            if (recipients.length === 0) {
                return res.status(400).json({ message: 'Không tìm thấy cư dân nào phù hợp với nhóm đối tượng đã chọn.' });
            }

            // 3. Xử lý File (nếu có)
            // req.files được Multer tạo ra
            const filesData = [];
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    filesData.push({
                        filename: file.originalname,
                        // Lưu đường dẫn tương đối để Frontend dễ hiển thị
                        // Ví dụ: /uploads/notifications/17000000-image.jpg
                        path: `/uploads/notifications/${file.filename}`,
                        size: file.size
                    });
                });
            }

            // 4. Tạo ID cho thông báo (TB + timestamp)
            const notiId = `TB${Date.now().toString().slice(-6)}`;

            const notiData = {
                id: notiId,
                title,
                content,
                type_id,
                target,
                created_by: req.user.id
            };

            // 5. Gọi Model transaction
            const result = await Notification.createWithTransaction(notiData, recipients, filesData);

            // 6. [MỚI] Gửi email đến tất cả cư dân có email (chạy background, không block response)
            // Lấy thông tin loại thông báo
            let notificationType = 'Chung';
            try {
                const [types] = await db.execute('SELECT type_name FROM notification_types WHERE id = ?', [type_id]);
                if (types.length > 0) notificationType = types[0].type_name;
            } catch (e) { /* ignore */ }

            // Lấy danh sách email của recipients
            const placeholders = recipients.map(() => '?').join(',');
            const [residentsWithEmail] = await db.execute(
                `SELECT id, full_name, email FROM residents WHERE id IN (${placeholders}) AND email IS NOT NULL AND email != ''`,
                recipients
            );

            // Gửi email background (không await để response nhanh)
            const emailPromises = residentsWithEmail.map(resident =>
                emailService.sendNotificationEmail(resident.email, resident.full_name, {
                    title,
                    content,
                    type: notificationType
                }).catch(err => {
                    console.error(`[EMAIL] Failed to send to ${resident.email}:`, err.message);
                    return { success: false, email: resident.email };
                })
            );

            // Chạy gửi email background
            Promise.all(emailPromises).then(results => {
                const sent = results.filter(r => r && r.success).length;
                console.log(`[EMAIL] Notification emails sent: ${sent}/${residentsWithEmail.length}`);
            });

            res.status(201).json({
                success: true,
                message: `Gửi thông báo thành công! (${residentsWithEmail.length} email sẽ được gửi)`,
                data: result,
                emailCount: residentsWithEmail.length
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server khi tạo thông báo.', error: error.message });
        }
    },

    // [PUT] /api/notifications/:id/read - Đánh dấu đã đọc
    markAsRead: async (req, res) => {
        try {
            const { id } = req.params;
            await Notification.markAsRead(id, req.user.id);
            res.json({ success: true, message: 'Đã đánh dấu đã đọc.' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = notificationController;