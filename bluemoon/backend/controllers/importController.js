// File: backend/controllers/importController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const idGenerator = require('../utils/idGenerator');

// --- HELPER FUNCTIONS ---

const parseExcelDate = (excelDate) => {
    if (!excelDate) return null;
    let date;
    if (typeof excelDate === 'number') {
        date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    } else {
        date = new Date(excelDate);
    }
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
};

// Hàm check dòng trống (Để dừng vòng lặp)
const isRowEmpty = (row) => {
    // Coi là trống nếu không có các key quan trọng
    const keys = Object.keys(row);
    if (keys.length === 0) return true;
    // Hoặc tất cả giá trị đều null/empty
    return keys.every(key => !row[key] || String(row[key]).trim() === '');
};

const cleanStr = (str) => str ? String(str).trim() : null;

// Hàm định dạng ngày ra Excel (YYYY-MM-DD)
const formatDateForExcel = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
};

const importController = {

    // [GET] /api/import/export-master-data/?sheet=SheetName
    exportMasterDataBySheet: async (req, res) => {
        try {
            const { sheet } = req.query; // Nếu có sheet thì chỉ xuất sheet đó
            const wb = xlsx.utils.book_new();
            const connection = await db.getConnection();

            try {
                if (sheet) {
                    if (sheet === 'Admins') {
                        // 1. Sheet Admins (Users + Admins)
                        const [admins] = await connection.execute(`
                            SELECT u.username, u.email, u.phone, a.full_name, a.cccd, r.role_code
                            FROM users u
                            JOIN roles r ON u.role_id = r.id
                            LEFT JOIN admins a ON u.id = a.user_id
                            WHERE r.role_code IN ('bod', 'accountance', 'cqcn')
                        `);
                        const adminData = admins.map(a => ({
                            "Username": a.username,
                            "Email": a.email,
                            "Họ tên": a.full_name,
                            "SĐT": a.phone,
                            "CCCD": a.cccd,
                            "Vai trò": a.role_code // bod, accountance
                        }));
                        xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(adminData), "Admins");
                    }
                    
                    else if (sheet === 'FeeTypes') {
                        // 2. Sheet FeeTypes
                        const [fees] = await connection.execute('SELECT * FROM fee_types');
                        const feeData = fees.map(f => ({
                            "Mã phí": f.fee_code,
                            "Tên phí": f.fee_name,
                            "Đơn giá": f.default_price,
                            "Đơn vị": f.unit
                        }));
                        xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(feeData), "FeeTypes");
                    }
                    
                    else if (sheet === 'Residents') {
                        // 3. Sheet Residents
                        const [residents] = await connection.execute(`
                            SELECT r.*, a.apartment_code, u.username 
                            FROM residents r
                            LEFT JOIN apartments a ON r.apartment_id = a.id
                            LEFT JOIN users u ON r.user_id = u.id
                        `);
                        const resData = residents.map(r => ({
                            "Mã căn hộ": r.apartment_code,
                            "Họ và tên": r.full_name,
                            "CCCD": r.cccd,
                            "Vai trò": r.role === 'owner' ? 'Chủ hộ' : 'Thành viên',
                            "SĐT": r.phone,
                            "Email": r.email,
                            "Username": r.username, // Để user biết ai đã có tk
                            "Password": "", // Không export pass, để trống
                            "Trạng thái": r.status,
                            "Ngày biến động": "" // Để trống cho user điền nếu muốn ghi lịch sử
                        }));
                        xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(resData), "Residents");
                    }
                    
                    else if (sheet === 'Vehicles') {
                        // 4. Sheet Vehicles
                        const [vehicles] = await connection.execute(`
                            SELECT v.*, r.cccd as owner_cccd, a.apartment_code
                            FROM vehicles v
                            LEFT JOIN residents r ON v.resident_id = r.id
                            LEFT JOIN apartments a ON v.apartment_id = a.id
                        `);
                        const vehData = vehicles.map(v => ({
                            "Biển số": v.license_plate,
                            "Loại xe": v.vehicle_type,
                            "CCCD Chủ xe": v.owner_cccd,
                            "Hãng": v.brand,
                            "Dòng xe": v.model,
                            "Trạng thái": v.status
                        }));
                        xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(vehData), "Vehicles");
                    } else if (sheet === 'Assets') {

                        // 5. Sheet Assets
                        const [assets] = await connection.execute('SELECT * FROM assets');
                        const assetData = assets.map(a => ({
                            "Mã tài sản": a.asset_code,
                            "Tên tài sản": a.name,
                            "Vị trí": a.location,
                            "Giá": a.price,
                            "Ngày mua": formatDateForExcel(a.purchase_date),
                            "Trạng thái": a.status
                        }));
                        xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(assetData), "Assets");
                    }
                }

            } finally {
                connection.release();
            }

            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Disposition', 'attachment; filename="BlueMoon_Full_Data.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);

        } catch (error) {
            console.error('Export Error:', error);
            res.status(500).json({ message: 'Lỗi xuất dữ liệu.' });
        }
    },

    // [GET] /api/import/export-master-data
    exportMasterData: async (req, res) => {
        try {
            const wb = xlsx.utils.book_new();
            const connection = await db.getConnection();
            try {
                // Xuất tất cả các sheet
                    // 1. Sheet Admins (Users + Admins)
                    const [admins] = await connection.execute(`
                        SELECT u.username, u.email, u.phone, a.full_name, a.cccd, r.role_code
                        FROM users u
                        JOIN roles r ON u.role_id = r.id
                        LEFT JOIN admins a ON u.id = a.user_id
                        WHERE r.role_code IN ('bod', 'accountance', 'cqcn')
                    `);
                    const adminData = admins.map(a => ({
                        "Username": a.username,
                        "Email": a.email,
                        "Họ tên": a.full_name,
                        "SĐT": a.phone,
                        "CCCD": a.cccd,
                        "Vai trò": a.role_code // bod, accountance
                    }));
                    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(adminData), "Admins");

                    // 2. Sheet FeeTypes
                    const [fees] = await connection.execute('SELECT * FROM fee_types');
                    const feeData = fees.map(f => ({
                        "Mã phí": f.fee_code,
                        "Tên phí": f.fee_name,
                        "Đơn giá": f.default_price,
                        "Đơn vị": f.unit
                    }));
                    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(feeData), "FeeTypes");

                    // 3. Sheet Residents
                    const [residents] = await connection.execute(`
                        SELECT r.*, a.apartment_code, u.username 
                        FROM residents r
                        LEFT JOIN apartments a ON r.apartment_id = a.id
                        LEFT JOIN users u ON r.user_id = u.id
                    `);
                    const resData = residents.map(r => ({
                        "Mã căn hộ": r.apartment_code,
                        "Họ và tên": r.full_name,
                        "CCCD": r.cccd,
                        "Vai trò": r.role === 'owner' ? 'Chủ hộ' : 'Thành viên',
                        "SĐT": r.phone,
                        "Email": r.email,
                        "Username": r.username, // Để user biết ai đã có tk
                        "Password": "", // Không export pass, để trống
                        "Trạng thái": r.status,
                        "Ngày biến động": "" // Để trống cho user điền nếu muốn ghi lịch sử
                    }));
                    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(resData), "Residents");

                    // 4. Sheet Vehicles
                    const [vehicles] = await connection.execute(`
                        SELECT v.*, r.cccd as owner_cccd, a.apartment_code
                        FROM vehicles v
                        LEFT JOIN residents r ON v.resident_id = r.id
                        LEFT JOIN apartments a ON v.apartment_id = a.id
                    `);
                    const vehData = vehicles.map(v => ({
                        "Biển số": v.license_plate,
                        "Loại xe": v.vehicle_type,
                        "CCCD Chủ xe": v.owner_cccd,
                        "Hãng": v.brand,
                        "Dòng xe": v.model,
                        "Trạng thái": v.status
                    }));
                    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(vehData), "Vehicles");

                    // 5. Sheet Assets
                    const [assets] = await connection.execute('SELECT * FROM assets');
                    const assetData = assets.map(a => ({
                        "Mã tài sản": a.asset_code,
                        "Tên tài sản": a.name,
                        "Vị trí": a.location,
                        "Giá": a.price,
                        "Ngày mua": formatDateForExcel(a.purchase_date),
                        "Trạng thái": a.status
                    }));
                    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(assetData), "Assets");
                }
                
            finally {
                connection.release();
            }

            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Disposition', 'attachment; filename="BlueMoon_Full_Data.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);

        } catch (error) {
            console.error('Export Error:', error);
            res.status(500).json({ message: 'Lỗi xuất dữ liệu.' });
        }
    },

    // [POST] /api/import/master-data
    importMasterData: async (req, res) => {
        if (!req.file) return res.status(400).json({ message: 'Vui lòng upload file Excel.' });

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const summary = { success: 0, errors: [] };
        const connection = await db.getConnection();

        try {
            // Chuẩn bị ID Sequence (Lấy 1 lần để tối ưu)
            const nextAdminIdStr = await idGenerator.generateIncrementalId('users', 'ID', 'id', 4);
            let adminSeq = parseInt(nextAdminIdStr.replace('ID', ''));

            const nextResIdStr = await idGenerator.generateIncrementalId('residents', 'R', 'id', 4);
            let resSeq = parseInt(nextResIdStr.replace('R', ''));

            const nextAssetIdStr = await idGenerator.generateIncrementalId('assets', 'TS', 'asset_code', 3);
            let assetSeq = parseInt(nextAssetIdStr.replace('TS', ''));

            const formatId = (seq, prefix, len) => `${prefix}${String(seq).padStart(len, '0')}`;

            // --- GIAI ĐOẠN 1: ADMINS & FEES ---
            
            // 1. Admins
            if (workbook.Sheets['Admins']) {
                const adminData = xlsx.utils.sheet_to_json(workbook.Sheets['Admins']);
                for (const [index, row] of adminData.entries()) {
                    if (isRowEmpty(row)) break; // Dừng nếu gặp dòng trống
                    try {
                        const username = cleanStr(row['Username']);
                        const roleCode = cleanStr(row['Vai trò']);
                        
                        if (!username) throw new Error('Thiếu Username');

                        // Check Role
                        const [roles] = await connection.execute('SELECT id FROM roles WHERE role_code = ?', [roleCode]);
                        if (roles.length === 0) throw new Error(`Role "${roleCode}" không hợp lệ`);
                        
                        // Check User
                        const [users] = await connection.execute('SELECT id FROM users WHERE username = ?', [username]);
                        let userId = users.length > 0 ? users[0].id : null;

                        if (!userId) {
                            userId = formatId(adminSeq++, 'ID', 4);
                            const hash = await bcrypt.hash('123456', 10);
                            await connection.execute(
                                `INSERT INTO users (id, username, password, email, phone, role_id) VALUES (?, ?, ?, ?, ?, ?)`,
                                [userId, username, hash, cleanStr(row['Email']), cleanStr(row['SĐT']), roles[0].id]
                            );
                        } else {
                            await connection.execute(
                                `UPDATE users SET email=?, phone=?, role_id=? WHERE id=?`,
                                [cleanStr(row['Email']), cleanStr(row['SĐT']), roles[0].id, userId]
                            );
                        }

                        // Upsert Admin Info
                        await connection.execute(`
                            INSERT INTO admins (id, user_id, full_name, cccd, phone, email)
                            VALUES (?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), phone=VALUES(phone)
                        `, [userId, userId, cleanStr(row['Họ tên']), cleanStr(row['CCCD']), cleanStr(row['SĐT']), cleanStr(row['Email'])]);

                    } catch (e) {
                        summary.errors.push(`Admin dòng ${index + 2}: ${e.message}`);
                    }
                }
            }

            // 2. FeeTypes
            if (workbook.Sheets['FeeTypes']) {
                const feeData = xlsx.utils.sheet_to_json(workbook.Sheets['FeeTypes']);
                for (const [index, row] of feeData.entries()) {
                    if (isRowEmpty(row)) break;
                    try {
                        const feeCode = cleanStr(row['Mã phí']);
                        if (!feeCode) throw new Error('Thiếu Mã phí');
                        
                        await connection.execute(`
                            INSERT INTO fee_types (fee_code, fee_name, default_price, unit)
                            VALUES (?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE fee_name=VALUES(fee_name), default_price=VALUES(default_price), unit=VALUES(unit)
                        `, [feeCode, cleanStr(row['Tên phí']), row['Đơn giá'], cleanStr(row['Đơn vị'])]);
                    } catch (e) {
                        summary.errors.push(`FeeType dòng ${index + 2}: ${e.message}`);
                    }
                }
            }

            // --- GIAI ĐOẠN 2: CƯ DÂN (RESIDENTS) ---
            
            // Load Maps để tra cứu nhanh
            const [aptRows] = await connection.execute('SELECT id, apartment_code, status FROM apartments');
            const apartmentMap = new Map();
            aptRows.forEach(a => apartmentMap.set(a.apartment_code, { id: a.id, status: a.status }));

            const [resRows] = await connection.execute('SELECT id, cccd, user_id FROM residents');
            const residentMap = new Map();
            resRows.forEach(r => residentMap.set(r.cccd, r));

            if (workbook.Sheets['Residents']) {
                const rawData = xlsx.utils.sheet_to_json(workbook.Sheets['Residents']);
                
                // Group theo căn hộ
                const apartmentGroups = {};
                for (const [index, row] of rawData.entries()) {
                    if (isRowEmpty(row)) break; // Dừng nếu hết data
                    
                    const aptCode = cleanStr(row['Mã căn hộ']);
                    if (!aptCode) {
                        summary.errors.push(`Resident dòng ${index + 2}: Thiếu mã căn hộ`);
                        continue;
                    }
                    if (!apartmentGroups[aptCode]) apartmentGroups[aptCode] = [];
                    apartmentGroups[aptCode].push({ ...row, rowIndex: index + 2 });
                }

                // Xử lý từng căn hộ
                for (const aptCode in apartmentGroups) {
                    const residents = apartmentGroups[aptCode];
                    const aptInfo = apartmentMap.get(aptCode);

                    if (!aptInfo) {
                        summary.errors.push(`Căn ${aptCode}: Mã không tồn tại.`);
                        continue;
                    }

                    await connection.beginTransaction(); // Transaction cho 1 căn hộ

                    try {
                        const owners = residents.filter(r => cleanStr(r['Vai trò']) === 'Chủ hộ');
                        if (owners.length > 1) throw new Error('Có nhiều hơn 1 chủ hộ.');

                        let activeCount = 0;

                        for (const row of residents) {
                            const cccd = cleanStr(row['CCCD']);
                            const fullName = cleanStr(row['Họ và tên']);
                            const role = cleanStr(row['Vai trò']) === 'Chủ hộ' ? 'owner' : 'member';
                            const status = cleanStr(row['Trạng thái']) || 'Đang sinh sống';
                            
                            if (!cccd || !fullName) throw new Error(`Dòng ${row.rowIndex}: Thiếu Tên hoặc CCCD`);
                            if (status === 'Đang sinh sống') activeCount++;

                            // Xử lý User (nếu cần)
                            let userId = null;
                            const existingRes = residentMap.get(cccd);
                            let residentId = existingRes ? existingRes.id : null;

                            // Nếu chưa có ID -> Sinh mới (dùng memory seq)
                            if (!residentId) {
                                residentId = formatId(resSeq++, 'R', 4);
                            }
                            if (existingRes) userId = existingRes.user_id;

                            // Logic User Account (Chỉ Owner có quyền)
                            if (role === 'owner') {
                                const username = cleanStr(row['Username']);
                                const password = cleanStr(row['Password']); // Có thể trống nếu ko đổi
                                
                                if (username) {
                                    // Upsert User
                                    const userExists = userId ? true : false;
                                    const tempId = userId || residentId; // Dùng ID Resident làm ID User luôn

                                    // Nếu user chưa tồn tại trong bảng users (dù resident có user_id null)
                                    // Check kỹ hơn trong DB users
                                    const [uCheck] = await connection.execute('SELECT id FROM users WHERE id = ?', [tempId]);
                                    
                                    if (uCheck.length === 0) {
                                        const hash = await bcrypt.hash(password || '123456', 10);
                                        await connection.execute(
                                            `INSERT INTO users (id, username, password, email, phone, role_id) VALUES (?, ?, ?, ?, ?, 3)`,
                                            [tempId, username, hash, cleanStr(row['Email']), cleanStr(row['SĐT'])]
                                        );
                                        userId = tempId;
                                    } else {
                                        let updateQuery = `UPDATE users SET username=?, is_active=1 WHERE id=?`;
                                        let params = [username, tempId];
                                        if (password) {
                                            const hash = await bcrypt.hash(password, 10);
                                            updateQuery = `UPDATE users SET username=?, password=?, is_active=1 WHERE id=?`;
                                            params = [username, hash, tempId];
                                        }
                                        await connection.execute(updateQuery, params);
                                        userId = tempId;
                                    }
                                }
                            } else {
                                // Member -> Disable user nếu có
                                if (userId) {
                                    await connection.execute('UPDATE users SET is_active=0 WHERE id=?', [userId]);
                                    userId = null;
                                }
                            }

                            // Upsert Resident
                            if (existingRes) {
                                await connection.execute(`
                                    UPDATE residents 
                                    SET full_name=?, apartment_id=?, role=?, phone=?, email=?, status=?, user_id=? 
                                    WHERE cccd=?
                                `, [fullName, aptInfo.id, role, cleanStr(row['SĐT']), cleanStr(row['Email']), status, userId, cccd]);
                                
                                // Ghi history nếu có ngày biến động
                                if (row['Ngày biến động']) {
                                    const eventDate = parseExcelDate(row['Ngày biến động']);
                                    const eventType = status === 'Đang sinh sống' ? 'Chuyển đến' : 'Chuyển đi';
                                    await connection.execute(`INSERT INTO residence_history (resident_id, apartment_id, event_type, event_date) VALUES (?, ?, ?, ?)`, 
                                        [existingRes.id, aptInfo.id, eventType, eventDate]);
                                }
                            } else {
                                await connection.execute(`
                                    INSERT INTO residents (id, user_id, apartment_id, full_name, role, cccd, phone, email, status) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `, [residentId, userId, aptInfo.id, fullName, role, cccd, cleanStr(row['SĐT']), cleanStr(row['Email']), status]);
                                
                                // Update Map để dùng cho xe cộ
                                residentMap.set(cccd, { id: residentId, apartment_id: aptInfo.id });
                            }
                        }

                        // Auto-correct Owners
                        if (owners.length > 0) {
                            const newOwnerCCCD = cleanStr(owners[0]['CCCD']);
                            await connection.execute(`UPDATE residents SET role='member', user_id=NULL WHERE apartment_id=? AND role='owner' AND cccd!=?`, [aptInfo.id, newOwnerCCCD]);
                        }

                        // Update Status Căn hộ
                        if (aptInfo.status !== 'Đang sửa chữa') {
                            const newStatus = activeCount > 0 ? 'Đang sinh sống' : 'Trống';
                            await connection.execute('UPDATE apartments SET status=? WHERE id=?', [newStatus, aptInfo.id]);
                        }

                        await connection.commit();
                        summary.success += residents.length;

                    } catch (err) {
                        await connection.rollback();
                        summary.errors.push(`Căn ${aptCode}: ${err.message}`);
                    }
                }
            }

            // --- GIAI ĐOẠN 3: XE & TÀI SẢN ---

            if (workbook.Sheets['Vehicles']) {
                const vData = xlsx.utils.sheet_to_json(workbook.Sheets['Vehicles']);
                for (const [index, row] of vData.entries()) {
                    if (isRowEmpty(row)) break;
                    try {
                        const plate = cleanStr(row['Biển số']);
                        const ownerCCCD = cleanStr(row['CCCD Chủ xe']);
                        if (!plate || !ownerCCCD) continue;

                        const owner = residentMap.get(ownerCCCD);
                        if (!owner) throw new Error(`Không tìm thấy chủ xe (CCCD: ${ownerCCCD})`);

                        await connection.execute(`
                            INSERT INTO vehicles (resident_id, apartment_id, vehicle_type, license_plate, brand, model, status)
                            VALUES (?, ?, ?, ?, ?, ?, 'Đang sử dụng')
                            ON DUPLICATE KEY UPDATE resident_id=VALUES(resident_id), apartment_id=VALUES(apartment_id)
                        `, [owner.id, owner.apartment_id, cleanStr(row['Loại xe']), plate, cleanStr(row['Hãng']), cleanStr(row['Dòng xe'])]);

                    } catch (e) {
                        summary.errors.push(`Xe dòng ${index + 2}: ${e.message}`);
                    }
                }
            }

            if (workbook.Sheets['Assets']) {
                const aData = xlsx.utils.sheet_to_json(workbook.Sheets['Assets']);
                for (const [index, row] of aData.entries()) {
                    if (isRowEmpty(row)) break;
                    try {
                        let code = cleanStr(row['Mã tài sản']);
                        if (!code) {
                            code = formatId(assetSeq++, 'TS', 3);
                        }
                        
                        await connection.execute(`
                            INSERT INTO assets (asset_code, name, location, price, purchase_date, status)
                            VALUES (?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), status=VALUES(status)
                        `, [code, cleanStr(row['Tên tài sản']), cleanStr(row['Vị trí']), row['Giá'], parseExcelDate(row['Ngày mua']), cleanStr(row['Trạng thái'])]);

                    } catch (e) {
                        summary.errors.push(`TS dòng ${index + 2}: ${e.message}`);
                    }
                }
            }

            res.json({ success: true, message: 'Xử lý hoàn tất.', summary });

        } catch (error) {
            if (connection) await connection.rollback();
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        } finally {
            if (connection) connection.release();
        }
    }
};

module.exports = importController;