// File: backend/models/donationModel.js

const db = require('../config/db');

const Donation = {
    // ==================================================
    // 1. QUẢN LÝ ĐỢT QUYÊN GÓP (CAMPAIGNS)
    // ==================================================

    /**
     * Tạo đợt quyên góp mới
     */
    createCampaign: async (data) => {
        const query = `
            INSERT INTO fund_campaigns 
            (title, description, start_date, end_date, target_amount, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.title,
            data.description,
            data.start_date,
            data.end_date,
            data.target_amount || 0,
            'Active',
            data.created_by
        ];

        const [result] = await db.execute(query, params);
        return { id: result.insertId, ...data };
    },

    /**
     * Lấy danh sách các đợt quyên góp
     * @param {Object} filters - { status: 'Active'/'Closed' }
     */
    getAllCampaigns: async (filters = {}) => {
        let query = `SELECT * FROM fund_campaigns WHERE 1=1`;
        const params = [];

        if (filters.status) {
            query += ` AND status = ?`;
            params.push(filters.status);
        }

        // Ưu tiên hiển thị Active lên đầu, sau đó sắp xếp theo ngày mới nhất
        query += ` ORDER BY FIELD(status, 'Active', 'Planned', 'Closed'), created_at DESC`;

        const [rows] = await db.execute(query, params);
        return rows;
    },

    /**
     * Lấy chi tiết một đợt quyên góp
     */
    getCampaignById: async (id) => {
        const query = `SELECT * FROM fund_campaigns WHERE id = ?`;
        const [rows] = await db.execute(query, [id]);
        return rows[0] || null;
    },

    /**
     * Đóng đợt quyên góp thủ công
     */
    closeCampaign: async (id) => {
        const query = `UPDATE fund_campaigns SET status = 'Closed' WHERE id = ?`;
        const [result] = await db.execute(query, [id]);
        return result.affectedRows > 0;
    },

    // ==================================================
    // 2. QUẢN LÝ GIAO DỊCH ĐÓNG GÓP (DONATIONS)
    // ==================================================

    /**
     * [QUAN TRỌNG] Ghi nhận đóng góp + Cập nhật tổng tiền (Transaction)
     */
    createDonation: async (data) => {
        const connection = await db.getConnection(); // Lấy connection riêng để chạy transaction
        try {
            await connection.beginTransaction();

            // Bước 1: Insert vào bảng donations
            const insertQuery = `
                INSERT INTO donations 
                (campaign_id, resident_id, amount, payment_method, recorded_by, note, is_anonymous)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const insertParams = [
                data.campaign_id,
                data.resident_id,
                data.amount,
                data.payment_method || 'AppPayment',
                data.recorded_by,
                data.note,
                data.is_anonymous || false
            ];
            const [resInsert] = await connection.execute(insertQuery, insertParams);

            // Bước 2: Update cộng dồn vào bảng fund_campaigns
            const updateQuery = `
                UPDATE fund_campaigns 
                SET current_amount = current_amount + ? 
                WHERE id = ?
            `;
            await connection.execute(updateQuery, [data.amount, data.campaign_id]);

            // Bước 3: Commit (Lưu thay đổi)
            await connection.commit();
            return { id: resInsert.insertId, ...data };

        } catch (error) {
            // Nếu lỗi -> Rollback (Hoàn tác toàn bộ)
            await connection.rollback();
            throw error; 
        } finally {
            connection.release(); // Trả lại connection cho pool
        }
    },

    /**
     * Lấy danh sách đóng góp của một chiến dịch (Dùng để sao kê/xuất báo cáo)
     */
    getDonationsByCampaign: async (campaignId) => {
        const query = `
            SELECT d.*, 
                   r.full_name, a.apartment_code 
            FROM donations d
            JOIN residents r ON d.resident_id = r.id
            JOIN apartments a ON r.apartment_id = a.id
            WHERE d.campaign_id = ?
            ORDER BY d.transaction_date DESC
        `;
        const [rows] = await db.execute(query, [campaignId]);
        return rows;
    },

    /**
     * Lấy lịch sử đóng góp của một cư dân
     */
    getDonationsByResident: async (residentId) => {
        const query = `
            SELECT d.*, c.title as campaign_title
            FROM donations d
            JOIN fund_campaigns c ON d.campaign_id = c.id
            WHERE d.resident_id = ?
            ORDER BY d.transaction_date DESC
        `;
        const [rows] = await db.execute(query, [residentId]);
        return rows;
    }
};

module.exports = Donation;