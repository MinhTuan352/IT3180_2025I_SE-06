// File: backend/services/emailService.js

const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Debug: Log email config (chỉ hiện khi có lỗi)
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

// Log để debug
console.log('[EMAIL SERVICE] Loaded config:', {
    EMAIL_USER: emailUser ? `${emailUser.substring(0, 5)}...` : 'NOT SET',
    EMAIL_PASS: emailPass ? '***SET***' : 'NOT SET'
});

// Tạo transporter với cấu hình Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

const emailService = {
    /**
     * Gửi email mật khẩu tạm cho chức năng Quên mật khẩu
     */
    sendPasswordResetEmail: async (toEmail, tempPassword, username) => {
        const mailOptions = {
            from: `"BlueMoon Apartment" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: '[BlueMoon] Mật khẩu mới của bạn',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">🏠 BlueMoon Apartment</h1>
                    </div>
                    <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333;">Xin chào ${username || 'Quý cư dân'},</h2>
                        <p style="color: #666; font-size: 16px;">Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #1976d2; margin: 20px 0;">
                            <p style="margin: 0; color: #666;">Mật khẩu mới của bạn là:</p>
                            <h2 style="color: #1976d2; letter-spacing: 3px; font-family: monospace; margin: 10px 0;">${tempPassword}</h2>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            ⚠️ <strong>Lưu ý quan trọng:</strong> Vui lòng đăng nhập và đổi mật khẩu ngay sau khi nhận được email này để đảm bảo an toàn cho tài khoản.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ Ban Quản Trị.
                            <br><br>
                            © 2024 BlueMoon Apartment Management System
                        </p>
                    </div>
                </div>
            `
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('[EMAIL] Password reset email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('[EMAIL ERROR]', error);
            throw error;
        }
    },

    /**
     * Gửi email nhắc nhở nợ phí
     */
    sendDebtReminderEmail: async (toEmail, residentName, debtInfo) => {
        const mailOptions = {
            from: `"BlueMoon Apartment" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: '[BlueMoon] Nhắc nhở thanh toán phí',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #ff9800 0%, #ffc107 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">🏠 BlueMoon Apartment</h1>
                    </div>
                    <div style="background: #fff3e0; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333;">Kính gửi ${residentName},</h2>
                        <p style="color: #666; font-size: 16px;">Chúng tôi xin thông báo bạn có khoản phí chưa thanh toán:</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 20px 0;">
                            <p style="margin: 0; color: #666;">Số tiền còn nợ:</p>
                            <h2 style="color: #f57c00; margin: 10px 0;">${debtInfo.amount} VNĐ</h2>
                            <p style="margin: 0; color: #888; font-size: 14px;">${debtInfo.description || ''}</p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            Vui lòng thanh toán trong thời gian sớm nhất để tránh phát sinh thêm phí phạt.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            © 2024 BlueMoon Apartment Management System
                        </p>
                    </div>
                </div>
            `
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('[EMAIL] Debt reminder sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('[EMAIL ERROR]', error);
            throw error;
        }
    },

    /**
     * Gửi email thông báo chung từ Ban Quản Trị
     */
    sendNotificationEmail: async (toEmail, residentName, notificationInfo) => {
        // Xác định màu sắc dựa trên loại thông báo
        const typeColors = {
            'Khẩn cấp': { gradient: '#f44336, #e91e63', bg: '#ffebee', border: '#f44336', icon: '🚨' },
            'Chung': { gradient: '#1976d2, #42a5f5', bg: '#e3f2fd', border: '#1976d2', icon: '📢' },
            'Thu phí': { gradient: '#ff9800, #ffc107', bg: '#fff3e0', border: '#ff9800', icon: '💰' }
        };
        const colors = typeColors[notificationInfo.type] || typeColors['Chung'];

        const mailOptions = {
            from: `"BlueMoon Apartment" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `[BlueMoon] ${notificationInfo.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, ${colors.gradient}); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">${colors.icon} BlueMoon Apartment</h1>
                    </div>
                    <div style="background: ${colors.bg}; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333;">Kính gửi ${residentName},</h2>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${colors.border}; margin: 20px 0;">
                            <h3 style="color: #333; margin: 0 0 15px 0;">${notificationInfo.title}</h3>
                            <p style="color: #666; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${notificationInfo.content}</p>
                        </div>
                        
                        <p style="color: #888; font-size: 13px; margin-top: 20px;">
                            📅 Thời gian gửi: ${new Date().toLocaleString('vi-VN')}
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            Đây là email tự động từ hệ thống BlueMoon Apartment.<br>
                            Vui lòng không trả lời email này.<br><br>
                            © 2024 BlueMoon Apartment Management System
                        </p>
                    </div>
                </div>
            `
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('[EMAIL] Notification sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('[EMAIL ERROR] Notification email failed:', error.message);
            // Không throw error để không làm gián đoạn flow chính
            return { success: false, error: error.message };
        }
    }
};

module.exports = emailService;
