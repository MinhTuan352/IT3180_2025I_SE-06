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

    // [MỚI] Hàm lưu chỉ số điện nước vào bảng utility_readings
    saveUtilityReading: async (connection, data) => {
        const query = `
            INSERT INTO utility_readings (apartment_id, service_type, billing_period, old_index, new_index, recorded_date)
            VALUES (?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE new_index = VALUES(new_index), updated_at = NOW()
        `;
        // service_type map từ code: PN -> Nước, PD -> Điện
        const serviceType = data.fee_code === 'PN' ? 'Nước' : 'Điện';

        await connection.execute(query, [
            data.apartment_id,
            serviceType,
            data.billing_period,
            data.old_index,
            data.new_index
        ]);
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

    // [MỚI] Create Invoice có kèm lưu chỉ số điện nước (Advanced)
    createUtilityInvoice: async (invoiceData, itemsData, readingData) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Lưu hóa đơn như bình thường
            await connection.execute(`
                INSERT INTO fees (id, apartment_id, resident_id, fee_type_id, description, billing_period, due_date, total_amount, amount_remaining, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Chưa thanh toán', ?)
            `, [invoiceData.id, invoiceData.apartment_id, invoiceData.resident_id, invoiceData.fee_type_id, invoiceData.description, invoiceData.billing_period, invoiceData.due_date, invoiceData.total_amount, invoiceData.total_amount, invoiceData.created_by]);

            for (const item of itemsData) {
                await connection.execute(`
                    INSERT INTO fee_items (fee_id, item_name, unit, quantity, unit_price, amount)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [invoiceData.id, item.item_name, item.unit, item.quantity, item.unit_price, item.amount]);
            }

            // 2. Lưu chỉ số vào bảng riêng utility_readings
            const serviceType = readingData.fee_code === 'PN' ? 'Nước' : 'Điện';
            await connection.execute(`
                INSERT INTO utility_readings (apartment_id, service_type, billing_period, old_index, new_index, recorded_date)
                VALUES (?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE new_index = VALUES(new_index)
            `, [invoiceData.apartment_id, serviceType, invoiceData.billing_period, readingData.old_index, readingData.new_index]);

            await connection.commit();
            return invoiceData;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
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
    },

    /**
     * [MỚI] Lấy thống kê tài chính tổng hợp
     * Dùng cho trang Finance Stats (BOD)
     */
    getFinanceStats: async () => {
        try {
            // 1. Tổng quan doanh thu
            const [summary] = await db.execute(`
                SELECT 
                    COALESCE(SUM(total_amount), 0) as total_revenue,
                    COALESCE(SUM(amount_paid), 0) as collected,
                    COALESCE(SUM(amount_remaining), 0) as pending
                FROM fees
            `);

            // 2. Tỷ lệ thanh toán theo trạng thái
            const [statusCount] = await db.execute(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM fees
                GROUP BY status
            `);

            // Tính tổng và tỷ lệ phần trăm
            const totalInvoices = statusCount.reduce((sum, row) => sum + row.count, 0);
            const paymentRate = [];

            // Map status to colors
            const statusConfig = {
                'Đã thanh toán': { color: '#4caf50', label: 'Đã thanh toán' },
                'Chưa thanh toán': { color: '#ff9800', label: 'Chưa thanh toán' },
                'Quá hạn': { color: '#f44336', label: 'Quá hạn' },
                'Thanh toán một phần': { color: '#2196f3', label: 'Thanh toán một phần' }
            };

            statusCount.forEach((row, index) => {
                const config = statusConfig[row.status] || { color: '#9e9e9e', label: row.status };
                paymentRate.push({
                    id: index,
                    value: totalInvoices > 0 ? Math.round((row.count / totalInvoices) * 100) : 0,
                    label: config.label,
                    color: config.color
                });
            });

            // 3. Doanh thu 6 tháng gần nhất - lấy tất cả rồi sort bằng JS để đúng thứ tự
            const [monthlyRevenue] = await db.execute(`
                SELECT 
                    billing_period,
                    COALESCE(SUM(amount_paid), 0) as revenue
                FROM fees
                WHERE billing_period IS NOT NULL
                    AND billing_period != ''
                GROUP BY billing_period
            `);

            // Parse billing_period để sort đúng thứ tự thời gian
            const parseDate = (period) => {
                if (!period) return new Date(0);
                // Xử lý format "2025-12" hoặc "12/2025" hoặc "T12/2025"
                let year, month;
                if (period.includes('-')) {
                    // Format: 2025-12
                    [year, month] = period.split('-').map(Number);
                } else if (period.startsWith('T')) {
                    // Format: T12/2025
                    const clean = period.replace('T', '');
                    [month, year] = clean.split('/').map(Number);
                } else if (period.includes('/')) {
                    // Format: 12/2025
                    [month, year] = period.split('/').map(Number);
                } else {
                    return new Date(0);
                }
                return new Date(year, month - 1, 1);
            };

            // Sort theo thời gian tăng dần (tháng cũ trước)
            const sortedMonthly = monthlyRevenue
                .sort((a, b) => parseDate(a.billing_period) - parseDate(b.billing_period))
                .slice(-6); // Lấy 6 tháng gần nhất

            // Format cho biểu đồ
            const formattedMonthly = sortedMonthly.map(row => {
                const date = parseDate(row.billing_period);
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                return {
                    month: `T${month}/${year}`,
                    revenue: Math.round(parseFloat(row.revenue) / 1000000) // Đổi sang triệu VNĐ
                };
            });

            // 4. Số căn hộ quá hạn > 3 tháng
            const [overdueApartments] = await db.execute(`
                SELECT COUNT(DISTINCT apartment_id) as count
                FROM fees
                WHERE status = 'Quá hạn'
                    AND due_date < DATE_SUB(NOW(), INTERVAL 3 MONTH)
            `);

            // 5. Số ngày còn lại trong tháng (để hiển thị thông báo)
            const now = new Date();
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const daysRemaining = Math.max(0, Math.ceil((lastDayOfMonth - now) / (1000 * 60 * 60 * 24)));

            // 6. So sánh với tháng trước
            const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

            const [currentMonthRevenue] = await db.execute(`
                SELECT COALESCE(SUM(amount_paid), 0) as revenue
                FROM fees
                WHERE billing_period LIKE ?
            `, [currentMonth + '%']);

            const [lastMonthRevenue] = await db.execute(`
                SELECT COALESCE(SUM(amount_paid), 0) as revenue
                FROM fees
                WHERE billing_period LIKE ?
            `, [lastMonth + '%']);

            let percentChange = 0;
            if (parseFloat(lastMonthRevenue[0].revenue) > 0) {
                percentChange = Math.round(((parseFloat(currentMonthRevenue[0].revenue) - parseFloat(lastMonthRevenue[0].revenue)) / parseFloat(lastMonthRevenue[0].revenue)) * 100);
            }

            return {
                totalRevenue: parseFloat(summary[0].total_revenue),
                collected: parseFloat(summary[0].collected),
                pending: parseFloat(summary[0].pending),
                paymentRate,
                monthlyRevenue: formattedMonthly,
                overdueApartments: overdueApartments[0].count,
                daysRemaining,
                percentChange,
                currentMonth: `${now.getMonth() + 1}/${now.getFullYear()}`
            };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Fee;