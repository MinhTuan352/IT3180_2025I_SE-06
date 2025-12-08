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
    },

    /**
     * Lấy thống kê cho Kế toán
     * GET /api/dashboard/accountant
     */
    getAccountantStats: async (req, res) => {
        try {
            // 1. Thống kê hóa đơn tổng quan
            let invoiceStats = { total: 0, paid: 0, unpaid: 0, overdue: 0 };
            let totalRevenue = 0;
            let totalDebt = 0;
            try {
                const [stats] = await db.execute(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'Đã thanh toán' THEN 1 ELSE 0 END) as paid,
                        SUM(CASE WHEN status != 'Đã thanh toán' THEN 1 ELSE 0 END) as unpaid,
                        SUM(CASE WHEN status != 'Đã thanh toán' AND due_date < CURDATE() THEN 1 ELSE 0 END) as overdue,
                        COALESCE(SUM(amount_paid), 0) as total_revenue,
                        COALESCE(SUM(amount_remaining), 0) as total_debt
                    FROM fees
                `);
                invoiceStats = {
                    total: stats[0].total || 0,
                    paid: stats[0].paid || 0,
                    unpaid: stats[0].unpaid || 0,
                    overdue: stats[0].overdue || 0
                };
                totalRevenue = stats[0].total_revenue || 0;
                totalDebt = stats[0].total_debt || 0;
            } catch (e) { console.log('invoice stats error:', e.message); }

            // 2. Thống kê theo tháng (12 tháng gần nhất)
            let monthlyData = [];
            try {
                const [data] = await db.execute(`
                    SELECT 
                        DATE_FORMAT(created_at, '%Y-%m') as month,
                        COUNT(*) as total_invoices,
                        SUM(CASE WHEN status = 'Đã thanh toán' THEN 1 ELSE 0 END) as paid_invoices,
                        COALESCE(SUM(total_amount), 0) as total_amount,
                        COALESCE(SUM(amount_paid), 0) as collected,
                        COALESCE(SUM(amount_remaining), 0) as remaining
                    FROM fees 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                    ORDER BY month ASC
                `);
                monthlyData = data;
            } catch (e) { console.log('monthly data error:', e.message); }

            // 3. Thống kê theo loại phí
            let feeTypeStats = [];
            try {
                const [data] = await db.execute(`
                    SELECT 
                        ft.name as fee_type,
                        COUNT(f.id) as count,
                        COALESCE(SUM(f.total_amount), 0) as total,
                        COALESCE(SUM(f.amount_paid), 0) as paid,
                        COALESCE(SUM(f.amount_remaining), 0) as remaining
                    FROM fee_types ft
                    LEFT JOIN fees f ON ft.id = f.fee_type_id
                    GROUP BY ft.id, ft.name
                    ORDER BY total DESC
                    LIMIT 6
                `);
                feeTypeStats = data;
            } catch (e) { console.log('fee type stats error:', e.message); }

            // 4. Hóa đơn quá hạn gần đây
            let overdueInvoices = [];
            try {
                const [data] = await db.execute(`
                    SELECT 
                        f.id,
                        a.apartment_code,
                        ft.name as fee_type,
                        f.total_amount,
                        f.amount_remaining,
                        f.due_date,
                        DATEDIFF(CURDATE(), f.due_date) as days_overdue
                    FROM fees f
                    LEFT JOIN apartments a ON f.apartment_id = a.id
                    LEFT JOIN fee_types ft ON f.fee_type_id = ft.id
                    WHERE f.status != 'Đã thanh toán' AND f.due_date < CURDATE()
                    ORDER BY f.due_date ASC
                    LIMIT 10
                `);
                overdueInvoices = data;
            } catch (e) { console.log('overdue invoices error:', e.message); }

            // 5. Dự đoán doanh thu tháng tới (dựa trên trung bình 3 tháng gần nhất)
            let prediction = { nextMonth: 0, trend: 'stable' };
            try {
                const [data] = await db.execute(`
                    SELECT COALESCE(AVG(monthly_total), 0) as avg_revenue
                    FROM (
                        SELECT SUM(amount_paid) as monthly_total
                        FROM fees
                        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
                        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                    ) as monthly
                `);
                const avgRevenue = data[0]?.avg_revenue || 0;

                // Tính trend
                if (monthlyData.length >= 2) {
                    const lastMonth = Number(monthlyData[monthlyData.length - 1]?.collected || 0);
                    const prevMonth = Number(monthlyData[monthlyData.length - 2]?.collected || 0);
                    if (lastMonth > prevMonth * 1.1) prediction.trend = 'up';
                    else if (lastMonth < prevMonth * 0.9) prediction.trend = 'down';
                }

                prediction.nextMonth = avgRevenue;
            } catch (e) { console.log('prediction error:', e.message); }

            // 6. Tỷ lệ thu phí theo căn hộ (top 5 nợ nhiều)
            let topDebtors = [];
            try {
                const [data] = await db.execute(`
                    SELECT 
                        a.apartment_code,
                        COUNT(f.id) as invoice_count,
                        COALESCE(SUM(f.amount_remaining), 0) as total_debt
                    FROM apartments a
                    LEFT JOIN fees f ON a.id = f.apartment_id AND f.status != 'Đã thanh toán'
                    GROUP BY a.id, a.apartment_code
                    HAVING total_debt > 0
                    ORDER BY total_debt DESC
                    LIMIT 5
                `);
                topDebtors = data;
            } catch (e) { console.log('top debtors error:', e.message); }

            res.json({
                success: true,
                data: {
                    stats: {
                        totalInvoices: invoiceStats.total,
                        paidInvoices: invoiceStats.paid,
                        unpaidInvoices: invoiceStats.unpaid,
                        overdueInvoices: invoiceStats.overdue,
                        totalRevenue,
                        totalDebt,
                        collectionRate: invoiceStats.total > 0
                            ? Math.round((invoiceStats.paid / invoiceStats.total) * 100)
                            : 0
                    },
                    charts: {
                        monthlyRevenue: monthlyData,
                        feeTypeStats,
                        topDebtors
                    },
                    overdueInvoices,
                    prediction
                }
            });

        } catch (error) {
            console.error('[DashboardController] getAccountantStats error:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = dashboardController;
