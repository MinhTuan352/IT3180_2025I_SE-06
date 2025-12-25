// File: backend/jobs/invoiceNotifier.js

const cron = require('node-cron');
const db = require('../config/db');
const Notification = require('../models/notificationModel');
const emailService = require('../services/emailService');

/**
 * Hàm logic chính: Tìm hóa đơn đến hạn và gửi thông báo + Email
 */
const checkAndNotify = async () => {
    console.log('⏰ [CRON] Bắt đầu quét hóa đơn đến hạn...');
    
    // Lưu ý: Dùng connection riêng để query, nhưng khi gọi Notification.create thì Model đó tự quản lý connection của nó
    const connection = await db.getConnection();
    try {
        // 1. Tìm các hóa đơn ĐẾN HẠN HÔM NAY (due_date = CURDATE())
        // VÀ chưa hoàn thành (Chưa thanh toán hoặc Thanh toán 1 phần)
        const query = `
            SELECT 
                f.id, 
                f.total_amount, 
                f.amount_paid, 
                f.resident_id, 
                f.billing_period, 
                r.full_name, 
                r.email
            FROM fees f
            JOIN residents r ON f.resident_id = r.id
            WHERE f.status IN ('Chưa thanh toán', 'Thanh toán một phần')
            AND f.due_date = CURDATE()
        `;
        
        const [dueInvoices] = await connection.execute(query);

        if (dueInvoices.length === 0) {
            console.log('✅ [CRON] Không có hóa đơn nào đến hạn hôm nay.');
            return;
        }

        console.log(`🔍 [CRON] Tìm thấy ${dueInvoices.length} hóa đơn đến hạn.`);

        // 2. Gửi thông báo cho từng người
        for (const invoice of dueInvoices) {
            // Tính số tiền thực sự còn nợ
            const paid = Number(invoice.amount_paid) || 0;
            const total = Number(invoice.total_amount) || 0;
            const remaining = total - paid;

            if (remaining <= 0) continue; // Bỏ qua nếu data lỗi (đã hết nợ mà status chưa cập nhật)

            // Nội dung thông báo
            const title = `🔔 Nhắc nhở thanh toán hóa đơn ${invoice.billing_period}`;
            const content = `Kính gửi ${invoice.full_name},\nHóa đơn kỳ ${invoice.billing_period} có hạn thanh toán là HÔM NAY.\nSố tiền cần đóng: ${remaining.toLocaleString('vi-VN')} VNĐ.\nVui lòng thanh toán để tránh phát sinh phí phạt hoặc gián đoạn dịch vụ.`;
            
            // Tạo ID thông báo (Prefix AUTO để biết là do Cron chạy)
            const notiId = `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Chuẩn bị dữ liệu để gọi Model Notification
            const notiData = {
                id: notiId,
                title: title,
                content: content,
                type_id: 3, // 3 = Thu phí (Theo init.sql)
                target: 'Cá nhân',
                created_by: 'ID0001' // Mặc định Admin hệ thống (ID0001) đứng tên gửi
            };

            const recipients = [invoice.resident_id];

            // 3.1. Tạo thông báo In-App (Lưu vào DB)
            await Notification.createWithTransaction(notiData, recipients, []);
            
            // 3.2. Gửi Email nhắc nợ (Nếu cư dân có email)
            if (invoice.email) {
                try {
                    await emailService.sendDebtReminderEmail(invoice.email, invoice.full_name, {
                        amount: remaining.toLocaleString('vi-VN'),
                        description: `Hóa đơn kỳ ${invoice.billing_period} (Đến hạn hôm nay)`
                    });
                    console.log(`   📧 [EMAIL] Đã gửi nhắc nợ tới ${invoice.email}`);
                } catch (emailErr) {
                    console.error(`   ❌ [EMAIL ERROR] Không gửi được mail cho ${invoice.resident_id}:`, emailErr.message);
                }
            }
            
            console.log(`   -> Đã xử lý hóa đơn ${invoice.id} (Cư dân: ${invoice.resident_id})`);
        }

        console.log('🏁 [CRON] Hoàn tất quét hóa đơn.');

    } catch (error) {
        console.error('❌ [CRON ERROR] Lỗi khi chạy tác vụ quét hóa đơn:', error.message);
    } finally {
        connection.release();
    }
};

/**
 * Khởi động Cron Job
 */
const start = () => {
    // Cấu hình thời gian chạy: 08:00 sáng mỗi ngày
    // Cú pháp: Phút Giờ Ngày Tháng Thứ
    // '0 8 * * *' = Chạy vào phút thứ 0 của giờ thứ 8 hàng ngày
    cron.schedule('0 8 * * *', () => {
        checkAndNotify();
    }, {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh"
    });

    console.log('✅ Cron Job: Invoice Notifier đã được lên lịch (08:00 AM hàng ngày).');
};

module.exports = { start, checkAndNotify };