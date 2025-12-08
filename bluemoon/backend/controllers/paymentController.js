// File: backend/controllers/paymentController.js
// Controller xử lý thanh toán tự động với QR VietQR

const Fee = require('../models/feeModel');
const db = require('../config/db');

// Cấu hình ngân hàng nhận thanh toán
const BANK_CONFIG = {
    bankId: 'MB',           // Mã ngân hàng MBBank
    bankCode: '970422',     // BIN MBBank 
    accountNo: '016785366886',
    accountName: 'LE HOANG PHUONG LINH',
    template: 'compact2'    // Template QR VietQR
};

// Lưu trạng thái thanh toán tạm thời (trong production nên dùng Redis/DB)
const pendingPayments = new Map();

const paymentController = {
    /**
     * Tạo QR code thanh toán cho hóa đơn
     * GET /api/payment/generate-qr/:invoiceId
     */
    generateQR: async (req, res) => {
        try {
            const { invoiceId } = req.params;

            // Lấy thông tin hóa đơn
            const invoice = await Fee.getFeeDetail(invoiceId);
            if (!invoice) {
                return res.status(404).json({ message: 'Không tìm thấy hóa đơn.' });
            }

            // Số tiền cần thanh toán
            const amount = invoice.amount_remaining > 0 ? invoice.amount_remaining : invoice.total_amount;

            // Nội dung chuyển khoản (format: HD[MaHoaDon])
            const addInfo = `HD${invoiceId}`;

            // Sử dụng QR tĩnh đã upload (ảnh cố định trong public folder frontend)
            const qrUrl = '/qr-mbbank.png';

            // Lưu vào pending để theo dõi
            pendingPayments.set(invoiceId, {
                amount,
                addInfo,
                status: 'pending',
                createdAt: new Date()
            });

            res.json({
                success: true,
                data: {
                    qrUrl,
                    bankName: 'MB Bank',
                    accountNo: BANK_CONFIG.accountNo,
                    accountName: BANK_CONFIG.accountName,
                    amount,
                    transferContent: addInfo,
                    invoiceId
                }
            });

        } catch (error) {
            console.error('[PaymentController] generateQR error:', error);
            res.status(500).json({ message: 'Lỗi server khi tạo QR.' });
        }
    },

    /**
     * Kiểm tra trạng thái thanh toán (Frontend polling)
     * GET /api/payment/status/:invoiceId
     */
    checkStatus: async (req, res) => {
        try {
            const { invoiceId } = req.params;

            // Lấy thông tin hóa đơn mới nhất từ DB
            const invoice = await Fee.getFeeDetail(invoiceId);
            if (!invoice) {
                return res.status(404).json({ message: 'Không tìm thấy hóa đơn.' });
            }

            const isPaid = invoice.status === 'Đã thanh toán';

            res.json({
                success: true,
                data: {
                    invoiceId,
                    status: invoice.status,
                    isPaid,
                    amountPaid: invoice.amount_paid || 0,
                    amountRemaining: invoice.amount_remaining || 0
                }
            });

        } catch (error) {
            console.error('[PaymentController] checkStatus error:', error);
            res.status(500).json({ message: 'Lỗi server.' });
        }
    },

    /**
     * Webhook nhận thông báo từ ngân hàng (hoặc simulate)
     * POST /api/payment/webhook
     * Body: { transferContent, amount, transactionId }
     */
    webhook: async (req, res) => {
        try {
            const { transferContent, amount, transactionId } = req.body;

            console.log('[Webhook] Nhận thanh toán:', { transferContent, amount, transactionId });

            // Parse invoice ID từ nội dung chuyển khoản (format: HD12345)
            const match = transferContent?.match(/HD(\w+)/i);
            if (!match) {
                console.log('[Webhook] Không parse được mã hóa đơn từ nội dung:', transferContent);
                return res.status(400).json({ message: 'Không xác định được hóa đơn.' });
            }

            const invoiceId = match[1];
            console.log('[Webhook] Invoice ID:', invoiceId);

            // Lấy thông tin hóa đơn
            const invoice = await Fee.getFeeDetail(invoiceId);
            if (!invoice) {
                console.log('[Webhook] Không tìm thấy hóa đơn:', invoiceId);
                return res.status(404).json({ message: 'Không tìm thấy hóa đơn.' });
            }

            // Cập nhật thanh toán
            const result = await Fee.updatePaymentStatus(
                invoiceId,
                amount,
                'Chuyển khoản',
                null // Không có user xác nhận (hệ thống tự động)
            );

            // Xóa khỏi pending
            pendingPayments.delete(invoiceId);

            console.log('[Webhook] Đã cập nhật thanh toán cho hóa đơn:', invoiceId);

            res.json({
                success: true,
                message: 'Đã xử lý thanh toán.',
                data: { invoiceId, amount }
            });

        } catch (error) {
            console.error('[PaymentController] webhook error:', error);
            res.status(500).json({ message: 'Lỗi server khi xử lý webhook.' });
        }
    },

    /**
     * API giả lập thanh toán thành công (CHỈ DÙNG ĐỂ TEST)
     * POST /api/payment/simulate/:invoiceId
     */
    simulatePayment: async (req, res) => {
        try {
            const { invoiceId } = req.params;

            // Lấy thông tin hóa đơn
            const invoice = await Fee.getFeeDetail(invoiceId);
            if (!invoice) {
                return res.status(404).json({ message: 'Không tìm thấy hóa đơn.' });
            }

            const amount = invoice.amount_remaining > 0 ? invoice.amount_remaining : invoice.total_amount;

            // Cập nhật thanh toán (truyền null cho processed_by vì không có user)
            const result = await Fee.updatePaymentStatus(
                invoiceId,
                amount,
                'Chuyển khoản (Test)',
                null
            );

            console.log('[Simulate] Đã giả lập thanh toán cho hóa đơn:', invoiceId);

            res.json({
                success: true,
                message: 'Đã giả lập thanh toán thành công!',
                data: result
            });

        } catch (error) {
            console.error('[PaymentController] simulate error:', error);
            res.status(500).json({ message: 'Lỗi server.' });
        }
    }
};

module.exports = paymentController;
