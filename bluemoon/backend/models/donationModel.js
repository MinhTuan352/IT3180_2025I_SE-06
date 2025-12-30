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
            (title, description, image_path, start_date, end_date, target_amount, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.title,
            data.description,
            data.image_path || null,
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
    },

    /**
     * Cập nhật thông tin chiến dịch
     */
    updateCampaign: async (id, data) => {
        const { title, description, start_date, end_date, target_amount, image_path } = data;
        let query = `UPDATE fund_campaigns SET `;
        const updates = [];
        const params = [];

        if (title !== undefined) { updates.push('title = ?'); params.push(title); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }
        if (start_date !== undefined) { updates.push('start_date = ?'); params.push(start_date); }
        if (end_date !== undefined) { updates.push('end_date = ?'); params.push(end_date); }
        if (target_amount !== undefined) { updates.push('target_amount = ?'); params.push(target_amount); }
        if (image_path !== undefined) { updates.push('image_path = ?'); params.push(image_path); }

        if (updates.length === 0) return false;

        query += updates.join(', ') + ' WHERE id = ?';
        params.push(id);

        const [result] = await db.execute(query, params);
        return result.affectedRows > 0;
    },

    /**
     * Thống kê tổng hợp
     */
    getStatistics: async () => {
        // 1. Tổng quan
        const [overview] = await db.execute(`
            SELECT 
                COUNT(*) as total_campaigns,
                SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_campaigns,
                SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_campaigns,
                COALESCE(SUM(current_amount), 0) as total_raised,
                COALESCE(SUM(target_amount), 0) as total_target
            FROM fund_campaigns
        `);

        // 2. Top 5 quỹ có nhiều đóng góp nhất
        const [topCampaigns] = await db.execute(`
            SELECT id, title, current_amount, target_amount, 
                   ROUND((current_amount / NULLIF(target_amount, 0)) * 100, 1) as progress_percent
            FROM fund_campaigns 
            WHERE current_amount > 0
            ORDER BY current_amount DESC 
            LIMIT 5
        `);

        // 3. Top 10 người đóng góp nhiều nhất
        const [topDonors] = await db.execute(`
            SELECT 
                d.resident_id,
                r.full_name,
                a.apartment_code,
                SUM(d.amount) as total_donated,
                COUNT(d.id) as donation_count
            FROM donations d
            JOIN residents r ON d.resident_id = r.id
            LEFT JOIN apartments a ON r.apartment_id = a.id
            WHERE d.is_anonymous = 0
            GROUP BY d.resident_id, r.full_name, a.apartment_code
            ORDER BY total_donated DESC
            LIMIT 10
        `);

        // 4. Đóng góp theo tháng (12 tháng gần nhất)
        const [monthlyStats] = await db.execute(`
            SELECT 
                DATE_FORMAT(transaction_date, '%Y-%m') as month,
                SUM(amount) as total_amount,
                COUNT(id) as donation_count
            FROM donations
            WHERE transaction_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
            ORDER BY month ASC
        `);

        return {
            overview: overview[0],
            topCampaigns,
            topDonors,
            monthlyStats
        };
    }
};

module.exports = Donation;