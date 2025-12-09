// File: backend/controllers/accessController.js

const db = require('../config/db');

/**
 * GET /api/access/logs
 * Lấy danh sách lịch sử ra vào (có pagination)
 */
exports.getAccessLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const [logs] = await db.query(`
            SELECT 
                al.id,
                al.plate_number,
                al.vehicle_type,
                al.direction,
                al.gate,
                al.status,
                al.resident_id,
                al.note,
                al.image_url,
                al.created_at,
                r.full_name as resident_name,
                a.apartment_code
            FROM access_logs al
            LEFT JOIN residents r ON al.resident_id = r.id
            LEFT JOIN apartments a ON r.apartment_id = a.id
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?
        `, [parseInt(limit), parseInt(offset)]);

        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM access_logs');

        res.json({
            success: true,
            data: logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total
            }
        });
    } catch (error) {
        console.error('Error getting access logs:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch sử ra vào' });
    }
};

/**
 * GET /api/access/latest
 * Lấy bản ghi mới nhất (cho polling)
 * Query param: lastId - ID cuối cùng đã nhận (để kiểm tra có bản ghi mới không)
 */
exports.getLatestAccess = async (req, res) => {
    try {
        const { lastId = 0 } = req.query;

        const [logs] = await db.query(`
            SELECT 
                al.id,
                al.plate_number,
                al.vehicle_type,
                al.direction,
                al.gate,
                al.status,
                al.resident_id,
                al.note,
                al.image_url,
                al.created_at,
                r.full_name as resident_name,
                a.apartment_code
            FROM access_logs al
            LEFT JOIN residents r ON al.resident_id = r.id
            LEFT JOIN apartments a ON r.apartment_id = a.id
            WHERE al.id > ?
            ORDER BY al.created_at DESC
        `, [parseInt(lastId)]);

        res.json({
            success: true,
            data: logs,
            hasNew: logs.length > 0
        });
    } catch (error) {
        console.error('Error getting latest access:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy bản ghi mới nhất' });
    }
};

/**
 * GET /api/access/stats
 * Thống kê ra vào hôm nay
 */
exports.getAccessStats = async (req, res) => {
    try {
        // Lượt ra vào hôm nay
        const [[{ totalToday }]] = await db.query(`
            SELECT COUNT(*) as totalToday 
            FROM access_logs 
            WHERE DATE(created_at) = CURDATE()
        `);

        // Số cảnh báo hôm nay
        const [[{ warningCount }]] = await db.query(`
            SELECT COUNT(*) as warningCount 
            FROM access_logs 
            WHERE DATE(created_at) = CURDATE() AND status IN ('Warning', 'Alert')
        `);

        res.json({
            success: true,
            data: {
                totalToday,
                warningCount
            }
        });
    } catch (error) {
        console.error('Error getting access stats:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy thống kê' });
    }
};

/**
 * POST /api/access/simulate
 * Mô phỏng xe ra vào (từ barrier simulator)
 */
exports.simulateAccess = async (req, res) => {
    try {
        const { plate_number, direction, gate } = req.body;

        if (!plate_number || !direction) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin biển số hoặc hướng' });
        }

        // Tìm xe trong database
        const [vehicles] = await db.query(`
            SELECT v.*, r.id as resident_id, r.full_name, a.apartment_code
            FROM vehicles v
            JOIN residents r ON v.resident_id = r.id
            JOIN apartments a ON r.apartment_id = a.id
            WHERE v.license_plate = ? AND v.status = 'Đang sử dụng'
        `, [plate_number]);

        let status = 'Normal';
        let resident_id = null;
        let note = 'Xe lạ chưa đăng ký';
        let vehicle_type = 'Ô tô';

        if (vehicles.length > 0) {
            // Xe đã đăng ký
            const vehicle = vehicles[0];
            resident_id = vehicle.resident_id;
            note = `Cư dân ${vehicle.apartment_code}`;
            vehicle_type = vehicle.vehicle_type;
        } else if (plate_number === 'BLACKLIST' || plate_number.includes('BLACKLIST')) {
            // Xe trong danh sách đen (giả lập)
            status = 'Alert';
            note = 'Biển số trong danh sách đen!';
        } else {
            // Xe lạ
            status = 'Warning';
        }

        // Random gate nếu không được cung cấp
        const gates = ['Cổng A', 'Cổng B', 'Hầm B1'];
        const selectedGate = gate || gates[Math.floor(Math.random() * gates.length)];

        // Lưu vào database
        const [result] = await db.query(`
            INSERT INTO access_logs (plate_number, vehicle_type, direction, gate, status, resident_id, note, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [plate_number, vehicle_type, direction, selectedGate, status, resident_id, note]);

        // Lấy bản ghi vừa tạo để trả về
        const [newLog] = await db.query(`
            SELECT 
                al.id,
                al.plate_number,
                al.vehicle_type,
                al.direction,
                al.gate,
                al.status,
                al.resident_id,
                al.note,
                al.image_url,
                al.created_at,
                r.full_name as resident_name,
                a.apartment_code
            FROM access_logs al
            LEFT JOIN residents r ON al.resident_id = r.id
            LEFT JOIN apartments a ON r.apartment_id = a.id
            WHERE al.id = ?
        `, [result.insertId]);

        res.json({
            success: true,
            message: 'Đã ghi nhận xe ra vào',
            data: newLog[0]
        });
    } catch (error) {
        console.error('Error simulating access:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi mô phỏng ra vào' });
    }
};

/**
 * GET /api/access/simulator-vehicles
 * Lấy danh sách xe cho simulator
 */
exports.getSimulatorVehicles = async (req, res) => {
    try {
        const [vehicles] = await db.query(`
            SELECT 
                v.id,
                v.license_plate,
                v.vehicle_type,
                v.brand,
                v.model,
                r.full_name as owner_name,
                a.apartment_code
            FROM vehicles v
            JOIN residents r ON v.resident_id = r.id
            JOIN apartments a ON r.apartment_id = a.id
            WHERE v.status = 'Đang sử dụng'
            ORDER BY a.apartment_code, v.vehicle_type
        `);

        // Thêm xe giả lập (xe lạ, xe blacklist)
        const simulatedVehicles = [
            { id: 'fake-1', license_plate: '51G-99999', vehicle_type: 'Ô tô', brand: 'N/A', model: 'N/A', owner_name: 'Xe lạ', apartment_code: '---', isSimulated: true },
            { id: 'fake-2', license_plate: 'BLACKLIST-001', vehicle_type: 'Xe máy', brand: 'N/A', model: 'N/A', owner_name: 'CẢNH BÁO', apartment_code: '---', isSimulated: true, isBlacklist: true },
        ];

        res.json({
            success: true,
            data: [...vehicles, ...simulatedVehicles]
        });
    } catch (error) {
        console.error('Error getting simulator vehicles:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách xe' });
    }
};

/**
 * GET /api/access/report
 * Lấy dữ liệu báo cáo phân tích ra vào
 */
exports.getReportData = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Validate dates
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Thiếu ngày bắt đầu hoặc kết thúc' });
        }

        // Thống kê tổng quan
        const [[stats]] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Normal' THEN 1 ELSE 0 END) as normalCount,
                SUM(CASE WHEN status = 'Warning' THEN 1 ELSE 0 END) as warningCount,
                SUM(CASE WHEN status = 'Alert' THEN 1 ELSE 0 END) as alertCount,
                SUM(CASE WHEN direction = 'In' THEN 1 ELSE 0 END) as inCount,
                SUM(CASE WHEN direction = 'Out' THEN 1 ELSE 0 END) as outCount
            FROM access_logs
            WHERE DATE(created_at) BETWEEN ? AND ?
        `, [startDate, endDate]);

        // Danh sách các trường hợp bất thường
        const [anomalies] = await db.query(`
            SELECT 
                al.id,
                al.plate_number,
                al.vehicle_type,
                al.direction,
                al.gate,
                al.status,
                al.note,
                al.created_at,
                r.full_name as resident_name,
                a.apartment_code
            FROM access_logs al
            LEFT JOIN residents r ON al.resident_id = r.id
            LEFT JOIN apartments a ON r.apartment_id = a.id
            WHERE DATE(al.created_at) BETWEEN ? AND ?
            AND al.status IN ('Warning', 'Alert')
            ORDER BY al.created_at DESC
        `, [startDate, endDate]);

        // Thống kê theo ngày (để vẽ biểu đồ)
        const [dailyStats] = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Normal' THEN 1 ELSE 0 END) as normal,
                SUM(CASE WHEN status IN ('Warning', 'Alert') THEN 1 ELSE 0 END) as abnormal
            FROM access_logs
            WHERE DATE(created_at) BETWEEN ? AND ?
            GROUP BY DATE(created_at)
            ORDER BY date
        `, [startDate, endDate]);

        res.json({
            success: true,
            data: {
                stats,
                anomalies,
                dailyStats,
                period: { startDate, endDate }
            }
        });
    } catch (error) {
        console.error('Error getting report data:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu báo cáo' });
    }
};

/**
 * GET /api/access/export-pdf
 * Xuất báo cáo PDF
 */
exports.exportReportPDF = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Thiếu ngày bắt đầu hoặc kết thúc' });
        }

        // Lấy dữ liệu thống kê
        const [[stats]] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Normal' THEN 1 ELSE 0 END) as normalCount,
                SUM(CASE WHEN status = 'Warning' THEN 1 ELSE 0 END) as warningCount,
                SUM(CASE WHEN status = 'Alert' THEN 1 ELSE 0 END) as alertCount
            FROM access_logs
            WHERE DATE(created_at) BETWEEN ? AND ?
        `, [startDate, endDate]);

        // Lấy danh sách bất thường
        const [anomalies] = await db.query(`
            SELECT 
                al.plate_number,
                al.vehicle_type,
                al.direction,
                al.gate,
                al.status,
                al.note,
                al.created_at
            FROM access_logs al
            WHERE DATE(al.created_at) BETWEEN ? AND ?
            AND al.status IN ('Warning', 'Alert')
            ORDER BY al.created_at DESC
        `, [startDate, endDate]);

        // Tạo nội dung HTML cho báo cáo
        const formatDate = (dateStr) => {
            const d = new Date(dateStr);
            return d.toLocaleDateString('vi-VN');
        };

        const formatDateTime = (dateStr) => {
            const d = new Date(dateStr);
            return d.toLocaleString('vi-VN');
        };

        let anomalyRows = anomalies.map((a, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${formatDateTime(a.created_at)}</td>
                <td><strong>${a.plate_number}</strong></td>
                <td>${a.vehicle_type}</td>
                <td>${a.gate}</td>
                <td>${a.direction === 'In' ? 'Vào' : 'Ra'}</td>
                <td style="color: ${a.status === 'Alert' ? 'red' : 'orange'}; font-weight: bold;">
                    ${a.status === 'Alert' ? '🚨 BÁO ĐỘNG' : '⚠️ Cảnh báo'}
                </td>
                <td>${a.note || ''}</td>
            </tr>
        `).join('');

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Báo cáo Ra Vào - BlueMoon</title>
            <style>
                body { font-family: 'Times New Roman', serif; margin: 40px; font-size: 14px; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { margin: 0; color: #1a237e; }
                .header h2 { margin: 10px 0; }
                .info { margin-bottom: 20px; }
                .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                .stat-box { text-align: center; padding: 15px; border: 1px solid #ccc; border-radius: 8px; min-width: 120px; }
                .stat-box h3 { margin: 0; font-size: 28px; }
                .stat-box.warning { background: #fff3e0; color: #e65100; }
                .stat-box.alert { background: #ffebee; color: #c62828; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #1a237e; color: white; }
                tr:nth-child(even) { background: #f9f9f9; }
                .footer { margin-top: 40px; text-align: right; }
                .signature { margin-top: 60px; display: flex; justify-content: space-between; }
                .signature div { text-align: center; width: 200px; }
                @media print { body { margin: 20px; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏢 CHUNG CƯ BLUEMOON</h1>
                <h2>BÁO CÁO TÌNH HÌNH RA VÀO</h2>
                <p>Từ ngày ${formatDate(startDate)} đến ngày ${formatDate(endDate)}</p>
            </div>

            <div class="info">
                <p><strong>Ngày lập báo cáo:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            </div>

            <h3>I. THỐNG KÊ TỔNG QUAN</h3>
            <div class="stats">
                <div class="stat-box">
                    <h3>${stats.total}</h3>
                    <p>Tổng lượt</p>
                </div>
                <div class="stat-box">
                    <h3>${stats.normalCount}</h3>
                    <p>Bình thường</p>
                </div>
                <div class="stat-box warning">
                    <h3>${stats.warningCount}</h3>
                    <p>Cảnh báo</p>
                </div>
                <div class="stat-box alert">
                    <h3>${stats.alertCount}</h3>
                    <p>Báo động</p>
                </div>
            </div>

            <h3>II. CHI TIẾT CÁC TRƯỜNG HỢP BẤT THƯỜNG</h3>
            ${anomalies.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Thời gian</th>
                        <th>Biển số</th>
                        <th>Loại xe</th>
                        <th>Cổng</th>
                        <th>Hướng</th>
                        <th>Trạng thái</th>
                        <th>Ghi chú</th>
                    </tr>
                </thead>
                <tbody>
                    ${anomalyRows}
                </tbody>
            </table>
            ` : '<p><em>Không có trường hợp bất thường trong khoảng thời gian này.</em></p>'}

            <div class="signature">
                <div>
                    <p><strong>Người lập báo cáo</strong></p>
                    <br><br><br>
                    <p>___________________</p>
                </div>
                <div>
                    <p><strong>Ban Quản Trị</strong></p>
                    <br><br><br>
                    <p>___________________</p>
                </div>
            </div>

            <div class="footer">
                <p><em>Báo cáo được xuất từ hệ thống BlueMoon Apartment Management</em></p>
            </div>

            <script>
                // Tự động mở hộp thoại in khi trang load
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
        `;

        // Trả về HTML (client sẽ dùng để print/save as PDF)
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(htmlContent);

    } catch (error) {
        console.error('Error exporting PDF:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xuất báo cáo' });
    }
};
