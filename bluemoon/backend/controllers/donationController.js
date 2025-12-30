// File: backend/controllers/donationController.js

const Donation = require('../models/donationModel');
const db = require('../config/db');

// Helper: Lấy Resident ID từ User ID
const getResidentIdFromUser = async (userId) => {
    const query = `SELECT id FROM residents WHERE user_id = ?`;
    const [rows] = await db.execute(query, [userId]);
    return rows.length > 0 ? rows[0].id : null;
};

// Map lưu trữ các giao dịch đang chờ thanh toán (DEPRECATED - Moved to DB table pending_donations)
// const pendingDonations = new Map();

const donationController = {

    // ==========================================
    // 1. DÀNH CHO KẾ TOÁN (QUẢN LÝ QUỸ)
    // ==========================================

    /**
     * [POST] /api/donations/campaigns
     * Tạo đợt quyên góp mới (có thể upload ảnh)
     */
    createCampaign: async (req, res) => {
        try {
            const { title, description, start_date, end_date, target_amount } = req.body;

            if (!title || !start_date || !end_date) {
                return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (Tên quỹ, Ngày bắt đầu, Ngày kết thúc).' });
            }

            // Handle image upload
            let image_path = null;
            if (req.file) {
                image_path = `/uploads/funds/${req.file.filename}`;
            }

            const newCampaign = await Donation.createCampaign({
                title,
                description,
                image_path,
                start_date,
                end_date,
                target_amount,
                created_by: req.user.id
            });

            res.status(201).json({
                success: true,
                message: 'Đã tạo đợt quyên góp thành công.',
                data: newCampaign
            });
        } catch (error) {
            console.error('Create Campaign Error:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [PUT] /api/donations/campaigns/:id/close
     * Đóng quỹ thủ công (trước hạn)
     */
    closeCampaign: async (req, res) => {
        try {
            const { id } = req.params;
            await Donation.closeCampaign(id);
            res.json({ success: true, message: 'Đã đóng quỹ thành công.' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [POST] /api/donations/record-offline
     * Kế toán nhập liệu hộ cư dân (Thu tiền mặt)
     */
    recordOffline: async (req, res) => {
        try {
            const { campaign_id, resident_id, amount, note, is_anonymous } = req.body;

            // Validate
            if (!campaign_id || !resident_id || !amount) {
                return res.status(400).json({ message: 'Thiếu thông tin (Quỹ, Cư dân, Số tiền).' });
            }

            // Kiểm tra quỹ có còn mở không
            const campaign = await Donation.getCampaignById(campaign_id);
            if (!campaign || campaign.status !== 'Active') {
                return res.status(400).json({ message: 'Quỹ này đã đóng hoặc không tồn tại.' });
            }

            // Ghi nhận
            const newDonation = await Donation.createDonation({
                campaign_id,
                resident_id,
                amount,
                payment_method: 'Cash', // Mặc định là Tiền mặt vì nhập hộ
                recorded_by: req.user.id, // ID Kế toán thực hiện
                note,
                is_anonymous
            });

            res.status(201).json({
                success: true,
                message: 'Đã ghi nhận đóng góp tiền mặt thành công.',
                data: newDonation
            });

        } catch (error) {
            console.error('Record Offline Error:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // ==========================================
    // 2. DÀNH CHO CƯ DÂN (TƯƠNG TÁC)
    // ==========================================

    /**
     * [GET] /api/donations/campaigns
     * Xem danh sách các quỹ (Active & Closed)
     */
    getCampaigns: async (req, res) => {
        try {
            const campaigns = await Donation.getAllCampaigns();
            res.json({ success: true, data: campaigns });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [POST] /api/donations/donate
     * (LEGACY) Cư dân tự quyên góp qua App - Flow cũ
     */
    donate: async (req, res) => {
        try {
            const { campaign_id, amount, note, is_anonymous } = req.body;

            // 1. Lấy ID cư dân
            const residentId = await getResidentIdFromUser(req.user.id);
            if (!residentId) return res.status(403).json({ message: 'Bạn chưa có hồ sơ cư dân.' });

            // 2. Kiểm tra quỹ
            const campaign = await Donation.getCampaignById(campaign_id);
            if (!campaign || campaign.status !== 'Active') {
                return res.status(400).json({ message: 'Quỹ này đã đóng, không thể quyên góp thêm.' });
            }

            // 4. Ghi nhận
            const newDonation = await Donation.createDonation({
                campaign_id,
                resident_id: residentId,
                amount,
                payment_method: 'AppPayment',
                recorded_by: req.user.id,
                note,
                is_anonymous
            });

            res.status(201).json({
                success: true,
                message: 'Cảm ơn tấm lòng vàng của bạn! Quyên góp thành công.',
                data: newDonation
            });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // ==========================================
    // 4. THANH TOÁN QR (NEW FLOW) - UPDATED TO USE DB
    // ==========================================

    /**
     * [POST] /api/donations/initiate
     * Bắt đầu quyên góp -> Trả về QR Code
     * (Lưu transaction vào DB pending_donations)
     */
    initiateDonation: async (req, res) => {
        try {
            const { campaign_id, amount, note, is_anonymous } = req.body;
            const residentId = await getResidentIdFromUser(req.user.id);
            if (!residentId) return res.status(403).json({ message: 'Bạn chưa có hồ sơ cư dân.' });

            // Kiểm tra quỹ
            const campaign = await Donation.getCampaignById(campaign_id);
            if (!campaign || campaign.status !== 'Active') {
                return res.status(400).json({ message: 'Quỹ này đã đóng, không thể quyên góp thêm.' });
            }

            // Tạo mã giao dịch tạm
            // Format: QG + Timestamp
            const tempId = `QG${Date.now()}`;
            const transferContent = `${tempId}`; // Nội dung CK

            // Lưu vào DB pending_donations
            const sqlInsert = `
                INSERT INTO pending_donations 
                (temp_id, campaign_id, resident_id, amount, note, is_anonymous, status)
                VALUES (?, ?, ?, ?, ?, ?, 'pending')
            `;
            await db.execute(sqlInsert, [tempId, campaign_id, residentId, amount, note, is_anonymous || false]);

            // Bank Config (Simulated)
            const bankConfig = {
                bankId: 'MB',
                bankCode: '970422',
                accountNo: 'LE HOANG PHUONG LINH', // Changed per user request screenshot logic perhaps? No, user screenshot shows this name.
                accountName: 'LE HOANG PHUONG LINH',
                accountNoNum: '016785366886', // Keeping data consistent
                template: 'compact2'
            };

            // QR Icon (Map tới file tĩnh)
            const qrUrl = '/qr-mbbank.png';

            res.json({
                success: true,
                data: {
                    tempId,
                    qrUrl,
                    bankName: 'MB Bank',
                    accountNo: bankConfig.accountNoNum,
                    accountName: bankConfig.accountName,
                    amount,
                    transferContent,
                    campaignTitle: campaign.title
                }
            });

        } catch (error) {
            console.error('Initiate Donation Error:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [GET] /api/donations/status/:tempId
     * Kiểm tra trạng thái đóng góp (Polling từ DB)
     */
    checkDonationStatus: async (req, res) => {
        try {
            const { tempId } = req.params;

            // Check DB table
            const [rows] = await db.execute(`SELECT * FROM pending_donations WHERE temp_id = ?`, [tempId]);
            const record = rows[0];

            if (!record) {
                return res.json({ success: true, isPaid: false, status: 'not_found' });
            }

            if (record.status === 'completed') {
                return res.json({ success: true, isPaid: true, status: 'completed' });
            }

            res.json({ success: true, isPaid: false, status: 'pending' });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [POST] /api/donations/simulate/:tempId
     * Giả lập thanh toán thành công (Triggered by button/dev tool)
     */
    simulateDonation: async (req, res) => {
        try {
            const { tempId } = req.params;

            // Get pending record
            const [rows] = await db.execute(`SELECT * FROM pending_donations WHERE temp_id = ?`, [tempId]);
            const record = rows[0];

            if (!record) {
                return res.status(404).json({ message: 'Không tìm thấy giao dịch chờ.' });
            }

            if (record.status === 'completed') {
                return res.json({ success: true, message: 'Giao dịch này đã được xử lý trước đó.' });
            }

            // Tạo Donation thật trong DB (chính thức ghi nhận)
            const newDonation = await Donation.createDonation({
                campaign_id: record.campaign_id,
                resident_id: record.resident_id,
                amount: record.amount,
                payment_method: 'Transfer',
                recorded_by: req.user ? req.user.id : null,
                note: record.note,
                is_anonymous: record.is_anonymous
            });

            // Update status pending -> completed
            await db.execute(`UPDATE pending_donations SET status = 'completed' WHERE temp_id = ?`, [tempId]);

            console.log(`[Simulate] Completed donation ${tempId} -> Real ID: ${newDonation.id}`);

            res.json({
                success: true,
                message: 'Đã giả lập thanh toán thành công!',
                data: newDonation
            });

        } catch (error) {
            console.error('Simulate Donation Error:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [GET] /api/donations/me/history
     * Xem lịch sử đóng góp của bản thân
     */
    getMyHistory: async (req, res) => {
        try {
            const residentId = await getResidentIdFromUser(req.user.id);
            if (!residentId) return res.status(403).json({ message: 'Không tìm thấy cư dân.' });

            const history = await Donation.getDonationsByResident(residentId);
            res.json({ success: true, data: history });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // ==========================================
    // 3. CÔNG KHAI (SAO KÊ)
    // ==========================================

    /**
     * [GET] /api/donations/campaigns/:id/statement
     * Xem sao kê chi tiết của một quỹ
     * Logic: Nếu is_anonymous = 1 và người xem KHÔNG PHẢI Kế toán/BQT -> Ẩn tên.
     */
    getCampaignStatement: async (req, res) => {
        try {
            const { id } = req.params;
            const donations = await Donation.getDonationsByCampaign(id);

            // Kiểm tra quyền người xem
            const userRole = req.user.role;
            const isManager = ['bod', 'accountance'].includes(userRole);

            // Map dữ liệu để che thông tin nếu cần
            const sanitizedData = donations.map(d => {
                // Nếu là Ẩn danh và người xem là Cư dân thường -> Che tên
                if (d.is_anonymous && !isManager) {
                    return {
                        ...d,
                        full_name: 'Nhà hảo tâm (Ẩn danh)',
                        apartment_code: '***', // Có thể ẩn cả số căn hộ nếu muốn
                        resident_id: '***'
                    };
                }
                return d; // Giữ nguyên nếu công khai hoặc người xem là Quản lý
            });

            res.json({
                success: true,
                count: sanitizedData.length,
                data: sanitizedData
            });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [GET] /api/donations/campaigns/:id
     * Lấy chi tiết một quỹ
     */
    getCampaignDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const campaign = await Donation.getCampaignById(id);

            if (!campaign) {
                return res.status(404).json({ message: 'Không tìm thấy quỹ.' });
            }

            res.json({ success: true, data: campaign });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [PUT] /api/donations/campaigns/:id
     * Cập nhật thông tin quỹ
     */
    updateCampaign: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, start_date, end_date, target_amount } = req.body;

            // Check if campaign exists
            const campaign = await Donation.getCampaignById(id);
            if (!campaign) {
                return res.status(404).json({ message: 'Không tìm thấy quỹ.' });
            }

            // Handle image upload if present
            let image_path = undefined;
            if (req.file) {
                image_path = `/uploads/funds/${req.file.filename}`;
                console.log('📸 Image uploaded:', image_path);
            }

            console.log('💾 Updating campaign with:', { title, description, start_date, end_date, target_amount, image_path });

            const updated = await Donation.updateCampaign(id, {
                title,
                description,
                start_date,
                end_date,
                target_amount,
                image_path
            });

            if (updated) {
                res.json({ success: true, message: 'Cập nhật quỹ thành công.' });
            } else {
                res.status(400).json({ message: 'Không có thay đổi nào được thực hiện.' });
            }
        } catch (error) {
            console.error('Update Campaign Error:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [GET] /api/donations/statistics
     * Thống kê tổng hợp
     */
    getStatistics: async (req, res) => {
        try {
            const stats = await Donation.getStatistics();
            res.json({ success: true, data: stats });
        } catch (error) {
            console.error('Statistics Error:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = donationController;