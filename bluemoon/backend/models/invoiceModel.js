// File: backend/models/invoiceModel.js
const db = require('../config/db');

const Invoice = {
    create: async (invoiceData) => {
        const { user_id, fee_type_id, total_amount, billing_period, description, issue_date, due_date, created_by_user_id } = invoiceData;
        
        // Giả định status mặc định là 'unpaid'
        const [result] = await db.execute(
            `INSERT INTO invoices 
            (user_id, fee_type_id, total_amount, billing_period, description, issue_date, due_date, created_by_user_id, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid')`,
            [user_id, fee_type_id, total_amount, billing_period, description, issue_date, due_date, created_by_user_id]
        );
        return { id: result.insertId, ...invoiceData, status: 'unpaid' };
    },

    findForUser: async (userId) => {
        const [rows] = await db.execute(
            `SELECT i.*, ft.name as fee_name 
             FROM invoices i 
             JOIN fee_types ft ON i.fee_type_id = ft.id 
             WHERE i.user_id = ? 
             ORDER BY i.issue_date DESC`,
            [userId]
        );
        return rows;
    },
    
    findById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM invoices WHERE id = ?', [id]);
        return rows[0];
    },

    // Tìm hóa đơn chưa thanh toán hoặc quá hạn (cho Job)
    findUnpaidAndOverdue: async () => {
        const [rows] = await db.execute(
            `SELECT i.*, u.full_name as user_name, u.email as user_email, ft.name as fee_name 
             FROM invoices i
             JOIN users u ON i.user_id = u.id
             JOIN fee_types ft ON i.fee_type_id = ft.id
             WHERE i.status IN ('unpaid', 'overdue')`
        );
        return rows;
    },

    // Cập nhật thanh toán
    updatePaymentStatus: async (invoiceId, paymentMethod, transactionCode, amountPaid) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            // 1. Cập nhật invoice (amount_paid + status)
            // Logic đơn giản: coi như thanh toán hết. Nếu thanh toán 1 phần cần logic cộng dồn.
            await connection.execute(
                `UPDATE invoices SET 
                    status = 'paid', 
                    amount_paid = total_amount, 
                    payment_method = ?, 
                    transaction_id = ?, 
                    payment_date = NOW() 
                 WHERE id = ?`,
                [paymentMethod, transactionCode, invoiceId]
            );

            // 2. Lưu transaction
            await connection.execute(
                `INSERT INTO transactions (invoice_id, amount, payment_method, transaction_code, status) 
                 VALUES (?, ?, ?, ?, 'success')`,
                [invoiceId, amountPaid, paymentMethod, transactionCode]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    markAsOverdue: async (id) => {
        await db.execute("UPDATE invoices SET status = 'overdue' WHERE id = ?", [id]);
    }
};

module.exports = Invoice;