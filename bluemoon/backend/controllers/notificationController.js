// File: backend/controllers/notificationController.js

const Notification = require('../models/notificationModel');
const emailService = require('../services/emailService');
const db = require('../config/db');
const idGenerator = require('../utils/idGenerator');

const notificationController = {

    // [GET] /api/notifications
    getAllNotifications: async (req, res) => {
        try {
            const filters = {
                userId: req.user.id,
                role: req.user.role // 'bod' hoặc 'resident'
            };
            const notifications = await Notification.getAll(filters);
            res.json({ success: true, count: notifications.length, data: notifications });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [GET] /api/notifications/:id
    getNotificationDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const notification = await Notification.getById(id, req.user.id);
            if (!notification) return res.status(404).json({ message: 'Thông báo không tồn tại.' });
            res.json({ success: true, data: notification });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [POST] /api/notifications
    createNotification: async (req, res) => {
        try {
            const { title, content, type_id, target, target_value, scheduled_at } = req.body;

            if (!title || !content || !type_id) {
                return res.status(400).json({ message: 'Thiếu thông tin bắt buộc.' });
            }

            // [FIX REQ 32] Xử lý logic hẹn giờ
            // Nếu có scheduled_at -> is_sent = false (Chờ CronJob gửi)
            // Nếu không -> is_sent = true (Gửi ngay)
            const is_sent = scheduled_at ? false : true;

            const notiId = await idGenerator.generateDateBasedId('notifications', 'TB', 'id');
            const files = req.files || [];

            const result = await Notification.create({
                id: notiId,
                title,
                content,
                type_id,
                target,
                target_value,
                scheduled_at: scheduled_at || null,
                is_sent,
                created_by: req.user.id
            }, files);

            // [LOGIC EMAIL] Chỉ gửi ngay nếu KHÔNG hẹn giờ
            let emailCount = 0;
            if (is_sent) {
                // Lấy danh sách người nhận để gửi mail
                const recipientIds = await Notification.getRecipientIdsByTarget(target, target_value);
                
                if (recipientIds.length > 0) {
                    const placeholders = recipientIds.map(() => '?').join(',');
                    const [residents] = await db.execute(
                        `SELECT email, full_name FROM residents WHERE id IN (${placeholders}) AND email IS NOT NULL`,
                        recipientIds
                    );

                    // Gửi background (không await để API phản hồi nhanh)
                    residents.forEach(resident => {
                        emailService.sendNotificationEmail(resident.email, resident.full_name, {
                            title: title,
                            content: content,
                            type: 'Thông báo chung' // Có thể map từ type_id
                        }).catch(e => console.error(`Failed to send email to ${resident.email}:`, e.message));
                    });
                    emailCount = residents.length;
                }
            }

            res.status(201).json({
                success: true,
                message: is_sent 
                    ? `Đã gửi thông báo thành công tới ${emailCount} cư dân.` 
                    : `Đã lên lịch gửi vào lúc ${new Date(scheduled_at).toLocaleString('vi-VN')}.`,
                data: result
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    markAsRead: async (req, res) => {
        try {
            await Notification.markAsRead(req.params.id, req.user.id);
            res.json({ success: true, message: 'Đã đọc.' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    deleteNotification: async (req, res) => {
        try {
            await Notification.delete(req.params.id);
            res.json({ success: true, message: 'Đã xóa thông báo.' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = notificationController;