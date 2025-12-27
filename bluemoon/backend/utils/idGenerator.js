// File: backend/utils/idGenerator.js
const db = require('../config/db');

const idGenerator = {
    
    /**
     * 1. SINH ID TĂNG DẦN (Incremental)
     */
    generateIncrementalId: async (table, prefix, colName = 'id', length = 4) => {
        try {
            const query = `
                SELECT ${colName} FROM ${table} 
                WHERE ${colName} LIKE '${prefix}%' 
                ORDER BY LENGTH(${colName}) DESC, ${colName} DESC 
                LIMIT 1
            `;
            const [rows] = await db.execute(query);

            let nextNum = 1;
            if (rows.length > 0) {
                const currentId = rows[0][colName];
                const numPart = currentId.replace(prefix, '');
                if (!isNaN(numPart)) {
                    nextNum = parseInt(numPart) + 1;
                }
            }
            return `${prefix}${String(nextNum).padStart(length, '0')}`;
        } catch (error) {
            console.error(`Error generating ID for ${table}:`, error);
            return `${prefix}${Date.now()}`; 
        }
    },

    /**
     * 2. SINH ID THEO NGÀY (Date-based)
     */
    generateDateBasedId: async (table, prefix, colName = 'id') => {
        try {
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yyyy = now.getFullYear();
            const dateStr = `${dd}${mm}${yyyy}`; 
            const baseSearch = `${prefix}-${dateStr}-`; 

            const query = `
                SELECT ${colName} FROM ${table} 
                WHERE ${colName} LIKE '${baseSearch}%' 
                ORDER BY LENGTH(${colName}) DESC, ${colName} DESC 
                LIMIT 1
            `;
            const [rows] = await db.execute(query);

            let seq = 1;
            if (rows.length > 0) {
                const currentId = rows[0][colName];
                const seqPart = currentId.split('-').pop(); 
                if (!isNaN(seqPart)) {
                    seq = parseInt(seqPart) + 1;
                }
            }
            return `${baseSearch}${String(seq).padStart(4, '0')}`;
        } catch (error) {
            console.error(`Error generating Date ID for ${table}:`, error);
            return `${prefix}-${Date.now()}`;
        }
    },

    /**
     * 3. SINH ID HÓA ĐƠN THÔNG MINH (Smart Invoice ID)
     * Format gốc: {FeeCode}-{AptCode}-{MMYYYY}
     * Nếu trùng -> Thêm suffix: -1, -2, -10...
     * @returns {Promise<string>}
     */
    generateInvoiceId: async (feeCode, aptCode, billingPeriod) => {
        try {
            // 1. Chuẩn hóa format cơ sở
            const cleanPeriod = billingPeriod.replace(/[^0-9]/g, '');
            const formattedPeriod = cleanPeriod.length === 5 ? '0' + cleanPeriod : cleanPeriod;
            
            // Base ID: VD: PD-A101-012026
            const baseId = `${feeCode}-${aptCode}-${formattedPeriod}`;

            // 2. Tìm tất cả ID trong DB bắt đầu bằng Base ID
            // Query này sẽ tìm ra: PD-A101-012026, PD-A101-012026-1, PD-A101-012026-10...
            const query = `
                SELECT id FROM fees 
                WHERE id LIKE ?
                ORDER BY LENGTH(id) DESC, id DESC
            `;
            const [rows] = await db.execute(query, [`${baseId}%`]);

            // 3. Nếu chưa có cái nào -> Trả về Base ID
            if (rows.length === 0) {
                return baseId;
            }

            // 4. Nếu có trùng lặp -> Tìm hậu tố lớn nhất
            let maxSuffix = 0;
            let hasExactMatch = false;

            for (const row of rows) {
                const currentId = row.id;
                
                if (currentId === baseId) {
                    hasExactMatch = true;
                    continue;
                }

                // Tách hậu tố: PD-A101-012026-5 -> Lấy số 5
                const parts = currentId.split(baseId + '-');
                if (parts.length === 2 && !isNaN(parts[1])) {
                    const suffix = parseInt(parts[1]);
                    if (suffix > maxSuffix) {
                        maxSuffix = suffix;
                    }
                }
            }

            // Nếu không trùng khớp chính xác ID gốc (VD: chỉ tìm thấy PD-A101-012026-Khac) 
            // thì trả về Base ID. Còn nếu trùng baseId thì mới tăng suffix.
            if (!hasExactMatch && maxSuffix === 0) {
                return baseId;
            }

            // Trả về ID kèm suffix mới
            return `${baseId}-${maxSuffix + 1}`;

        } catch (error) {
            console.error('Error generating Invoice ID:', error);
            // Fallback cực đoan
            return `ERR-${Date.now()}`;
        }
    }
};

module.exports = idGenerator;