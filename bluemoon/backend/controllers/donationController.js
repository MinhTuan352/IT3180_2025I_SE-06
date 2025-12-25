// File: backend/controllers/donationController.js

const Donation = require('../models/donationModel');
const db = require('../config/db');

// Helper: Lấy Resident ID từ User ID
const getResidentIdFromUser = async (userId) => {
    const query = `SELECT id FROM residents WHERE user_id = ?`;
    const [rows] = await db.execute(query, [userId]);
    return rows.length > 0 ? rows[0].id : null;
};

const donationController = {

    // ==========================================
    // 1. DÀNH CHO KẾ TOÁN (QUẢN LÝ QUỸ)
    // ==========================================

    /**
     * [POST] /api/donations/campaigns
     * Tạo đợt quyên góp mới
     */
    createCampaign: async (req, res) => {
        try {
            const { title, description, start_date, end_date, target_amount } = req.body;

            if (!title || !start_date || !end_date) {
                return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (Tên quỹ, Ngày bắt đầu, Ngày kết thúc).' });
            }

            const newCampaign = await Donation.createCampaign({
                title,
                description,
                start_date,
                end_date,
                target_amount,
                created_by: req.user.id // ID của Kế toán đang login
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
     * Cư dân tự quyên góp qua App
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

            // 3. Giả lập thanh toán (Trong thực tế sẽ gọi VNPay/Momo ở đây)
            // Nếu thanh toán OK mới chạy tiếp dòng dưới.

            // 4. Ghi nhận
            const newDonation = await Donation.createDonation({
                campaign_id,
                resident_id: residentId,
                amount,
                payment_method: 'AppPayment',
                recorded_by: req.user.id, // ID Cư dân tự thao tác
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
    }
};

module.exports = donationController;