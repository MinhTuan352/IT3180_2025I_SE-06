const db = require('../config/db');

class Review {
    // Create new review
    static async create(data) {
        const query = `
            INSERT INTO reviews (resident_id, rating, feedback, survey_response)
            VALUES (?, ?, ?, ?)
        `;
        return db.execute(query, [
            data.resident_id,
            data.rating,
            data.feedback,
            JSON.stringify(data.survey_response || {})
        ]);
    }

    // Get all reviews (for BOD)
    static async getAll() {
        const query = `
            SELECT r.*, res.full_name, res.apartment_id, a.apartment_code, a.building
            FROM reviews r
            JOIN residents res ON r.resident_id = res.id
            JOIN apartments a ON res.apartment_id = a.id
            ORDER BY r.created_at DESC
        `;
        const [rows] = await db.execute(query);
        return rows;
    }

    // Get reviews by resident (for Resident history)
    static async getByResidentId(residentId) {
        const query = `
            SELECT * FROM reviews 
            WHERE resident_id = ?
            ORDER BY created_at DESC
        `;
        const [rows] = await db.execute(query, [residentId]);
        return rows;
    }

    // Mark as viewed
    static async markAsViewed(id) {
        const query = `UPDATE reviews SET status = 'Đã xem' WHERE id = ?`;
        return db.execute(query, [id]);
    }

    // Get stats
    static async getStats() {
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
}

module.exports = Review;
