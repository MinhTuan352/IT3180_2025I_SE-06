// File: backend/models/reviewModel.js

const db = require('../config/db');

const Review = {
    // Gửi đánh giá mới
    create: async (data) => {
        const query = `
            INSERT INTO reviews (resident_id, rating, feedback, survey_response)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [
            data.resident_id,
            data.rating,
            data.feedback,
            JSON.stringify(data.survey_response || {}) // Lưu JSON câu trả lời khảo sát
        ]);
        return result.insertId;
    },

    // Lấy tất cả (Cho BQT)
    getAll: async () => {
        const query = `
            SELECT r.*, res.full_name, a.apartment_code, a.building
            FROM reviews r
            JOIN residents res ON r.resident_id = res.id
            JOIN apartments a ON res.apartment_id = a.id
            ORDER BY r.created_at DESC
        `;
        const [rows] = await db.execute(query);
        return rows;
    },

    // Lấy theo cư dân (Lịch sử gửi)
    getByResidentId: async (residentId) => {
        const query = `
            SELECT * FROM reviews 
            WHERE resident_id = ?
            ORDER BY created_at DESC
        `;
        const [rows] = await db.execute(query, [residentId]);
        return rows;
    },

    // Đánh dấu đã xem
    markAsViewed: async (id) => {
        const query = `UPDATE reviews SET status = 'Đã xem' WHERE id = ?`;
        return db.execute(query, [id]);
    },

    // Thống kê nhanh (Cho Dashboard)
    getStats: async () => {
        const query = `
            SELECT 
                COUNT(*) as total,
                AVG(rating) as avg_rating,
                SUM(CASE WHEN status = 'Mới' THEN 1 ELSE 0 END) as new_reviews
            FROM reviews
        `;
        const [rows] = await db.execute(query);
        return rows[0];
    }
};

module.exports = Review;