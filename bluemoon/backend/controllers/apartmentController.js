// File: backend/controllers/apartmentController.js

const db = require('../config/db');

const apartmentController = {

    // [GET] /api/apartments
    getAllApartments: async (req, res) => {
        try {
            const query = `
                SELECT * FROM apartments 
                ORDER BY building ASC, floor ASC, apartment_code ASC
            `;
            const [rows] = await db.query(query);
            res.json({ success: true, count: rows.length, data: rows });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [GET] /api/apartments/:id
    getApartmentDetail: async (req, res) => {
        try {
            const { id } = req.params;

            // 1. Thông tin căn hộ
            const [aptRows] = await db.query(`SELECT * FROM apartments WHERE id = ?`, [id]);
            if (aptRows.length === 0) return res.status(404).json({ message: 'Không tồn tại.' });
            
            // 2. Thành viên (Chỉ lấy thông tin cần thiết để hiển thị công khai nội bộ)
            const [members] = await db.query(`
                SELECT id, full_name, role, status 
                FROM residents 
                WHERE apartment_id = ? AND status IN ('Đang sinh sống', 'Tạm vắng')
                ORDER BY role ASC
            `, [id]);

            res.json({
                success: true,
                data: { ...aptRows[0], members }
            });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = apartmentController;