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
