// File: backend/controllers/feeController.js

const Fee = require('../models/feeModel');
const Vehicle = require('../models/vehicleModel'); // [MỚI] Import để lấy danh sách xe
const cronJob = require('../jobs/cronJob');
const db = require('../config/db');
const emailService = require('../services/emailService');
const idGenerator = require('../utils/idGenerator');
const AuditLog = require('../models/auditModel');

// Helper: Tìm Resident ID từ User ID (Fix lỗi lệch ID)
const getResidentIdFromUser = async (userId) => {
    const query = `SELECT id FROM residents WHERE user_id = ?`;
    const [rows] = await db.execute(query, [userId]);
    if (rows.length > 0) return rows[0].id;
    return null;
};

const feeController = {

    // ==========================================
    // 1. LOẠI PHÍ (FEE TYPES)
    // ==========================================
    getFeeTypes: async (req, res) => {
        try {
            const types = await Fee.getAllFeeTypes();
            res.status(200).json({ success: true, data: types });
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
            if (default_price < 0) {
                return res.status(400).json({ message: 'Đơn giá không được là số âm.' });
            }
            const newType = await Fee.createFeeType(req.body);

            AuditLog.create({
                user_id: req.user.id,
                action_type: 'CREATE',
                entity_name: 'fee_types',
                entity_id: newType.fee_code, // Hoặc ID nếu hàm create trả về
                old_values: null,
                new_values: req.body,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });
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
            // [AUTO-UPDATE] Tự động cập nhật trạng thái quá hạn
            // Các hóa đơn chưa thanh toán hoặc thanh toán một phần mà đã quá due_date sẽ chuyển sang 'Quá hạn'
            try {
                await db.execute(`
                    UPDATE fees 
                    SET status = 'Quá hạn' 
                    WHERE status IN ('Chưa thanh toán', 'Thanh toán một phần') 
                    AND due_date < CURDATE()
                `);
            } catch (updateErr) {
                console.log('[Auto-update overdue status error]:', updateErr.message);
            }

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
            const { apartment_id, resident_id, fee_type_id, billing_period, due_date, items } = req.body;

            // [FIX REQ 20] Validate Items
            if (items && items.some(i => i.unit_price < 0 || i.amount < 0)) {
                return res.status(400).json({ message: 'Số tiền trong hóa đơn không được âm.' });
            }
            
            const [meta] = await db.execute(`SELECT ft.fee_code, a.apartment_code FROM fee_types ft, apartments a WHERE ft.id = ? AND a.id = ?`, [fee_type_id, apartment_id]);
            if (meta.length === 0) return res.status(404).json({ message: 'Dữ liệu không hợp lệ.' });
            
            // [MỚI] Sinh ID thông minh
            const invoiceId = await idGenerator.generateInvoiceId(
                meta[0].fee_code, 
                meta[0].apartment_code, 
                billing_period
            );
            
            let totalAmount = 0;
            const processedItems = items.map(item => {
                const amt = item.quantity * item.unit_price;
                totalAmount += amt;
                return { ...item, amount: amt };
            });

            const invoiceData = {
                id: invoiceId, apartment_id, resident_id, fee_type_id, 
                description: req.body.description, billing_period, due_date, 
                total_amount: totalAmount, created_by: req.user.id
            };

            await Fee.createInvoice(invoiceData, processedItems);

            AuditLog.create({
                user_id: req.user.id,
                action_type: 'CREATE',
                entity_name: 'fees',
                entity_id: invoiceId,
                new_values: invoiceData,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.status(201).json({ success: true, message: 'Tạo thành công!', data: invoiceData });
        } catch (error) {
            res.status(500).json({ message: error.message });
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
            const { fee_name, fee_code, default_price, unit, transfer_syntax } = req.body;

            // Validate cơ bản
            if (!fee_name || !fee_code) {
                return res.status(400).json({ message: 'Tên phí và Mã phí là bắt buộc.' });
            }

            if (default_price !== undefined && default_price < 0) {
                return res.status(400).json({ message: 'Đơn giá không được là số âm.' });
            }

            // Lấy dữ liệu cũ để ghi log
            const [oldData] = await db.execute('SELECT * FROM fee_types WHERE id = ?', [id]);
            if (oldData.length === 0) return res.status(404).json({ message: 'Loại phí không tồn tại.' });

            // Gọi Model update
            await Fee.updateFeeType(id, { ...req.body, transfer_syntax });

            // [FIX REQ 17] Ghi Audit Log
            AuditLog.create({
                user_id: req.user.id,
                action_type: 'UPDATE',
                entity_name: 'fee_types',
                entity_id: id,
                old_values: oldData[0],
                new_values: req.body,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

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
            const [oldData] = await db.execute('SELECT * FROM fee_types WHERE id = ?', [id]);
            if (oldData.length === 0) return res.status(404).json({ message: 'Loại phí không tồn tại.' });

            await Fee.deleteFeeType(id);

            AuditLog.create({
                user_id: req.user.id,
                action_type: 'DELETE',
                entity_name: 'fee_types',
                entity_id: id,
                old_values: oldData[0],
                new_values: null,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });
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
            await cronJob.scanOverdueInvoices();
            res.json({ success: true, message: 'Đã thực hiện quét công nợ thủ công. Kiểm tra Terminal để xem kết quả.' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [MỚI] Gửi nhắc nợ cho 1 hóa đơn
     * POST /api/fees/:id/remind
     */
    sendReminder: async (req, res) => {
        const connection = await db.getConnection();
        try {
            const { id } = req.params;

            // 1. Lấy thông tin hóa đơn
            const feeDetail = await Fee.getFeeDetail(id);
            if (!feeDetail) {
                return res.status(404).json({ message: 'Hóa đơn không tồn tại.' });
            }

            if (feeDetail.status === 'Đã thanh toán') {
                return res.status(400).json({ message: 'Hóa đơn đã được thanh toán, không cần nhắc nợ.' });
            }

            // 2. Lấy thông tin cư dân (email)
            const [residents] = await db.execute(
                `SELECT r.id, r.full_name, r.email, r.phone, a.apartment_code 
                 FROM residents r 
                 JOIN apartments a ON r.apartment_id = a.id
                 WHERE r.id = ?`,
                [feeDetail.resident_id]
            );

            if (residents.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy thông tin cư dân.' });
            }

            const resident = residents[0];
            const amountDue = feeDetail.total_amount - feeDetail.amount_paid;

            // 3. Tạo thông báo trong hệ thống
            const notiId = await idGenerator.generateDateBasedId('notifications', 'TB', 'id', connection);
            const title = `Nhắc nhở thanh toán: ${feeDetail.fee_name || 'Công nợ'}`;
            const content = `Kính gửi ${resident.full_name},\n\nBạn có hóa đơn chưa thanh toán:\n- Mã HĐ: ${feeDetail.id}\n- Loại phí: ${feeDetail.fee_name}\n- Kỳ: ${feeDetail.billing_period}\n- Số tiền còn nợ: ${amountDue.toLocaleString('vi-VN')} VNĐ\n- Hạn thanh toán: ${new Date(feeDetail.due_date).toLocaleDateString('vi-VN')}\n\nVui lòng thanh toán sớm để tránh phát sinh phí phạt.\n\nTrân trọng,\nBan Quản Lý Chung Cư BlueMoon`;

            // Insert notification
            await db.execute(
                `INSERT INTO notifications (id, title, content, type_id, target, created_by, is_sent) 
                 VALUES (?, ?, ?, 2, 'Cá nhân', ?, TRUE)`,
                [notiId, title, content, req.user.id]
            );

            // Insert recipient
            await db.execute(
                `INSERT INTO notification_recipients (notification_id, recipient_id) VALUES (?, ?)`,
                [notiId, feeDetail.resident_id]
            );

            // 4. [CẬP NHẬT] Gửi email thực sự qua SMTP
            let emailSent = false;
            let emailError = null;
            if (resident.email) {
                try {
                    await emailService.sendDebtReminderEmail(resident.email, resident.full_name, {
                        amount: amountDue.toLocaleString('vi-VN'),
                        description: `Mã HĐ: ${feeDetail.id} | Loại: ${feeDetail.fee_name} | Kỳ: ${feeDetail.billing_period} | Hạn: ${new Date(feeDetail.due_date).toLocaleDateString('vi-VN')}`
                    });
                    emailSent = true;
                    console.log(`📧 [EMAIL NHẮC NỢ] Đã gửi thành công đến: ${resident.email}`);
                } catch (emailErr) {
                    emailError = emailErr.message;
                    console.error(`📧 [EMAIL NHẮC NỢ] Gửi thất bại đến ${resident.email}:`, emailErr.message);
                }
            } else {
                console.log(`📧 [EMAIL NHẮC NỢ] Cư dân ${resident.full_name} chưa có email.`);
            }

            res.json({
                success: true,
                message: `Đã gửi nhắc nợ đến ${resident.full_name} (${resident.apartment_code}).${emailSent ? ' Email đã được gửi!' : ''}`,
                data: {
                    notification_id: notiId,
                    resident_name: resident.full_name,
                    email: resident.email || 'Chưa có',
                    email_sent: emailSent,
                    email_error: emailError,
                    amount_due: amountDue
                }
            });

        } catch (error) {
            console.error('Send Reminder Error:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [MỚI] Gửi nhắc nợ hàng loạt cho nhiều hóa đơn
     * POST /api/fees/batch-remind
     * Body: { invoice_ids: ['HD001', 'HD002', ...] } hoặc { filter: 'unpaid' } để gửi cho tất cả
     */
    sendBatchReminder: async (req, res) => {
        try {
            const { invoice_ids, filter } = req.body;
            const connection = await db.getConnection();

            let invoices = [];

            if (filter === 'all_unpaid') {
                // Lấy tất cả hóa đơn chưa thanh toán
                const [rows] = await db.execute(`
                    SELECT f.*, r.full_name as resident_name, r.email, a.apartment_code,
                           ft.fee_name
                    FROM fees f
                    JOIN residents r ON f.resident_id = r.id
                    JOIN apartments a ON f.apartment_id = a.id
                    JOIN fee_types ft ON f.fee_type_id = ft.id
                    WHERE f.status IN ('Chưa thanh toán', 'Quá hạn', 'Thanh toán một phần')
                    ORDER BY f.created_at DESC
                `);
                invoices = rows;
            } else if (invoice_ids && Array.isArray(invoice_ids) && invoice_ids.length > 0) {
                // Lấy các hóa đơn đã chọn
                const placeholders = invoice_ids.map(() => '?').join(',');
                const [rows] = await db.execute(`
                    SELECT f.*, r.full_name as resident_name, r.email, r.id as resident_id, 
                           a.apartment_code, ft.fee_name
                    FROM fees f
                    JOIN residents r ON f.resident_id = r.id
                    JOIN apartments a ON f.apartment_id = a.id
                    JOIN fee_types ft ON f.fee_type_id = ft.id
                    WHERE f.id IN (${placeholders}) 
                      AND f.status IN ('Chưa thanh toán', 'Quá hạn', 'Thanh toán một phần')
                `, invoice_ids);
                invoices = rows;
            } else {
                return res.status(400).json({ message: 'Vui lòng chọn hóa đơn hoặc bộ lọc.' });
            }

            if (invoices.length === 0) {
                return res.status(400).json({ message: 'Không có hóa đơn chưa thanh toán nào để nhắc.' });
            }

            // Group by resident để gửi 1 thông báo tổng hợp cho mỗi cư dân
            const residentMap = new Map();
            for (const inv of invoices) {
                if (!residentMap.has(inv.resident_id)) {
                    residentMap.set(inv.resident_id, {
                        resident_id: inv.resident_id,
                        resident_name: inv.resident_name,
                        email: inv.email,
                        apartment_code: inv.apartment_code,
                        invoices: []
                    });
                }
                residentMap.get(inv.resident_id).invoices.push(inv);
            }

            const results = [];
            const errors = [];

            for (const [residentId, data] of residentMap) {
                try {
                    // Tính tổng nợ
                    const totalDue = data.invoices.reduce((sum, inv) =>
                        sum + (inv.total_amount - (inv.amount_paid || 0)), 0
                    );

                    // Tạo nội dung chi tiết
                    const invoiceLines = data.invoices.map(inv =>
                        `- ${inv.fee_name} (${inv.billing_period}): ${(inv.total_amount - (inv.amount_paid || 0)).toLocaleString('vi-VN')} VNĐ`
                    ).join('\n');

                    const notiId = await idGenerator.generateDateBasedId('notifications', 'TB', 'id', connection);
                    const title = `Nhắc nhở thanh toán công nợ`;
                    const content = `Kính gửi ${data.resident_name} (${data.apartment_code}),\n\nBạn có ${data.invoices.length} hóa đơn chưa thanh toán:\n${invoiceLines}\n\n💰 Tổng cộng: ${totalDue.toLocaleString('vi-VN')} VNĐ\n\nVui lòng thanh toán sớm để tránh phát sinh phí phạt.\n\nTrân trọng,\nBan Quản Lý`;

                    // Insert notification
                    await db.execute(
                        `INSERT INTO notifications (id, title, content, type_id, target, created_by, is_sent) 
                         VALUES (?, ?, ?, 2, 'Cá nhân', ?, TRUE)`,
                        [notiId, title, content, req.user.id]
                    );

                    // Insert recipient
                    await db.execute(
                        `INSERT INTO notification_recipients (notification_id, recipient_id) VALUES (?, ?)`,
                        [notiId, residentId]
                    );

                    // [CẬP NHẬT] Gửi email thực sự
                    let emailSent = false;
                    if (data.email) {
                        try {
                            await emailService.sendDebtReminderEmail(data.email, data.resident_name, {
                                amount: totalDue.toLocaleString('vi-VN'),
                                description: `${data.invoices.length} hóa đơn từ căn hộ ${data.apartment_code}`
                            });
                            emailSent = true;
                            console.log(`📧 [BATCH EMAIL] Đã gửi đến: ${data.email} - Tổng nợ: ${totalDue.toLocaleString()} VNĐ`);
                        } catch (emailErr) {
                            console.error(`📧 [BATCH EMAIL] Gửi thất bại đến ${data.email}:`, emailErr.message);
                        }
                    } else {
                        console.log(`📧 [BATCH EMAIL] ${data.resident_name} chưa có email.`);
                    }

                    results.push({
                        resident_id: residentId,
                        resident_name: data.resident_name,
                        apartment_code: data.apartment_code,
                        invoice_count: data.invoices.length,
                        total_due: totalDue,
                        email_sent: emailSent,
                        status: 'Thành công'
                    });

                } catch (err) {
                    errors.push({
                        resident_id: residentId,
                        error: err.message
                    });
                }
            }

            res.json({
                success: true,
                message: `Đã gửi nhắc nợ cho ${results.length}/${residentMap.size} cư dân.`,
                data: {
                    sent: results.length,
                    failed: errors.length,
                    total_invoices: invoices.length,
                    results,
                    errors
                }
            });

        } catch (error) {
            console.error('Batch Reminder Error:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [ĐÃ SỬA] Đổi tên thành importUtilityReadings và thêm lưu chỉ số
    importUtilityReadings: async (req, res) => {
        try {
            const { fee_code, billingPeriod, readings } = req.body;
            if (!billingPeriod || !readings) return res.status(400).json({ message: 'Thiếu dữ liệu.' });

            const [feeTypes] = await db.execute("SELECT id, fee_name, default_price, unit FROM fee_types WHERE fee_code = ?", [fee_code]);
            if (feeTypes.length === 0) return res.status(400).json({ message: `Mã phí ${fee_code} không tồn tại.` });
            
            const feeType = feeTypes[0];
            const now = new Date();
            const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);

            const results = [];
            const errors = [];

            for (const reading of readings) {
                // Khai báo biến bên ngoài try/catch
                const { apartmentCode, oldIndex, newIndex, usage, amount } = reading;

                try {
                    const [data] = await db.execute(
                        `SELECT a.id as apartment_id, r.id as resident_id 
                         FROM apartments a 
                         JOIN residents r ON a.id = r.apartment_id 
                         WHERE a.apartment_code = ? AND r.role = 'owner' LIMIT 1`,
                        [apartmentCode]
                    );

                    if (data.length === 0) {
                        errors.push({ apartmentCode, error: 'Không tìm thấy căn hộ/chủ hộ.' });
                        continue;
                    }

                    const { apartment_id, resident_id } = data[0];
                    const actualUsage = usage !== undefined ? usage : (newIndex - oldIndex);
                    
                    // [CHECK] Usage không được âm
                    if (actualUsage < 0) {
                        errors.push({ apartmentCode, error: 'Chỉ số mới nhỏ hơn chỉ số cũ.' });
                        continue;
                    }

                    const actualAmount = amount !== undefined ? amount : (actualUsage * (feeType.default_price || 0));

                    // Sinh ID
                    const invoiceId = await idGenerator.generateInvoiceId(
                        fee_code, 
                        apartmentCode, 
                        billingPeriod
                    );

                    const invoiceData = {
                        id: invoiceId, apartment_id, resident_id,
                        fee_type_id: feeType.id,
                        description: `${feeType.fee_name} ${billingPeriod}`,
                        billing_period: billingPeriod,
                        due_date: dueDate.toISOString().split('T')[0],
                        total_amount: actualAmount,
                        created_by: req.user.id
                    };

                    const itemsData = [{
                        item_name: `${feeType.fee_name} (${oldIndex || 0} - ${newIndex || actualUsage})`,
                        unit: feeType.unit, quantity: actualUsage,
                        unit_price: feeType.default_price || 0, amount: actualAmount
                    }];

                    const readingData = {
                        fee_code,
                        old_index: oldIndex || 0,
                        new_index: newIndex || (oldIndex + actualUsage)
                    };
                    
                    await Fee.createUtilityInvoice(invoiceData, itemsData, readingData);
                    results.push({ apartmentCode, status: 'OK' });

                } catch (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        errors.push({ apartmentCode, error: 'Đã tồn tại hóa đơn kỳ này.' });
                    } else {
                        errors.push({ apartmentCode, error: err.message });
                    }
                }
            }
            res.json({ success: true, message: `Xử lý ${results.length}/${readings.length}.`, errors });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // ========================================================
    // [MỚI] BATCH FEE GENERATION - Tạo hóa đơn hàng loạt
    // ========================================================

    /**
     * Bước 1: Xem trước danh sách hóa đơn sẽ được tạo
     * GET /api/fees/batch-preview?billing_period=2025-12
     */
    batchPreview: async (req, res) => {
        try {
            const { billing_period } = req.query;

            if (!billing_period) {
                return res.status(400).json({ message: 'Vui lòng chọn kỳ thanh toán (billing_period).' });
            }

            // 1. Lấy danh sách căn hộ có chủ hộ
            const [apartments] = await db.execute(`
                SELECT 
                    a.id as apartment_id,
                    a.apartment_code,
                    a.building,
                    a.floor,
                    a.area,
                    r.id as resident_id,
                    r.full_name as resident_name
                FROM apartments a
                JOIN residents r ON a.id = r.apartment_id AND r.role = 'owner'
                WHERE a.status = 'Đang sinh sống'
                ORDER BY a.apartment_code
            `);

            if (apartments.length === 0) {
                return res.json({
                    success: true,
                    message: 'Không có căn hộ nào để tạo hóa đơn.',
                    data: { invoices: [], summary: { total: 0, totalAmount: 0 } }
                });
            }

            // 2. Lấy danh sách loại phí cố định (PQL, Gửi xe)
            const [feeTypes] = await db.execute(`
                SELECT id, fee_code, fee_name, default_price, unit
                FROM fee_types
                WHERE fee_code IN ('PQL', 'GX', 'DV')
                ORDER BY id
            `);

            // Tạo map cho tiện tra cứu
            const feeTypeMap = {};
            feeTypes.forEach(ft => {
                feeTypeMap[ft.fee_code] = ft;
            });

            // 3. Tính toán hóa đơn cho từng căn hộ
            const invoices = [];
            let totalAmount = 0;

            for (const apt of apartments) {
                const items = [];
                let invoiceTotal = 0;

                // Phí Quản lý (PQL) = Diện tích x Đơn giá
                if (feeTypeMap['PQL']) {
                    const pqlPrice = feeTypeMap['PQL'].default_price || 15000;
                    const pqlAmount = apt.area * pqlPrice;
                    items.push({
                        item_name: `Phí quản lý (${apt.area} m²)`,
                        unit: 'm²',
                        quantity: apt.area,
                        unit_price: pqlPrice,
                        amount: pqlAmount
                    });
                    invoiceTotal += pqlAmount;
                }

                // Phí Dịch vụ chung (DV) - nếu có
                if (feeTypeMap['DV']) {
                    const dvPrice = feeTypeMap['DV'].default_price || 100000;
                    items.push({
                        item_name: 'Phí dịch vụ chung',
                        unit: 'tháng',
                        quantity: 1,
                        unit_price: dvPrice,
                        amount: dvPrice
                    });
                    invoiceTotal += dvPrice;
                }

                invoices.push({
                    apartment_id: apt.apartment_id,
                    apartment_code: apt.apartment_code,
                    building: apt.building,
                    floor: apt.floor,
                    area: apt.area,
                    resident_id: apt.resident_id,
                    resident_name: apt.resident_name,
                    items: items,
                    total_amount: invoiceTotal,
                    billing_period: billing_period
                });

                totalAmount += invoiceTotal;
            }

            res.json({
                success: true,
                message: `Đã tính toán ${invoices.length} hóa đơn.`,
                data: {
                    billing_period,
                    invoices,
                    summary: {
                        total: invoices.length,
                        totalAmount
                    }
                }
            });

        } catch (error) {
            console.error('Batch Preview Error:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * Bước 2: Tạo hóa đơn hàng loạt
     * POST /api/fees/batch-create
     * Body: { billing_period: '2025-12', invoices: [...] }
     */
    batchCreate: async (req, res) => {
        try {
            const { billing_period, invoices } = req.body;
            if (!invoices || !Array.isArray(invoices)) return res.status(400).json({ message: 'Dữ liệu lỗi.' });

            // Lấy mã phí mặc định là PQL nếu không có trong invoices (hoặc check từng cái)
            // Giả sử batch này cho PQL
            const [feeTypes] = await db.execute("SELECT id, fee_code FROM fee_types WHERE fee_code = 'PQL' LIMIT 1");
            const defaultFeeCode = feeTypes.length > 0 ? feeTypes[0].fee_code : 'PQL';
            const defaultFeeId = feeTypes.length > 0 ? feeTypes[0].id : 1;
            
            const now = new Date();
            const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);

            let success = 0;
            const errors = [];

            for (const inv of invoices) {
                try {
                    // ID: PQL-A101-122025
                    const invoiceId = await idGenerator.generateInvoiceId(
                        defaultFeeCode, 
                        inv.apartment_code, 
                        billing_period
                    );
                    
                    const invoiceData = {
                        id: invoiceId,
                        apartment_id: inv.apartment_id,
                        resident_id: inv.resident_id,
                        fee_type_id: inv.fee_type_id || defaultFeeId,
                        description: inv.description || `Phí quản lý ${billing_period}`,
                        billing_period,
                        due_date: dueDate.toISOString().split('T')[0],
                        total_amount: inv.total_amount,
                        created_by: req.user.id
                    };

                    await Fee.createInvoice(invoiceData, inv.items);
                    success++;
                } catch (e) {
                    if (e.code !== 'ER_DUP_ENTRY') errors.push({ code: inv.apartment_code, error: e.message });
                }
            }
            res.json({ success: true, message: `Đã tạo ${success}/${invoices.length} hóa đơn.`, errors });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [ĐÃ SỬA] Logic tính tiền xe linh động hơn
    generateVehicleFees: async (req, res) => {
        try {
            const { billing_period, due_date } = req.body;
            if (!billing_period || !due_date) return res.status(400).json({ message: 'Thiếu kỳ thanh toán.' });

            // 1. Lấy tất cả các loại phí liên quan đến xe để lấy đơn giá chuẩn
            const [feeTypes] = await db.query("SELECT * FROM fee_types WHERE fee_code IN ('PGX', 'PGX_OTO', 'PGX_MAY')");
            
            // Tìm giá mặc định (Ưu tiên mã cụ thể, nếu không có lấy PGX chung)
            let carFee = feeTypes.find(f => f.fee_code === 'PGX_OTO')?.default_price;
            let bikeFee = feeTypes.find(f => f.fee_code === 'PGX_MAY')?.default_price;
            const generalFee = feeTypes.find(f => f.fee_code === 'PGX');

            // Fallback nếu chưa cấu hình phí riêng
            if (!carFee) carFee = generalFee?.default_price || 1200000;
            if (!bikeFee) bikeFee = generalFee?.default_price || 70000;
            const feeTypeId = generalFee ? generalFee.id : (feeTypes[0]?.id || 1);

            // 2. Lấy danh sách xe đang hoạt động
            const activeVehicles = await db.query(`
                SELECT v.*, a.apartment_code, a.id as apartment_id
                FROM vehicles v
                JOIN residents r ON v.resident_id = r.id
                JOIN apartments a ON r.apartment_id = a.id
                WHERE v.status = 'Đang sử dụng'
            `).then(([rows]) => rows);

            if (activeVehicles.length === 0) return res.json({ message: 'Không có xe nào.' });

            // 3. Gom nhóm theo căn hộ
            const vehicleMap = {};
            activeVehicles.forEach(v => {
                if (!vehicleMap[v.apartment_id]) {
                    vehicleMap[v.apartment_id] = { code: v.apartment_code, list: [] };
                }
                vehicleMap[v.apartment_id].list.push(v);
            });

            let successCount = 0, skipCount = 0;

            for (const aptId in vehicleMap) {
                const { code: aptCode, list: vehicles } = vehicleMap[aptId];
                const invoiceId = await idGenerator.generateInvoiceId(
                    'PGX', 
                    aptCode, 
                    billing_period
                );
                const feeItems = [];
                let totalAmount = 0;

                vehicles.forEach(v => {
                    // Logic giá: Nếu xe có giá riêng (ví dụ xe VIP) thì lấy, ko thì lấy giá chung
                    // (Ở đây tạm dùng giá chung theo loại)
                    let price = (v.vehicle_type === 'Ô tô') ? parseFloat(carFee) : parseFloat(bikeFee);
                    
                    totalAmount += price;
                    feeItems.push({
                        item_name: `Phí gửi xe: ${v.license_plate} (${v.vehicle_type})`,
                        unit: 'Tháng', quantity: 1,
                        unit_price: price, amount: price
                    });
                });

                const invoiceData = {
                    id: invoiceId, apartment_id: aptId, resident_id: vehicles[0].resident_id,
                    fee_type_id: feeTypeId, description: `Phí gửi xe ${billing_period}`,
                    billing_period, due_date, total_amount: totalAmount, created_by: req.user.id
                };

                try {
                    await Fee.createInvoice(invoiceData, feeItems);
                    successCount++;
                } catch (err) {
                    if (err.code === 'ER_DUP_ENTRY') skipCount++;
                }
            }

            res.json({ success: true, message: `Tạo: ${successCount}, Trùng: ${skipCount}.` });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = feeController;