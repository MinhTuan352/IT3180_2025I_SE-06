// backend/jobs/invoiceNotifier.js

const cron = require('node-cron');
const db = require('../config/db');
const Notification = require('../models/notificationModel');

/**
 * Hàm logic chính: Tìm hóa đơn đến hạn và gửi thông báo
 */
const checkAndNotify = async () => {
    console.log('⏰ [CRON] Bắt đầu quét hóa đơn đến hạn...');
    
    const connection = await db.getConnection();
    try {
        // 1. Tìm các hóa đơn ĐẾN HẠN HÔM NAY (due_date = CURDATE())
        // VÀ chưa thanh toán
        const query = `
            SELECT f.id, f.total_amount, f.resident_id, f.billing_period, r.full_name
            FROM fees f
            JOIN residents r ON f.resident_id = r.id
            WHERE f.status = 'Chưa thanh toán' 
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
            // Nội dung thông báo
            const title = `🔔 Nhắc nhở thanh toán hóa đơn ${invoice.billing_period}`;
            const content = `Kính gửi ${invoice.full_name}, hóa đơn ${invoice.billing_period} số tiền ${parseInt(invoice.total_amount).toLocaleString('vi-VN')}đ đã đến hạn thanh toán hôm nay. Vui lòng thanh toán để tránh gián đoạn dịch vụ.`;
            
            // Tạo ID thông báo
            const notiId = `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Chuẩn bị dữ liệu để gọi Model
            const notiData = {
                id: notiId,
                title: title,
                content: content,
                type_id: 3, // Giả sử ID 3 là "Thu phí" (Theo file SQL init ban đầu)
                target: 'Cá nhân',
                created_by: 'ID0001' // Mặc định Admin hệ thống gửi
            };

            const recipients = [invoice.resident_id];

            // Gọi hàm tạo thông báo (Sử dụng Model đã có)
            await Notification.createWithTransaction(notiData, recipients, []);
            
            console.log(`   -> Đã gửi thông báo cho hóa đơn ${invoice.id} (Cư dân: ${invoice.resident_id})`);
        }

        console.log('🏁 [CRON] Hoàn tất quét hóa đơn.');

    } catch (error) {
        console.error('❌ [CRON] Lỗi khi chạy tác vụ quét hóa đơn:', error.message);
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