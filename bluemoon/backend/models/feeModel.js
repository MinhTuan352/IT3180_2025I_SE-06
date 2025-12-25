// File: backend/models/feeModel.js

const db = require('../config/db');

const Fee = {
    // ==========================================
    // PHẦN 1: QUẢN LÝ LOẠI PHÍ (FEE TYPES)
    // ==========================================

    getAllFeeTypes: async () => {
        try {
            const [rows] = await db.execute('SELECT * FROM fee_types ORDER BY id ASC');
            return rows;
        } catch (error) {
            throw error;
        }
    },

    createFeeType: async (data) => {
        try {
            const { fee_name, fee_code, default_price, unit } = data;
            const query = `INSERT INTO fee_types (fee_name, fee_code, default_price, unit) VALUES (?, ?, ?, ?)`;
            await db.execute(query, [fee_name, fee_code, default_price, unit]);
            return data;
        } catch (error) {
            throw error;
        }
    },

    // ==========================================
    // PHẦN 2: QUẢN LÝ HÓA ĐƠN (FEES)
    // ==========================================

    /**
     * Lấy danh sách hóa đơn (Có hỗ trợ lọc)
     * @param {Object} filters - Các điều kiện lọc (apartment_id, status, month...)
     */
    getAllFees: async (filters = {}) => {
        try {
            let query = `
                SELECT 
                    f.*, 
                    a.apartment_code, 
                    a.building,
                    r.full_name as resident_name,
                    ft.fee_name
                FROM fees f
                JOIN apartments a ON f.apartment_id = a.id
                JOIN residents r ON f.resident_id = r.id
                JOIN fee_types ft ON f.fee_type_id = ft.id
                WHERE 1=1
            `;
            const params = [];

            // Xử lý bộ lọc linh động
            if (filters.apartment_id) {
                query += ` AND f.apartment_id = ?`;
                params.push(filters.apartment_id);
            }
            if (filters.status) {
                query += ` AND f.status = ?`;
                params.push(filters.status);
            }
            if (filters.resident_id) { // Dùng cho cư dân xem hóa đơn của mình
                query += ` AND f.resident_id = ?`;
                params.push(filters.resident_id);
            }

            query += ` ORDER BY f.created_at DESC`;

            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Lấy chi tiết hóa đơn (Bao gồm cả các item bên trong)
     */
    getFeeDetail: async (id) => {
        try {
            // 1. Lấy thông tin chung
            const queryInfo = `
                SELECT f.*, a.apartment_code, ft.fee_name, r.full_name
                FROM fees f
                JOIN apartments a ON f.apartment_id = a.id
                JOIN fee_types ft ON f.fee_type_id = ft.id
                JOIN residents r ON f.resident_id = r.id
                WHERE f.id = ?
            `;
            const [info] = await db.execute(queryInfo, [id]);

            if (info.length === 0) return null;

            // 2. Lấy chi tiết items
            const queryItems = `SELECT * FROM fee_items WHERE fee_id = ?`;
            const [items] = await db.execute(queryItems, [id]);

            return { ...info[0], items: items };
        } catch (error) {
            throw error;
        }
    },

    // [MỚI] Lấy thông tin loại phí bằng mã (VD: 'PGX')
    getFeeTypeByCode: async (code) => {
        const query = `SELECT * FROM fee_types WHERE fee_code = ?`;
        const [rows] = await db.execute(query, [code]);
        return rows[0] || null;
    },

    // [MỚI] Kiểm tra xem tháng này căn hộ đã có hóa đơn loại này chưa (Tránh tạo trùng)
    checkFeeExists: async (apartmentId, feeTypeId, billingPeriod) => {
        const query = `
            SELECT id FROM fees 
            WHERE apartment_id = ? AND fee_type_id = ? AND billing_period = ?
        `;
        const [rows] = await db.execute(query, [apartmentId, feeTypeId, billingPeriod]);
        return rows.length > 0;
    },

    /**
     * TẠO HÓA ĐƠN MỚI (SỬ DỤNG TRANSACTION)
     * Đây là hàm phức tạp nhất: Vừa tạo fee, vừa tạo fee_items
     */
    createInvoice: async (invoiceData, itemsData) => {
        // Lấy một kết nối riêng từ pool để thực hiện Transaction
        const connection = await db.getConnection();

        try {
            // Bắt đầu giao dịch
            await connection.beginTransaction();

            const {
                id, apartment_id, resident_id, fee_type_id,
                description, billing_period, due_date, total_amount, created_by
            } = invoiceData;

            // 1. Insert vào bảng FEES
            const queryFee = `
                INSERT INTO fees 
                (id, apartment_id, resident_id, fee_type_id, description, billing_period, due_date, total_amount, amount_remaining, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Chưa thanh toán', ?)
            `;
            // Mới tạo thì amount_remaining = total_amount
            await connection.execute(queryFee, [
                id, apartment_id, resident_id, fee_type_id,
                description, billing_period, due_date, total_amount, total_amount, created_by
            ]);

            // 2. Insert vào bảng FEE_ITEMS (Vòng lặp)
            const queryItem = `
                INSERT INTO fee_items (fee_id, item_name, unit, quantity, unit_price, amount)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            for (const item of itemsData) {
                await connection.execute(queryItem, [
                    id, // fee_id vừa tạo
                    item.item_name,
                    item.unit,
                    item.quantity,
                    item.unit_price,
                    item.amount
                ]);
            }

            // Nếu mọi thứ ổn, xác nhận lưu vào DB
            await connection.commit();
            return { id, ...invoiceData, items: itemsData };

        } catch (error) {
            // Nếu có lỗi, hoàn tác tất cả, không lưu gì cả
            await connection.rollback();
            throw error;
        } finally {
            // Trả kết nối về pool
            connection.release();
        }
    },

    /**
     * Cập nhật trạng thái thanh toán
     */
    updatePaymentStatus: async (id, amountPaid, paymentMethod, processorId) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Lấy thông tin hóa đơn hiện tại
            const [rows] = await connection.execute('SELECT * FROM fees WHERE id = ? FOR UPDATE', [id]);
            if (rows.length === 0) throw new Error('Hóa đơn không tồn tại');

            const fee = rows[0];
            const newPaid = parseFloat(fee.amount_paid) + parseFloat(amountPaid);
            const newRemaining = parseFloat(fee.total_amount) - newPaid;

            let newStatus = 'Thanh toán một phần';
            if (newRemaining <= 0) newStatus = 'Đã thanh toán';

            // 2. Update bảng FEES
            await connection.execute(`
                UPDATE fees 
                SET amount_paid = ?, amount_remaining = ?, status = ?, payment_date = NOW(), payment_method = ?
                WHERE id = ?
            `, [newPaid, newRemaining, newStatus, paymentMethod, id]);

            // 3. Ghi vào lịch sử thanh toán (PAYMENT_HISTORY)
            await connection.execute(`
                INSERT INTO payment_history (fee_id, amount, payment_method, payment_date, processed_by)
                VALUES (?, ?, ?, NOW(), ?)
            `, [id, amountPaid, paymentMethod, processorId]);

            await connection.commit();
            return { id, newStatus, newPaid, newRemaining };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Cập nhật thông tin loại phí (Giá, Tên...)
     */
    updateFeeType: async (id, data) => {
        try {
            const { fee_name, fee_code, default_price, unit } = data;

            // Chỉ cập nhật những trường được gửi lên
            // Tuy nhiên với loại phí, thường người ta sửa hết, nên update full cho đơn giản
            const query = `
                UPDATE fee_types 
                SET fee_name = ?, fee_code = ?, default_price = ?, unit = ?
                WHERE id = ?
            `;

            await db.execute(query, [fee_name, fee_code, default_price, unit, id]);
            return { id, ...data };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Xóa loại phí
     * Lưu ý: Sẽ thất bại nếu loại phí này đã được dùng trong các hóa đơn cũ (Ràng buộc khóa ngoại)
     */
    deleteFeeType: async (id) => {
        try {
            const query = `DELETE FROM fee_types WHERE id = ?`;
            await db.execute(query, [id]);
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Fee;