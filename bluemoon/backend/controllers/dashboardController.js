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

            // 2. Tổng số cư dân & [MỚI] Biến động nhân khẩu tháng này
            let totalResidents = 0;
            let demographics = { moveIn: 0, moveOut: 0 };
            try {
                const [residents] = await db.execute('SELECT COUNT(*) as total FROM residents WHERE status = "Đang sinh sống"');
                totalResidents = residents[0].total;

                // Thống kê chuyển đến/đi trong tháng hiện tại
                const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
                const [demoStats] = await db.execute(`
                    SELECT 
                        SUM(CASE WHEN event_type = 'Chuyển đến' THEN 1 ELSE 0 END) as move_in,
                        SUM(CASE WHEN event_type = 'Chuyển đi' THEN 1 ELSE 0 END) as move_out
                    FROM residence_history
                    WHERE DATE_FORMAT(event_date, '%Y-%m') = ?
                `, [currentMonth]);
                demographics = {
                    moveIn: demoStats[0].move_in || 0,
                    moveOut: demoStats[0].move_out || 0
                };
            } catch (e) { console.log('demographics error:', e.message); }

            // 3. Số đơn dịch vụ chờ xử lý
            let pendingServiceRequests = 0;
            try {
                const [pendingServices] = await db.execute(
                    "SELECT COUNT(*) as total FROM service_bookings WHERE status IN ('Chờ duyệt', 'Đã duyệt')"
                );
                pendingServiceRequests = pendingServices[0].total;
            } catch (e) { console.log('service_bookings table error:', e.message); }

            // 4. Số sự cố mới (chưa xử lý)
            let pendingIncidents = 0;
            try {
                const [newIncidents] = await db.execute(
                    "SELECT COUNT(*) as total FROM reports WHERE status IN ('Mới', 'Đang xử lý')"
                );
                pendingIncidents = newIncidents[0].total;
            } catch (e) { console.log('reports table error:', e.message); }

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
                    SELECT rp.id, rp.title, rp.status, rp.priority, rp.created_at,
                           a.apartment_code
                    FROM reports rp
                    LEFT JOIN residents r ON rp.reported_by = r.id
                    LEFT JOIN apartments a ON r.apartment_id = a.id
                    ORDER BY rp.created_at DESC
                    LIMIT 5
                `);
                recentIncidents = data;
            } catch (e) { console.log('recent reports error:', e.message); }

            // 8. Đơn dịch vụ gần đây  
            let recentServices = [];
            try {
                const [data] = await db.execute(`
                    SELECT sb.id, sb.status, sb.created_at,
                           st.name as service_name,
                           a.apartment_code
                    FROM service_bookings sb
                    LEFT JOIN service_types st ON sb.service_type_id = st.id
                    LEFT JOIN residents r ON sb.resident_id = r.id
                    LEFT JOIN apartments a ON r.apartment_id = a.id
                    ORDER BY sb.created_at DESC
                    LIMIT 5
                `);
                recentServices = data;
            } catch (e) { console.log('recent service_bookings error:', e.message); }

            res.json({
                success: true,
                data: {
                    stats: {
                        totalApartments,
                        totalResidents,
                        demographics, // [MỚI] Thêm số liệu chuyển đến/đi
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
            // ... (Phần logic Kế toán của bạn đã Tốt - Giữ nguyên không thay đổi)
            // Tôi rút gọn phần này trong hiển thị để tập trung vào phần Resident thay đổi nhiều
            // Bạn hãy giữ nguyên code cũ của getAccountantStats ở đây
            
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
                        ft.fee_name as fee_type,
                        COUNT(f.id) as count,
                        COALESCE(SUM(f.total_amount), 0) as total,
                        COALESCE(SUM(f.amount_paid), 0) as paid,
                        COALESCE(SUM(f.amount_remaining), 0) as remaining
                    FROM fee_types ft
                    LEFT JOIN fees f ON ft.id = f.fee_type_id
                    GROUP BY ft.id, ft.fee_name
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
                        ft.fee_name as fee_type,
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
    },

    /**
     * Lấy thống kê cho Cư dân
     * GET /api/dashboard/resident
     */
    getResidentStats: async (req, res) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ message: 'Không xác định được người dùng.' });
            }

            // Tìm resident từ user_id
            let residentId = null;
            let apartmentId = null;
            let apartmentInfo = null;

            try {
                const [residents] = await db.execute(
                    'SELECT id, apartment_id FROM residents WHERE user_id = ?',
                    [userId]
                );
                if (residents.length > 0) {
                    residentId = residents[0].id;
                    apartmentId = residents[0].apartment_id;
                }
            } catch (e) { console.log('resident lookup error:', e.message); }

            // Thông tin căn hộ
            if (apartmentId) {
                try {
                    const [apartments] = await db.execute(
                        'SELECT apartment_code, building, floor, area, status FROM apartments WHERE id = ?',
                        [apartmentId]
                    );
                    if (apartments.length > 0) {
                        apartmentInfo = apartments[0];
                    }

                    const [memberCount] = await db.execute(
                        'SELECT COUNT(*) as count FROM residents WHERE apartment_id = ?',
                        [apartmentId]
                    );
                    if (apartmentInfo) {
                        apartmentInfo.memberCount = memberCount[0].count || 0;
                    }
                } catch (e) { console.log('apartment lookup error:', e.message); }
            }

            // Thống kê công nợ
            let feeStats = { totalDebt: 0, unpaidInvoices: 0, overdueInvoices: 0, paidInvoices: 0 };
            if (apartmentId) {
                try {
                    const [stats] = await db.execute(`
                        SELECT 
                            COALESCE(SUM(amount_remaining), 0) as total_debt,
                            SUM(CASE WHEN status != 'Đã thanh toán' THEN 1 ELSE 0 END) as unpaid,
                            SUM(CASE WHEN status != 'Đã thanh toán' AND due_date < CURDATE() THEN 1 ELSE 0 END) as overdue,
                            SUM(CASE WHEN status = 'Đã thanh toán' THEN 1 ELSE 0 END) as paid
                        FROM fees WHERE apartment_id = ?
                    `, [apartmentId]);
                    feeStats = {
                        totalDebt: stats[0].total_debt || 0,
                        unpaidInvoices: stats[0].unpaid || 0,
                        overdueInvoices: stats[0].overdue || 0,
                        paidInvoices: stats[0].paid || 0
                    };
                } catch (e) { console.log('fee stats error:', e.message); }
            }

            // [MỚI] Biểu đồ tiêu thụ Điện/Nước 6 tháng gần nhất (US 025)
            // Lấy từ bảng utility_readings (bảng mới ta đã thêm)
            let utilityUsage = [];
            if (apartmentId) {
                try {
                    const [readings] = await db.execute(`
                        SELECT 
                            billing_period,
                            service_type, -- 'Điện' hoặc 'Nước'
                            usage_amount
                        FROM utility_readings
                        WHERE apartment_id = ?
                        ORDER BY recorded_date ASC
                        LIMIT 12 -- Lấy tối đa 12 bản ghi (6 tháng x 2 loại)
                    `, [apartmentId]);
                    utilityUsage = readings;
                } catch (e) { console.log('utility usage error:', e.message); }
            }

            // Hóa đơn chưa thanh toán gần đây
            let pendingInvoices = [];
            if (apartmentId) {
                try {
                    const [invoices] = await db.execute(`
                        SELECT f.id, ft.fee_name as fee_type, f.total_amount, f.amount_remaining, f.due_date, f.status,
                               DATEDIFF(CURDATE(), f.due_date) as days_overdue
                        FROM fees f
                        LEFT JOIN fee_types ft ON f.fee_type_id = ft.id
                        WHERE f.apartment_id = ? AND f.status != 'Đã thanh toán'
                        ORDER BY f.due_date ASC
                        LIMIT 5
                    `, [apartmentId]);
                    pendingInvoices = invoices;
                } catch (e) { console.log('pending invoices error:', e.message); }
            }

            // Yêu cầu dịch vụ & Sự cố (Giữ nguyên)
            let recentServiceRequests = [];
            let pendingServiceCount = 0;
            let recentIncidents = [];
            
            if (residentId) {
                try {
                    const [services] = await db.execute(`
                        SELECT sb.id, st.name as service_name, sb.status, sb.created_at
                        FROM service_bookings sb
                        LEFT JOIN service_types st ON sb.service_type_id = st.id
                        WHERE sb.resident_id = ?
                        ORDER BY sb.created_at DESC
                        LIMIT 5
                    `, [residentId]);
                    recentServiceRequests = services;

                    const [count] = await db.execute(`
                        SELECT COUNT(*) as count FROM service_bookings 
                        WHERE resident_id = ? AND status IN ('Chờ duyệt', 'Đã duyệt')
                    `, [residentId]);
                    pendingServiceCount = count[0].count || 0;

                    const [incidents] = await db.execute(`
                        SELECT id, title, status, priority, created_at
                        FROM reports
                        WHERE reported_by = ?
                        ORDER BY created_at DESC
                        LIMIT 5
                    `, [residentId]);
                    recentIncidents = incidents;
                } catch (e) { console.log('services/incidents error:', e.message); }
            }

            // Thông báo mới
            let newNotifications = 0;
            try {
                // Đếm thông báo chung + thông báo riêng chưa đọc
                // Ở đây lấy đơn giản theo ngày, thực tế nên query bảng notification_recipients
                const [count] = await db.execute(`
                    SELECT COUNT(*) as count FROM notifications 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                `);
                newNotifications = count[0].count || 0;
            } catch (e) { console.log('notifications count error:', e.message); }

            res.json({
                success: true,
                data: {
                    apartment: apartmentInfo,
                    stats: {
                        totalDebt: feeStats.totalDebt,
                        unpaidInvoices: feeStats.unpaidInvoices,
                        overdueInvoices: feeStats.overdueInvoices,
                        paidInvoices: feeStats.paidInvoices,
                        pendingServiceRequests: pendingServiceCount,
                        newNotifications
                    },
                    charts: {
                        utilityUsage // [MỚI] Data vẽ biểu đồ điện nước
                    },
                    pendingInvoices,
                    recentServiceRequests,
                    recentIncidents
                }
            });

        } catch (error) {
            console.error('[DashboardController] getResidentStats error:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = dashboardController;