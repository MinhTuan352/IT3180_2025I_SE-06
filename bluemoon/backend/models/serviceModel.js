// File: backend/models/serviceModel.js

const db = require('../config/db');

const Service = {
    getAll: async () => {
        const [rows] = await db.execute('SELECT * FROM service_types ORDER BY id DESC');
        return rows;
    },

    getActiveServices: async () => {
        // [CẬP NHẬT] Lấy thêm 1 ảnh đại diện (nếu có) để hiển thị list
        const query = `
            SELECT st.*, 
            (SELECT file_path FROM service_attachments sa WHERE sa.service_type_id = st.id LIMIT 1) as thumbnail
            FROM service_types st 
            WHERE is_active = 1 
            ORDER BY category, name
        `;
        const [rows] = await db.execute(query);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM service_types WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        
        // Lấy thêm attachments
        const [attachments] = await db.execute('SELECT * FROM service_attachments WHERE service_type_id = ?', [id]);
        return { ...rows[0], attachments };
    },

    /**
     * [CẬP NHẬT] Tạo dịch vụ kèm ảnh (Transaction)
     */
    create: async (data, files) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { name, description, base_price, unit, is_active, category, location, open_hours, contact_phone } = data;
            const query = `
                INSERT INTO service_types (name, description, base_price, unit, is_active, category, location, open_hours, contact_phone)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await connection.execute(query, [
                name, description, base_price || 0, unit, is_active !== undefined ? is_active : 1,
                category || null, location || null, open_hours || null, contact_phone || null
            ]);
            
            const newId = result.insertId;

            // Lưu ảnh
            if (files && files.length > 0) {
                for (const file of files) {
                    await connection.execute(`
                        INSERT INTO service_attachments (service_type_id, file_name, file_path, file_size)
                        VALUES (?, ?, ?, ?)
                    `, [newId, file.originalname, `/uploads/services/${file.filename}`, file.size]);
                }
            }

            await connection.commit();
            return { id: newId, ...data };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    update: async (id, data) => {
        const { name, description, base_price, unit, is_active, category, location, open_hours, contact_phone } = data;
        const query = `
            UPDATE service_types 
            SET name = ?, description = ?, base_price = ?, unit = ?, is_active = ?,
                category = ?, location = ?, open_hours = ?, contact_phone = ?
            WHERE id = ?
        `;
        await db.execute(query, [
            name, description, base_price, unit, is_active,
            category || null, location || null, open_hours || null, contact_phone || null, id
        ]);
        return { id, ...data };
    },

    delete: async (id) => {
        await db.execute('DELETE FROM service_types WHERE id = ?', [id]);
    },

    // === BOOKING FUNCTIONS ===
    createBooking: async (data) => {
        const { resident_id, service_type_id, booking_date, quantity, total_amount, note } = data;
        const query = `
            INSERT INTO service_bookings (resident_id, service_type_id, booking_date, quantity, total_amount, note, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Chờ duyệt')
        `;
        const [result] = await db.execute(query, [
            resident_id, service_type_id, booking_date, quantity || 1, total_amount || 0, note || null
        ]);
        return { id: result.insertId, ...data, status: 'Chờ duyệt' };
    },

    getBookingsByResident: async (residentId) => {
        const query = `
            SELECT sb.*, st.name as service_name, st.category, st.location 
            FROM service_bookings sb
            JOIN service_types st ON sb.service_type_id = st.id
            WHERE sb.resident_id = ?
            ORDER BY sb.created_at DESC
        `;
        const [rows] = await db.execute(query, [residentId]);
        return rows;
    },

    getAllBookings: async () => {
        const query = `
            SELECT sb.*, st.name as service_name, st.category, 
                   r.full_name as resident_name, a.apartment_code
            FROM service_bookings sb
            JOIN service_types st ON sb.service_type_id = st.id
            JOIN residents r ON sb.resident_id = r.id
            JOIN apartments a ON r.apartment_id = a.id
            ORDER BY sb.created_at DESC
        `;
        const [rows] = await db.execute(query);
        return rows;
    },

    // [MỚI] Lấy chi tiết booking để gửi thông báo
    getBookingDetail: async (id) => {
        const query = `
            SELECT sb.*, st.name as service_name, r.id as resident_id, r.full_name, a.apartment_code 
            FROM service_bookings sb
            JOIN service_types st ON sb.service_type_id = st.id
            JOIN residents r ON sb.resident_id = r.id
            JOIN apartments a ON r.apartment_id = a.id
            WHERE sb.id = ?
        `;
        const [rows] = await db.execute(query, [id]);
        return rows[0];
    },

    updateBookingStatus: async (id, status) => {
        await db.execute('UPDATE service_bookings SET status = ? WHERE id = ?', [status, id]);
    }
};

module.exports = Service;