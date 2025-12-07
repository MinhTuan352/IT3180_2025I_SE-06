// File: backend/controllers/apartmentController.js

const db = require('../config/db');

const apartmentController = {

    // [GET] /api/apartments
    // Dùng cho trang ResidentApartmentLookup (Sơ đồ tòa nhà)
    getAllApartments: async (req, res) => {
        try {
            // Lấy tất cả căn hộ
            // Sắp xếp theo Tòa (A,B...) -> Tầng (1,2...) -> Mã căn (A-101...) để frontend dễ xử lý
            const query = `
                SELECT * FROM apartments 
                ORDER BY building ASC, floor ASC, apartment_code ASC
            `;
            
            const [rows] = await db.query(query);

            res.json({
                success: true,
                count: rows.length,
                data: rows
            });
        } catch (error) {
            console.error("Error getting apartments:", error);
            res.status(500).json({ 
                message: 'Lỗi server khi lấy danh sách căn hộ.', 
                error: error.message 
            });
        }
    },

    // [GET] /api/apartments/:id
    // Dùng cho trang ResidentApartmentDetail (Khi click vào 1 căn hộ)
    getApartmentDetail: async (req, res) => {
        try {
            const { id } = req.params;

            // 1. Lấy thông tin cơ bản của căn hộ
            const [aptRows] = await db.query(`SELECT * FROM apartments WHERE id = ?`, [id]);
            
            if (aptRows.length === 0) {
                return res.status(404).json({ message: 'Căn hộ không tồn tại.' });
            }
            const apartment = aptRows[0];

            // 2. Lấy danh sách thành viên (Cư dân) đang sống trong căn hộ này
            // Join với bảng users để lấy username nếu cần, hoặc chỉ lấy bảng residents
            const [members] = await db.query(`
                SELECT * FROM residents 
                WHERE apartment_id = ? AND status = 'Đang sinh sống'
                ORDER BY role ASC -- Chủ hộ lên trước
            `, [id]);

            // Trả về dữ liệu gộp
            res.json({
                success: true,
                data: {
                    ...apartment,
                    members: members // Frontend sẽ map mảng này để hiển thị list cư dân
                }
            });

        } catch (error) {
            console.error("Error getting apartment detail:", error);
            res.status(500).json({ 
                message: 'Lỗi server khi lấy chi tiết căn hộ.', 
                error: error.message 
            });
        }
    }
};

module.exports = apartmentController;