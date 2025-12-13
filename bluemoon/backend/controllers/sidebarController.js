// File: backend/controllers/sidebarController.js
// Lightweight API for sidebar badge counts (Resident only)

const db = require('../config/db');

// Helper: Tìm Resident ID từ User ID
const getResidentIdFromUser = async (userId) => {
    const query = `SELECT id, apartment_id FROM residents WHERE user_id = ?`;
    const [rows] = await db.execute(query, [userId]);
    if (rows.length > 0) return rows[0];
    return null;
};

const sidebarController = {
    /**
     * GET /api/sidebar/badges
     * Lấy số lượng badge cho sidebar (Resident only)
     */
    getBadgeCounts: async (req, res) => {
        try {
            const userId = req.user?.id;

            if (!userId || req.user?.role !== 'resident') {
                return res.json({ success: true, data: { unreadNotifications: 0, unpaidFees: 0, updatedReports: 0 } });
            }

            const residentInfo = await getResidentIdFromUser(userId);
            if (!residentInfo) {
                return res.json({ success: true, data: { unreadNotifications: 0, unpaidFees: 0, updatedReports: 0 } });
            }

            const residentId = residentInfo.id;
            const apartmentId = residentInfo.apartment_id;

            // 1. Số thông báo chưa đọc
            let unreadNotifications = 0;
            try {
                const [result] = await db.execute(`
                    SELECT COUNT(*) as count 
                    FROM notification_recipients 
                    WHERE recipient_id = ? AND is_read = FALSE
                `, [residentId]);
                unreadNotifications = result[0].count || 0;
            } catch (e) { console.log('Sidebar badge - notifications error:', e.message); }

            // 2. Số hóa đơn chưa thanh toán
            let unpaidFees = 0;
            if (apartmentId) {
                try {
                    const [result] = await db.execute(`
                        SELECT COUNT(*) as count 
                        FROM fees 
                        WHERE apartment_id = ? AND status != 'Đã thanh toán'
                    `, [apartmentId]);
                    unpaidFees = result[0].count || 0;
                } catch (e) { console.log('Sidebar badge - fees error:', e.message); }
            }

            // 3. Số báo cáo có phản hồi mới (có admin_response và chưa đánh giá)
            let updatedReports = 0;
            try {
                const [result] = await db.execute(`
                    SELECT COUNT(*) as count 
                    FROM reports 
                    WHERE reported_by = ? 
                    AND status = 'Hoàn thành' 
                    AND admin_response IS NOT NULL 
                    AND (rating IS NULL OR rating = 0)
                `, [residentId]);
                updatedReports = result[0].count || 0;
            } catch (e) { console.log('Sidebar badge - reports error:', e.message); }

            res.json({
                success: true,
                data: {
                    unreadNotifications,
                    unpaidFees,
                    updatedReports
                }
            });

        } catch (error) {
            console.error('[SidebarController] getBadgeCounts error:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * POST /api/sidebar/mark-fees-viewed
     * Endpoint giữ lại để frontend không bị lỗi (không làm gì)
     */
    markFeesViewed: async (req, res) => {
        // Không cần làm gì - frontend đã xử lý xóa badge ngay khi click
        res.json({ success: true, message: 'OK' });
    }
};

module.exports = sidebarController;
