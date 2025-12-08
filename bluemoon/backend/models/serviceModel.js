// File: backend/models/serviceModel.js

const db = require('../config/db');

const Service = {
    getAll: async () => {
        const [rows] = await db.execute('SELECT * FROM service_types ORDER BY id DESC');
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM service_types WHERE id = ?', [id]);
        return rows[0];
    },

    create: async (data) => {
        const { name, description, base_price, unit, is_active, category, location, open_hours, contact_phone } = data;
        const query = `
            INSERT INTO service_types (name, description, base_price, unit, is_active, category, location, open_hours, contact_phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [
            name, description, base_price || 0, unit, is_active !== undefined ? is_active : 1,
            category || null, location || null, open_hours || null, contact_phone || null
        ]);
        return { id: result.insertId, ...data };
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
    }
};

module.exports = Service;
