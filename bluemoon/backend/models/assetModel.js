// File: backend/models/assetModel.js

const db = require('../config/db');

const Asset = {

    /**
     * Lấy danh sách tài sản (Có hỗ trợ bộ lọc và tìm kiếm)
     * @param {Object} filters - { status, keyword }
     */
    getAll: async (filters = {}) => {
        try {
            let query = `
                SELECT 
                    a.*,
                    (
                        SELECT scheduled_date 
                        FROM maintenance_schedules ms 
                        WHERE ms.asset_id = a.id 
                        AND ms.status = 'Lên lịch' 
                        AND ms.scheduled_date >= CURDATE()
                        ORDER BY ms.scheduled_date ASC 
                        LIMIT 1
                    ) as next_maintenance_date
                FROM assets a
                WHERE 1=1
            `;
            const params = [];

            // 1. Lọc theo trạng thái (VD: Chỉ xem tài sản 'Hỏng')
            if (filters.status) {
                query += ` AND a.status = ?`;
                params.push(filters.status);
            }

            // 2. Tìm kiếm theo tên hoặc mã tài sản
            if (filters.keyword) {
                query += ` AND (a.name LIKE ? OR a.asset_code LIKE ?)`;
                params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
            }

            // Sắp xếp: Mới nhất lên đầu
            query += ` ORDER BY a.created_at DESC`;

            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Lấy chi tiết tài sản theo ID
     */
    findById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM assets WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        
        // Lấy lịch sử bảo trì
        const [maintenance_history] = await db.execute(`
            SELECT * FROM maintenance_schedules 
            WHERE asset_id = ? 
            ORDER BY scheduled_date DESC
        `, [id]);

        return { ...rows[0], maintenance_history };
    },

    /**
     * Kiểm tra mã tài sản có bị trùng không
     * Trả về true nếu đã tồn tại
     */
    checkDuplicateCode: async (assetCode) => {
        try {
            const query = `SELECT id FROM assets WHERE asset_code = ?`;
            const [rows] = await db.execute(query, [assetCode]);
            return rows.length > 0;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Thêm tài sản mới
     */
    create: async (data) => {
        const { asset_code, name, description, location, purchase_date, price, status, warranty_expiry_date, supplier_info } = data;
        
        // [FIX REQ 27] Default status là 'Đang hoạt động'
        const finalStatus = status || 'Đang hoạt động';

        const query = `
            INSERT INTO assets 
            (asset_code, name, description, location, purchase_date, price, status, warranty_expiry_date, supplier_info)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // [FIX] Sử dụng toán tử || null để đảm bảo không truyền undefined
        const [result] = await db.execute(query, [
            asset_code, 
            name, 
            description || null, 
            location || null, 
            purchase_date || null, 
            price || 0, 
            finalStatus, 
            warranty_expiry_date || null, 
            supplier_info || null
        ]);

        return { id: result.insertId, ...data, status: finalStatus };
    },

    /**
     * Cập nhật thông tin tài sản
     */
    update: async (id, data) => {
        // Chỉ update thông tin cơ bản, KHÔNG update lịch bảo trì ở đây (Tách riêng ra hàm maintenance)
        const fields = [];
        const params = [];

        // Helper function để add field
        const addField = (key, value) => {
            if (value !== undefined) {
                fields.push(`${key} = ?`);
                params.push(value);
            }
        };

        addField('name', data.name);
        addField('description', data.description);
        addField('location', data.location);
        addField('price', data.price);
        addField('status', data.status);
        addField('warranty_expiry_date', data.warranty_expiry_date);
        addField('supplier_info', data.supplier_info);

        if (fields.length === 0) return null;

        const query = `UPDATE assets SET ${fields.join(', ')} WHERE id = ?`;
        params.push(id);

        await db.execute(query, params);
        return { id, ...data };
    },

    delete: async (id) => {
        await db.execute('DELETE FROM assets WHERE id = ?', [id]);
    },

    // ==========================================
    // QUẢN LÝ BẢO TRÌ (REQ 31: SNAPSHOT)
    // ==========================================

    /**
     * Thêm lịch bảo trì mới (Lên lịch)
     */
    addMaintenanceSchedule: async (data) => {
        const { asset_id, title, description, scheduled_date, technician_name, is_recurring, recurring_interval } = data;
        const query = `
            INSERT INTO maintenance_schedules 
            (asset_id, title, description, scheduled_date, technician_name, status, is_recurring, recurring_interval)
            VALUES (?, ?, ?, ?, ?, 'Lên lịch', ?, ?)
        `;

        await db.execute(query, [
            asset_id, 
            title, 
            description || null, 
            scheduled_date, 
            technician_name || null, 
            is_recurring || 0, 
            recurring_interval || null
        ]);
    },

    /**
     * Hoàn thành bảo trì (Lưu snapshot & Tạo lịch mới nếu lặp lại)
     */
    completeMaintenance: async (scheduleId, data, connection = null) => {
        const dbConn = connection || db;
        const { completed_date, cost, note } = data; // note có thể nối vào description

        // 1. Update dòng hiện tại thành 'Hoàn thành'
        await dbConn.execute(`
            UPDATE maintenance_schedules 
            SET status = 'Hoàn thành', completed_date = ?, cost = ?, description = CONCAT(description, ' | Kết quả: ', ?)
            WHERE id = ?
        `, [completed_date, cost, note || '', scheduleId]);
    },

    getScheduleById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM maintenance_schedules WHERE id = ?', [id]);
        return rows[0];
    }
};

module.exports = Asset;