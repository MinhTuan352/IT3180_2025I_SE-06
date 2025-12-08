// File: backend/controllers/feeController.js

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
    },

    /**
     * [MỚI] Import chỉ số nước hàng loạt và tạo hóa đơn
     * Body: { billingPeriod: 'T12/2025', readings: [{ apartmentCode, oldIndex, newIndex, usage, amount }] }
     */
    importWaterMeter: async (req, res) => {
        try {
            const { billingPeriod, readings } = req.body;

            if (!billingPeriod || !readings || !Array.isArray(readings) || readings.length === 0) {
                return res.status(400).json({ message: 'Dữ liệu không hợp lệ. Cần billingPeriod và readings.' });
            }

            const results = [];
            const errors = [];

            // Lấy fee_type_id của Phí Nước (fee_code = 'PN')
            const [feeTypes] = await db.execute("SELECT id, default_price FROM fee_types WHERE fee_code = 'PN'");
            if (feeTypes.length === 0) {
                return res.status(400).json({ message: 'Không tìm thấy loại phí Nước (PN) trong hệ thống.' });
            }
            const feeTypeId = feeTypes[0].id;
            const unitPrice = feeTypes[0].default_price || 15000;

            // Tính due_date = ngày cuối tháng sau
            const now = new Date();
            const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 15); // Ngày 15 tháng sau

            for (const reading of readings) {
                try {
                    const { apartmentCode, oldIndex, newIndex, usage, amount } = reading;

                    // 1. Tìm apartment
                    const [apartments] = await db.execute(
                        "SELECT id FROM apartments WHERE apartment_code = ?",
                        [apartmentCode]
                    );
                    if (apartments.length === 0) {
                        errors.push({ apartmentCode, error: 'Không tìm thấy căn hộ' });
                        continue;
                    }
                    const apartmentId = apartments[0].id;

                    // 2. Tìm chủ hộ (owner)
                    const [residents] = await db.execute(
                        "SELECT id FROM residents WHERE apartment_id = ? AND role = 'owner' LIMIT 1",
                        [apartmentId]
                    );
                    if (residents.length === 0) {
                        errors.push({ apartmentCode, error: 'Căn hộ chưa có chủ hộ' });
                        continue;
                    }
                    const residentId = residents[0].id;

                    // 3. Tạo mã hóa đơn
                    const invoiceId = generateInvoiceId();

                    // 4. Tính tiền thực tế
                    const actualUsage = usage || (newIndex - oldIndex);
                    const actualAmount = amount || (actualUsage * unitPrice);

                    // 5. Tạo hóa đơn
                    const invoiceData = {
                        id: invoiceId,
                        apartment_id: apartmentId,
                        resident_id: residentId,
                        fee_type_id: feeTypeId,
                        description: `Tiền nước ${billingPeriod} (${actualUsage} m³)`,
                        billing_period: billingPeriod,
                        due_date: dueDate.toISOString().split('T')[0],
                        total_amount: actualAmount,
                        created_by: req.user.id
                    };

                    const itemsData = [{
                        item_name: `Tiền nước ${billingPeriod}`,
                        unit: 'm³',
                        quantity: actualUsage,
                        unit_price: unitPrice,
                        amount: actualAmount
                    }];

                    await Fee.createInvoice(invoiceData, itemsData);

                    results.push({
                        apartmentCode,
                        invoiceId,
                        usage: actualUsage,
                        amount: actualAmount,
                        status: 'Thành công'
                    });

                } catch (err) {
                    errors.push({ apartmentCode: reading.apartmentCode, error: err.message });
                }
            }

            res.json({
                success: true,
                message: `Đã tạo ${results.length} hóa đơn nước thành công.`,
                data: {
                    created: results.length,
                    failed: errors.length,
                    results,
                    errors
                }
            });

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

            if (!billing_period || !invoices || !Array.isArray(invoices) || invoices.length === 0) {
                return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
            }

            // Lấy fee_type_id cho phí tổng hợp (hoặc PQL)
            const [feeTypes] = await db.execute(
                "SELECT id FROM fee_types WHERE fee_code = 'PQL' LIMIT 1"
            );
            const feeTypeId = feeTypes.length > 0 ? feeTypes[0].id : 1;

            // Tính due_date = ngày 15 tháng sau
            const [year, month] = billing_period.split('-').map(Number);
            const dueDate = new Date(year, month, 15); // Tháng tiếp theo ngày 15

            const results = [];
            const errors = [];

            for (const inv of invoices) {
                try {
                    // Kiểm tra hóa đơn đã tồn tại cho kỳ này chưa
                    const [existing] = await db.execute(
                        `SELECT id FROM fees 
                         WHERE apartment_id = ? AND billing_period = ? AND status != 'Đã hủy'
                         LIMIT 1`,
                        [inv.apartment_id, billing_period]
                    );

                    if (existing.length > 0) {
                        errors.push({
                            apartment_code: inv.apartment_code,
                            error: `Hóa đơn kỳ ${billing_period} đã tồn tại`
                        });
                        continue;
                    }

                    const invoiceId = generateInvoiceId();
                    const invoiceData = {
                        id: invoiceId,
                        apartment_id: inv.apartment_id,
                        resident_id: inv.resident_id,
                        fee_type_id: feeTypeId,
                        description: `Phí dịch vụ tháng ${billing_period}`,
                        billing_period: billing_period,
                        due_date: dueDate.toISOString().split('T')[0],
                        total_amount: inv.total_amount,
                        created_by: req.user.id
                    };

                    await Fee.createInvoice(invoiceData, inv.items);

                    results.push({
                        invoice_id: invoiceId,
                        apartment_code: inv.apartment_code,
                        resident_name: inv.resident_name,
                        total_amount: inv.total_amount,
                        status: 'Thành công'
                    });

                } catch (err) {
                    errors.push({
                        apartment_code: inv.apartment_code,
                        error: err.message
                    });
                }
            }

            res.json({
                success: true,
                message: `Đã tạo ${results.length}/${invoices.length} hóa đơn thành công.`,
                data: {
                    created: results.length,
                    failed: errors.length,
                    results,
                    errors
                }
            });

        } catch (error) {
            console.error('Batch Create Error:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = feeController;