// File: backend/jobs/cronJob.js

const cron = require('node-cron');
const db = require('../config/db');
const emailService = require('../services/emailService');

const CronJob = {
    
    // =================================================================
    // 1. QUÉT HÓA ĐƠN ĐẾN HẠN (Chạy 08:00 mỗi ngày)
    // =================================================================
    scanOverdueInvoices: async () => {
        console.log('⏰ [CRON-INVOICE] Bắt đầu quét hóa đơn đến hạn...');
        const connection = await db.getConnection();
        
        try {
            // Lấy hóa đơn chưa trả hết VÀ đến hạn hôm nay
            const [invoices] = await connection.execute(`
                SELECT f.id, f.total_amount, f.amount_paid, f.resident_id, f.billing_period, 
                       r.full_name, r.email
                FROM fees f
                JOIN residents r ON f.resident_id = r.id
                WHERE f.status IN ('Chưa thanh toán', 'Thanh toán một phần') 
                AND f.due_date = CURDATE()
            `);

            if (invoices.length === 0) {
                console.log('✅ [CRON-INVOICE] Không có hóa đơn nào đến hạn.');
                return;
            }

            for (const inv of invoices) {
                const remaining = inv.total_amount - inv.amount_paid;
                
                // 1. Tạo thông báo In-App
                const notiId = `AUTO-FEE-${Date.now()}-${inv.id}`;
                const title = `🔔 Nhắc thanh toán: ${inv.billing_period}`;
                const content = `Hóa đơn ${inv.billing_period} hết hạn hôm nay. Số tiền: ${remaining.toLocaleString()}đ.`;

                await connection.execute(
                    `INSERT INTO notifications (id, title, content, type_id, target, created_by, is_sent) 
                     VALUES (?, ?, ?, 3, 'Cá nhân', 'SYSTEM', TRUE)`,
                    [notiId, title, content]
                );
                
                await connection.execute(
                    `INSERT INTO notification_recipients (notification_id, recipient_id) VALUES (?, ?)`,
                    [notiId, inv.resident_id]
                );

                // 2. Gửi Email
                if (inv.email) {
                    try {
                        await emailService.sendDebtReminderEmail(inv.email, inv.full_name, {
                            amount: remaining.toLocaleString(),
                            description: `Hóa đơn kỳ ${inv.billing_period}`
                        });
                        console.log(`📧 [EMAIL] Đã gửi nhắc nợ tới ${inv.email}`);
                    } catch (err) {
                        console.error(`❌ [EMAIL] Lỗi gửi mail: ${err.message}`);
                    }
                }
            }
        } catch (error) {
            console.error('❌ [CRON-INVOICE] Lỗi:', error.message);
        } finally {
            connection.release();
        }
    },

    // =================================================================
    // 2. NHẮC LỊCH BẢO TRÌ (Chạy 07:00 mỗi ngày)
    // =================================================================
    scanMaintenanceSchedules: async () => {
        console.log('⏰ [CRON-MAINTENANCE] Quét lịch bảo trì sắp tới...');
        const connection = await db.getConnection();

        try {
            // Lấy lịch bảo trì dự kiến vào NGÀY MAI (để nhắc trước 1 ngày)
            // Hoặc nhắc ngày hôm nay (tùy nhu cầu, ở đây là nhắc hôm nay)
            const [schedules] = await connection.execute(`
                SELECT m.*, a.name as asset_name, a.location
                FROM maintenance_schedules m
                JOIN assets a ON m.asset_id = a.id
                WHERE m.scheduled_date = CURDATE() 
                AND m.status = 'Lên lịch'
            `);

            if (schedules.length > 0) {
                console.log(`🔍 Có ${schedules.length} tài sản cần bảo trì hôm nay.`);

                // Gửi thông báo cho toàn bộ BOD
                const [admins] = await connection.execute(`
                    SELECT u.id FROM users u 
                    JOIN roles r ON u.role_id = r.id 
                    WHERE r.role_code = 'bod'
                `);

                for (const item of schedules) {
                    const notiId = await idGenerator.generateDateBasedId('notifications', 'TB', 'id', connection);
                    const title = `🛠️ Nhắc lịch bảo trì: ${item.asset_name}`;
                    const content = `Hôm nay có lịch bảo trì cho "${item.asset_name}" tại ${item.location}.\nĐơn vị: ${item.technician_name || 'Nội bộ'}.`;

                    await connection.execute(
                        `INSERT INTO notifications (id, title, content, type_id, target, created_by, is_sent) 
                         VALUES (?, ?, ?, 1, 'Cá nhân', 'SYSTEM', TRUE)`,
                        [notiId, title, content]
                    );

                    // Insert cho tất cả Admin
                    for (const admin of admins) {
                        await connection.execute(
                            `INSERT INTO notification_recipients (notification_id, recipient_id) VALUES (?, ?)`,
                            [notiId, admin.id]
                        );
                    }
                }
            } else {
                console.log('✅ [CRON-MAINTENANCE] Không có lịch bảo trì hôm nay.');
            }

        } catch (error) {
            console.error('❌ [CRON-MAINTENANCE] Lỗi:', error.message);
        } finally {
            connection.release();
        }
    },

    // =================================================================
    // 3. GỬI THÔNG BÁO HẸN GIỜ (Chạy mỗi 1 phút)
    // =================================================================
    scanScheduledNotifications: async () => {
        // Không log console để tránh spam terminal mỗi phút
        const connection = await db.getConnection();

        try {
            // Lấy thông báo chưa gửi (is_sent = 0) và đã đến giờ (scheduled_at <= NOW)
            const [notis] = await connection.execute(`
                SELECT id, title, target 
                FROM notifications 
                WHERE is_sent = FALSE 
                AND scheduled_at <= NOW()
            `);

            if (notis.length > 0) {
                console.log(`⏰ [CRON-NOTI] Phát hiện ${notis.length} thông báo hẹn giờ cần gửi.`);

                for (const noti of notis) {
                    // 1. Cập nhật trạng thái thành Đã gửi
                    await connection.execute(
                        `UPDATE notifications SET is_sent = TRUE WHERE id = ?`, 
                        [noti.id]
                    );

                    // 2. Nếu logic gửi Email/Push Notification nằm ở đây thì gọi Service
                    // Ví dụ: Nếu gửi cho Tất cả cư dân -> Query lấy email resident -> Gửi
                    
                    console.log(`   -> Đã publish thông báo: "${noti.title}"`);
                }
            }

        } catch (error) {
            console.error('❌ [CRON-NOTI] Lỗi:', error.message);
        } finally {
            connection.release();
        }
    },

    // =================================================================
    // HÀM KHỞI ĐỘNG TẤT CẢ CRON
    // =================================================================
    start: () => {
        console.log('🚀 [SYSTEM] Cron Jobs đã được khởi động...');

        // 1. Quét Hóa đơn: 08:00 Sáng hàng ngày
        cron.schedule('0 8 * * *', CronJob.scanOverdueInvoices, { timezone: "Asia/Ho_Chi_Minh" });

        // 2. Quét Bảo trì: 07:00 Sáng hàng ngày
        cron.schedule('0 7 * * *', CronJob.scanMaintenanceSchedules, { timezone: "Asia/Ho_Chi_Minh" });

        // 3. Quét Thông báo hẹn giờ: Mỗi phút 1 lần
        cron.schedule('* * * * *', CronJob.scanScheduledNotifications, { timezone: "Asia/Ho_Chi_Minh" });
    }
};

module.exports = CronJob;