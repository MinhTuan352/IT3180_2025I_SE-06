// File: backend/controllers/dashboardController.js
// Controller lấy dữ liệu thống kê cho Dashboard

const db = require('../config/db');

const dashboardController = {
    /**
     * Lấy thống kê tổng quan cho BOD
     * GET /api/dashboard/bod
     */
    getBODStats: async (req, res) => {
        try {
            // 1. Tổng số căn hộ
            let totalApartments = 0;
            try {
                const [apartments] = await db.execute('SELECT COUNT(*) as total FROM apartments');
                totalApartments = apartments[0].total;
            } catch (e) { console.log('apartments table error:', e.message); }

            // 2. Tổng số cư dân
            let totalResidents = 0;
            try {
                const [residents] = await db.execute('SELECT COUNT(*) as total FROM residents');
                totalResidents = residents[0].total;
            } catch (e) { console.log('residents table error:', e.message); }

            // 3. Số đơn dịch vụ chờ xử lý
            let pendingServiceRequests = 0;
            try {
                const [pendingServices] = await db.execute(
                    "SELECT COUNT(*) as total FROM service_requests WHERE status IN ('Chờ xử lý', 'Đang xử lý')"
                );
                pendingServiceRequests = pendingServices[0].total;
            } catch (e) { console.log('service_requests table error:', e.message); }

            // 4. Số sự cố mới (chưa xử lý)
            let pendingIncidents = 0;
            try {
                const [newIncidents] = await db.execute(
                    "SELECT COUNT(*) as total FROM incidents WHERE status IN ('Chờ xử lý', 'Đang xử lý')"
                );
                pendingIncidents = newIncidents[0].total;
            } catch (e) { console.log('incidents table error:', e.message); }

            // 5. Thống kê hóa đơn tháng này
            let stats = { total_invoices: 0, paid_invoices: 0, unpaid_invoices: 0, total_collected: 0, total_remaining: 0 };
            let paymentRate = 0;
            try {
                const currentMonth = new Date().toISOString().slice(0, 7);
                const [invoiceStats] = await db.execute(`
                    SELECT 
                        COUNT(*) as total_invoices,
                        SUM(CASE WHEN status = 'Đã thanh toán' THEN 1 ELSE 0 END) as paid_invoices,
                        SUM(CASE WHEN status != 'Đã thanh toán' THEN 1 ELSE 0 END) as unpaid_invoices,
                        COALESCE(SUM(amount_paid), 0) as total_collected,
                        COALESCE(SUM(amount_remaining), 0) as total_remaining
                    FROM fees 
                    WHERE DATE_FORMAT(created_at, '%Y-%m') = ?
                `, [currentMonth]);
                stats = invoiceStats[0];
                paymentRate = stats.total_invoices > 0
                    ? Math.round((stats.paid_invoices / stats.total_invoices) * 100)
                    : 0;
            } catch (e) { console.log('fees stats error:', e.message); }

            // 6. Dữ liệu biểu đồ: Thống kê 6 tháng gần nhất
            let monthlyData = [];
            try {
                const [data] = await db.execute(`
                    SELECT 
                        DATE_FORMAT(created_at, '%Y-%m') as month,
                        COUNT(*) as total_invoices,
                        SUM(CASE WHEN status = 'Đã thanh toán' THEN 1 ELSE 0 END) as paid_invoices,
                        COALESCE(SUM(amount_paid), 0) as total_collected
                    FROM fees 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                    ORDER BY month ASC
                `);
                monthlyData = data;
            } catch (e) { console.log('monthly fees error:', e.message); }

            // 7. Sự cố gần đây
            let recentIncidents = [];
            try {
                const [data] = await db.execute(`
                    SELECT i.id, i.title, i.status, i.priority, i.created_at,
                           a.apartment_code
                    FROM incidents i
                    LEFT JOIN apartments a ON i.apartment_id = a.id
                    ORDER BY i.created_at DESC
                    LIMIT 5
                `);
                recentIncidents = data;
            } catch (e) { console.log('recent incidents error:', e.message); }

            // 8. Đơn dịch vụ gần đây  
            let recentServices = [];
            try {
                const [data] = await db.execute(`
                    SELECT sr.id, sr.status, sr.created_at,
                           s.name as service_name,
                           a.apartment_code
                    FROM service_requests sr
                    LEFT JOIN services s ON sr.service_id = s.id
                    LEFT JOIN apartments a ON sr.apartment_id = a.id
                    ORDER BY sr.created_at DESC
                    LIMIT 5
                `);
                recentServices = data;
            } catch (e) { console.log('recent services error:', e.message); }

            res.json({
                success: true,
                data: {
                    stats: {
                        totalApartments,
                        totalResidents,
                        pendingServiceRequests,
                        pendingIncidents,
                        paymentRate,
                        totalCollected: stats.total_collected || 0,
                        totalRemaining: stats.total_remaining || 0,
                        paidInvoices: stats.paid_invoices || 0,
                        unpaidInvoices: stats.unpaid_invoices || 0
                    },
                    charts: {
                        monthlyRevenue: monthlyData
                    },
                    recentIncidents,
                    recentServices
                }
            });

        } catch (error) {
            console.error('[DashboardController] getBODStats error:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = dashboardController;
