// File: backend/controllers/buildingController.js

const db = require('../config/db');

/**
 * GET /api/building/info
 * Lấy thông tin tòa nhà
 */
exports.getBuildingInfo = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM building_info WHERE id = 1');

        if (rows.length === 0) {
            // Trả về dữ liệu mặc định nếu chưa có trong DB
            return res.json({
                success: true,
                data: {
                    name: 'CHUNG CƯ BLUEMOON',
                    investor: 'Tổng công ty CP Xuất nhập khẩu & Xây dựng Việt Nam (VINACONEX)',
                    location: '289 Khuất Duy Tiến - Trung Hòa - Cầu Giấy - Hà Nội',
                    scale: 'Cao 31 tầng, 03 tầng hầm, 04 tầng dịch vụ thương mại.',
                    apartments: '216 căn hộ diện tích từ 86,5 - 113m2',
                    description: 'Tọa lạc tại vị trí đắc địa...',
                    totalArea: '1,3 ha',
                    startDate: 'Quý IV/2016',
                    finishDate: 'Quý IV/2018',
                    totalInvestment: '618,737 tỷ đồng'
                }
            });
        }

        const info = rows[0];
        res.json({
            success: true,
            data: {
                name: info.name,
                investor: info.investor,
                location: info.location,
                scale: info.scale,
                apartments: info.apartments,
                description: info.description,
                totalArea: info.total_area,
                startDate: info.start_date,
                finishDate: info.finish_date,
                totalInvestment: info.total_investment
            }
        });
    } catch (error) {
        console.error('Error getting building info:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

/**
 * PUT /api/building/info
 * Cập nhật thông tin tòa nhà (BOD only)
 */
exports.updateBuildingInfo = async (req, res) => {
    try {
        const { name, investor, location, scale, apartments, description, totalArea, startDate, finishDate, totalInvestment } = req.body;

        // Upsert - Insert or Update
        await db.query(`
            INSERT INTO building_info (id, name, investor, location, scale, apartments, description, total_area, start_date, finish_date, total_investment)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                investor = VALUES(investor),
                location = VALUES(location),
                scale = VALUES(scale),
                apartments = VALUES(apartments),
                description = VALUES(description),
                total_area = VALUES(total_area),
                start_date = VALUES(start_date),
                finish_date = VALUES(finish_date),
                total_investment = VALUES(total_investment)
        `, [name, investor, location, scale, apartments, description, totalArea, startDate, finishDate, totalInvestment]);

        res.json({ success: true, message: 'Đã cập nhật thông tin tòa nhà' });
    } catch (error) {
        console.error('Error updating building info:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

/**
 * GET /api/building/regulations
 * Lấy danh sách quy định
 */
exports.getRegulations = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM building_regulations ORDER BY sort_order ASC');

        const regulations = rows.map(row => ({
            id: row.id,
            title: row.title,
            content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content
        }));

        res.json({ success: true, data: regulations });
    } catch (error) {
        console.error('Error getting regulations:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

/**
 * POST /api/building/regulations
 * Thêm quy định mới (BOD only)
 */
exports.createRegulation = async (req, res) => {
    try {
        const { title, content } = req.body;

        // Lấy sort_order lớn nhất
        const [[maxOrder]] = await db.query('SELECT MAX(sort_order) as max_order FROM building_regulations');
        const newOrder = (maxOrder.max_order || 0) + 1;

        const [result] = await db.query(
            'INSERT INTO building_regulations (title, content, sort_order) VALUES (?, ?, ?)',
            [title, JSON.stringify(content), newOrder]
        );

        res.json({
            success: true,
            message: 'Đã thêm quy định mới',
            data: { id: result.insertId, title, content }
        });
    } catch (error) {
        console.error('Error creating regulation:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

/**
 * PUT /api/building/regulations/:id
 * Cập nhật quy định (BOD only)
 */
exports.updateRegulation = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        await db.query(
            'UPDATE building_regulations SET title = ?, content = ? WHERE id = ?',
            [title, JSON.stringify(content), id]
        );

        res.json({ success: true, message: 'Đã cập nhật quy định' });
    } catch (error) {
        console.error('Error updating regulation:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

/**
 * DELETE /api/building/regulations/:id
 * Xóa quy định (BOD only)
 */
exports.deleteRegulation = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query('DELETE FROM building_regulations WHERE id = ?', [id]);

        res.json({ success: true, message: 'Đã xóa quy định' });
    } catch (error) {
        console.error('Error deleting regulation:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
