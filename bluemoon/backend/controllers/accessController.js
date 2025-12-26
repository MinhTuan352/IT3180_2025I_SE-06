// File: backend/controllers/accessController.js

const AccessLog = require('../models/accessModel');
const db = require('../config/db'); 
const xl = require('excel4node'); // Cần cài: npm install excel4node

const accessController = {

    // 1. Lấy danh sách (Pagination)
    getAccessLogs: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;

            const logs = await AccessLog.getAll(limit, offset);
            const total = await AccessLog.countAll();

            res.json({
                success: true,
                data: logs,
                pagination: { page, limit, total }
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // 2. Thống kê nhanh
    getAccessStats: async (req, res) => {
        try {
            const stats = await AccessLog.getStatsToday();
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.' });
        }
    },

    /**
     * GET /api/access/latest
     * Lấy bản ghi mới nhất (cho polling)
     * Query param: lastId - ID cuối cùng đã nhận (để kiểm tra có bản ghi mới không)
     */
    getLatestAccess: async (req, res) => {
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
    },

    // 3. Simulator (Check-in/Check-out) - [CẬP NHẬT LOGIC]
    simulateAccess: async (req, res) => {
        try {
            const { plate_number, direction, gate, image_url } = req.body;

            // [FIX REQ 13] Bắt buộc chọn cổng, không random
            if (!plate_number || !direction || !gate) {
                return res.status(400).json({ message: 'Thiếu thông tin: Biển số, Hướng hoặc Cổng.' });
            }

            let status = 'Normal';
            let note = '';
            let residentId = null;
            let vehicleType = 'Ô tô'; 

            // A. Kiểm tra xe trong DB (Req 12)
            // Query trực tiếp bảng vehicles để lấy thông tin mới nhất
            const [vehicles] = await db.query(`
                SELECT v.*, r.id as resident_id, a.apartment_code 
                FROM vehicles v
                JOIN residents r ON v.resident_id = r.id
                JOIN apartments a ON r.apartment_id = a.id
                WHERE v.license_plate = ? AND v.status = 'Đang sử dụng'
            `, [plate_number]);

            if (vehicles.length > 0) {
                const v = vehicles[0];
                residentId = v.resident_id;
                vehicleType = v.vehicle_type;
                note = `Cư dân ${v.apartment_code}`;
            } else {
                // Xe lạ hoặc Blacklist
                if (plate_number.includes('BLACKLIST')) {
                    status = 'Alert';
                    note = 'CẢNH BÁO: Xe trong danh sách đen!';
                } else {
                    status = 'Warning';
                    note = 'Xe lạ chưa đăng ký';
                }
            }

            // B. [FIX REQ 11] Kiểm tra Ra vào theo cặp (Anti-passback)
            const lastLog = await AccessLog.getLastLogByPlate(plate_number);
            
            if (lastLog) {
                // Nếu lần trước là VÀO, lần này phải là RA (và ngược lại)
                if (lastLog.direction === direction) {
                    status = (status === 'Normal') ? 'Warning' : status; 
                    note += ` | Lỗi: Xe đang ${direction === 'In' ? 'trong bãi' : 'bên ngoài'} (Trùng trạng thái)`;
                }
            } else {
                // Lần đầu thấy xe này mà lại đi RA -> Vô lý
                if (direction === 'Out') {
                    status = (status === 'Normal') ? 'Warning' : status;
                    note += ' | Lỗi: Xe chưa từng vào bãi';
                }
            }

            // C. Lưu Log
            const newLog = await AccessLog.create({
                plate_number,
                vehicle_type: vehicleType,
                direction,
                gate,
                status,
                resident_id: residentId,
                note,
                image_url: image_url || null
            });

            res.json({ success: true, message: 'Ghi nhận thành công', data: newLog });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // 4. Lấy danh sách xe cho Simulator (Dropdown)
    getSimulatorVehicles: async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT v.license_plate, v.vehicle_type, a.apartment_code 
                FROM vehicles v
                JOIN residents r ON v.resident_id = r.id
                JOIN apartments a ON v.apartment_id = a.id
                WHERE v.status = 'Đang sử dụng'
            `);
            
            rows.push({ license_plate: '30A-999.99', vehicle_type: 'Ô tô', apartment_code: 'XE LẠ' });
            rows.push({ license_plate: 'BLACKLIST-01', vehicle_type: 'Xe máy', apartment_code: 'CẤM' });

            res.json({ success: true, data: rows });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.' });
        }
    },

    // 5. [FIX REQ 14] Xuất báo cáo Excel (Thường + Bất thường)
    exportAccessExcel: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) return res.status(400).json({ message: 'Chọn ngày bắt đầu và kết thúc.' });

            const logs = await AccessLog.getByDateRange(startDate, endDate);

            const wb = new xl.Workbook();
            const ws = wb.addWorksheet('Lịch sử Ra Vào');

            // Style Header
            const style = wb.createStyle({
                font: { bold: true, color: '#FFFFFF' },
                fill: { type: 'pattern', patternType: 'solid', fgColor: '#1a237e' }
            });

            // Headers
            ws.cell(1, 1).string('Thời gian').style(style);
            ws.cell(1, 2).string('Biển số').style(style);
            ws.cell(1, 3).string('Loại xe').style(style);
            ws.cell(1, 4).string('Cổng').style(style);
            ws.cell(1, 5).string('Hướng').style(style);
            ws.cell(1, 6).string('Trạng thái').style(style);
            ws.cell(1, 7).string('Cư dân').style(style);
            ws.cell(1, 8).string('Ghi chú').style(style);

            // Data
            logs.forEach((log, i) => {
                const r = i + 2;
                ws.cell(r, 1).string(new Date(log.created_at).toLocaleString('vi-VN'));
                ws.cell(r, 2).string(log.plate_number);
                ws.cell(r, 3).string(log.vehicle_type);
                ws.cell(r, 4).string(log.gate);
                ws.cell(r, 5).string(log.direction === 'In' ? 'Vào' : 'Ra');
                
                // Tô màu trạng thái
                if (log.status === 'Alert') ws.cell(r, 6).string(log.status).style({ font: { color: 'red', bold: true } });
                else if (log.status === 'Warning') ws.cell(r, 6).string(log.status).style({ font: { color: 'orange' } });
                else ws.cell(r, 6).string(log.status);

                ws.cell(r, 7).string(log.resident_name || 'Khách/Vãng lai');
                ws.cell(r, 8).string(log.note || '');
            });

            wb.write('AccessLogs.xlsx', res);

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi xuất báo cáo.' });
        }
    },

    /**
     * GET /api/access/report
     * Lấy dữ liệu báo cáo phân tích ra vào
     */
    getReportData: async (req, res) => {
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
    },

    /**
     * GET /api/access/export-pdf
     * Xuất báo cáo PDF
     */
    exportReportPDF: async (req, res) => {
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
    }
};

module.exports = accessController;