// backend/controllers/feeController.js

const Fee = require('../models/feeModel');
const invoiceNotifier = require('../jobs/invoiceNotifier');
const db = require('../config/db');

// Helper: Tìm Resident ID từ User ID (Fix lỗi lệch ID)
const getResidentIdFromUser = async (userId) => {
    const query = `SELECT id FROM residents WHERE user_id = ?`;
    const [rows] = await db.execute(query, [userId]);
    if (rows.length > 0) return rows[0].id;
    return null;
};

// Helper: Hàm tạo mã hóa đơn ngẫu nhiên (HD + Time + Random)
const generateInvoiceId = () => {
    const now = new Date();
    const timePart = now.toISOString().slice(2, 10).replace(/-/g, ''); // 251030
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4 số ngẫu nhiên
    return `HD${timePart}-${randomPart}`;
};

const feeController = {

    // ==========================================
    // 1. LOẠI PHÍ (FEE TYPES)
    // ==========================================
    getFeeTypes: async (req, res) => {
        try {
            const types = await Fee.getAllFeeTypes();
            res.json({ success: true, data: types });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    createFeeType: async (req, res) => {
        try {
            const { fee_name, fee_code, default_price, unit } = req.body;
            if (!fee_name || !fee_code) {
                return res.status(400).json({ message: 'Tên phí và Mã phí là bắt buộc.' });
            }
            const newType = await Fee.createFeeType(req.body);
            res.status(201).json({ success: true, message: 'Thêm loại phí thành công!', data: newType });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // ==========================================
    // 2. HÓA ĐƠN (INVOICES)
    // ==========================================

    /**
     * Lấy danh sách hóa đơn
     * - Admin/Kế toán: Xem hết, lọc theo căn hộ/trạng thái.
     * - Cư dân: CHỈ xem được của mình (Backend tự ép resident_id).
     */
    getFees: async (req, res) => {
        try {
            const filters = {};
            if (req.query.status) filters.status = req.query.status;
            if (req.query.apartment_id) filters.apartment_id = req.query.apartment_id;

            const currentUser = req.user;

            // [FIX LỖI] Nếu là cư dân, phải tìm resident_id thật sự
            if (currentUser.role === 'resident') {
                const realResidentId = await getResidentIdFromUser(currentUser.id);
                
                if (!realResidentId) {
                    // Trường hợp user này chưa được gán vào resident nào
                    return res.json({ success: true, count: 0, data: [] });
                }
                
                filters.resident_id = realResidentId;
            }

            const fees = await Fee.getAllFees(filters);
            res.json({ success: true, count: fees.length, data: fees });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    getFeeDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const fee = await Fee.getFeeDetail(id);

            if (!fee) {
                return res.status(404).json({ message: 'Hóa đơn không tồn tại.' });
            }

            // [FIX LỖI] Bảo mật: Cư dân xem hóa đơn
            if (req.user.role === 'resident') {
                const realResidentId = await getResidentIdFromUser(req.user.id);
                
                if (fee.resident_id !== realResidentId) {
                    return res.status(403).json({ message: 'Bạn không có quyền xem hóa đơn này.' });
                }
            }

            res.json({ success: true, data: fee });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * Tạo hóa đơn mới (Kèm items chi tiết)
     */
    createInvoice: async (req, res) => {
        try {
            const { 
                apartment_id, resident_id, fee_type_id, 
                description, billing_period, due_date, items 
            } = req.body;

            // 1. Validation
            if (!apartment_id || !resident_id || !fee_type_id || !items || !Array.isArray(items)) {
                return res.status(400).json({ message: 'Thiếu thông tin bắt buộc hoặc danh sách chi tiết (items) không hợp lệ.' });
            }

            // 2. Tính toán tổng tiền (Server tự tính để đảm bảo chính xác)
            let totalAmount = 0;
            const processedItems = items.map(item => {
                const itemAmount = item.quantity * item.unit_price;
                totalAmount += itemAmount;
                return {
                    ...item,
                    amount: itemAmount
                };
            });

            // 3. Chuẩn bị data
            const invoiceData = {
                id: generateInvoiceId(),
                apartment_id,
                resident_id,
                fee_type_id,
                description,
                billing_period,
                due_date,
                total_amount: totalAmount,
                created_by: req.user.id // ID của kế toán đang đăng nhập
            };

            // 4. Gọi Model
            const newInvoice = await Fee.createInvoice(invoiceData, processedItems);

            res.status(201).json({
                success: true,
                message: 'Tạo hóa đơn thành công!',
                data: newInvoice
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server khi tạo hóa đơn.', error: error.message });
        }
    },

    /**
     * Thanh toán hóa đơn
     */
    payInvoice: async (req, res) => {
        try {
            const { id } = req.params;
            const { amount_paid, payment_method } = req.body;

            if (!amount_paid || amount_paid <= 0) {
                return res.status(400).json({ message: 'Số tiền thanh toán phải lớn hơn 0.' });
            }

            const result = await Fee.updatePaymentStatus(
                id, 
                amount_paid, 
                payment_method || 'Tiền mặt', 
                req.user.id // ID người xác nhận (Kế toán)
            );

            res.json({
                success: true,
                message: 'Thanh toán thành công!',
                data: result
            });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * Cập nhật loại phí
     */
    updateFeeType: async (req, res) => {
        try {
            const { id } = req.params;
            const { fee_name, fee_code, default_price, unit } = req.body;

            // Validate cơ bản
            if (!fee_name || !fee_code) {
                return res.status(400).json({ message: 'Tên phí và Mã phí là bắt buộc.' });
            }

            // Gọi Model update
            await Fee.updateFeeType(id, req.body);

            res.json({
                success: true,
                message: 'Cập nhật loại phí thành công!',
                data: { id, ...req.body }
            });

        } catch (error) {
            // Xử lý lỗi trùng mã phí (Unique Constraint)
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Mã phí hoặc Tên phí này đã tồn tại.' });
            }
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * Xóa loại phí
     */
    deleteFeeType: async (req, res) => {
        try {
            const { id } = req.params;
            
            await Fee.deleteFeeType(id);

            res.json({ success: true, message: 'Đã xóa loại phí thành công.' });

        } catch (error) {
            // [QUAN TRỌNG] Bắt lỗi ràng buộc khóa ngoại (Foreign Key Constraint)
            // Mã lỗi 1451: Cannot delete or update a parent row
            if (error.errno === 1451) {
                return res.status(400).json({ 
                    message: 'Không thể xóa loại phí này vì đã có hóa đơn sử dụng nó. Hãy thử tắt kích hoạt thay vì xóa.' 
                });
            }
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [MỚI] API để Admin ép chạy quét công nợ ngay lập tức (Test Cron Job)
    triggerLateFeeScan: async (req, res) => {
        try {
            // Chạy hàm logic của Cron Job
            await invoiceNotifier.checkAndNotify();
            res.json({ success: true, message: 'Đã thực hiện quét công nợ thủ công. Kiểm tra Terminal để xem kết quả.' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = feeController;