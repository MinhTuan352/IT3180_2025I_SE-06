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

const cleanStr = (str) => str ? String(str).trim() : null;

// Helper: Lấy số thứ tự tiếp theo từ chuỗi ID (VD: "R0005" -> 5)
const parseSequence = (idStr, prefix) => {
    if (!idStr) return 0;
    const numPart = idStr.replace(prefix, '');
    return isNaN(numPart) ? 0 : parseInt(numPart);
};

// Helper: Format ID từ số (VD: 6 -> "R0006")
const formatId = (seq, prefix, length = 4) => {
    return `${prefix}${String(seq).padStart(length, '0')}`;
};

const importController = {

    // [GET] /api/import/template (Thực chất là Export Master Data)
    downloadTemplate: async (req, res) => {
        try {
            const wb = xlsx.utils.book_new();
            const connection = await db.getConnection();

            try {
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

    // [POST] /api/import/master-data
    importMasterData: async (req, res) => {
        if (!req.file) return res.status(400).json({ message: 'Vui lòng upload file Excel.' });

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const summary = { success: 0, errors: [] };
        const connection = await db.getConnection();

        try {
            // [BƯỚC 0] CHUẨN BỊ SEQUENCE ID (Lấy ID lớn nhất hiện tại làm mốc)
            // Lấy ID Admin tiếp theo (IDxxxx)
            const nextAdminIdStr = await idGenerator.generateIncrementalId('users', 'ID', 'id', 4);
            let adminSeq = parseSequence(nextAdminIdStr, 'ID');

            // Lấy ID Resident tiếp theo (Rxxxx)
            const nextResIdStr = await idGenerator.generateIncrementalId('residents', 'R', 'id', 4);
            let resSeq = parseSequence(nextResIdStr, 'R');

            // Lấy ID Asset tiếp theo (TSxxx)
            const nextAssetIdStr = await idGenerator.generateIncrementalId('assets', 'TS', 'asset_code', 3);
            let assetSeq = parseSequence(nextAssetIdStr, 'TS');

            // --- GIAI ĐOẠN 1: DỮ LIỆU NỀN (ADMINS & FEETYPES) ---
            
            // 1. Sheet Admins
            if (workbook.Sheets['Admins']) {
                const adminData = xlsx.utils.sheet_to_json(workbook.Sheets['Admins']);
                for (const [index, row] of adminData.entries()) {
                    try {
                        const username = cleanStr(row['Username']);
                        const email = cleanStr(row['Email']);
                        const roleCode = cleanStr(row['Vai trò']); // 'bod', 'accountance', 'cqcn'
                        
                        if (!username || !roleCode) continue;

                        // Tìm Role ID
                        const [roles] = await connection.execute('SELECT id FROM roles WHERE role_code = ?', [roleCode]);
                        if (roles.length === 0) throw new Error(`Role "${roleCode}" không tồn tại.`);
                        const roleId = roles[0].id;

                        // Upsert User
                        // Password mặc định là 12345678 nếu tạo mới
                        const defaultHash = await bcrypt.hash('12345678', 10);
                        
                        // Check exist
                        const [users] = await connection.execute('SELECT id FROM users WHERE username = ?', [username]);
                        let userId = users.length > 0 ? users[0].id : generateId('ID');

                        if (users.length === 0) {
                            // [LOGIC MỚI] Dùng biến đếm local adminSeq
                            // Thay vì gọi DB, ta tự tạo ID và tăng biến đếm
                            userId = formatId(adminSeq, 'ID', 4); // ID0001
                            adminSeq++; // Tăng lên cho người sau (ID0002)

                            await connection.execute(
                                `INSERT INTO users (id, username, password, email, phone, role_id) VALUES (?, ?, ?, ?, ?, ?)`,
                                [userId, username, defaultHash, email, cleanStr(row['SĐT']), roleId]
                            );
                        } else {
                            userId = users[0].id;
                            await connection.execute(
                                `UPDATE users SET email = ?, phone = ?, role_id = ? WHERE id = ?`,
                                [email, cleanStr(row['SĐT']), roleId, userId]
                            );
                        }

                        // Upsert Admin Profile
                        await connection.execute(`
                            INSERT INTO admins (id, user_id, full_name, cccd, phone, email)
                            VALUES (?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), phone = VALUES(phone), email = VALUES(email)
                        `, [userId, userId, cleanStr(row['Họ tên']), cleanStr(row['CCCD']), cleanStr(row['SĐT']), email]);

                    } catch (e) {
                        summary.errors.push(`Admin dòng ${index + 2}: ${e.message}`);
                    }
                }
            }

            // 2. Sheet FeeTypes
            if (workbook.Sheets['FeeTypes']) {
                const feeData = xlsx.utils.sheet_to_json(workbook.Sheets['FeeTypes']);
                for (const row of feeData) {
                    await connection.execute(`
                        INSERT INTO fee_types (fee_code, fee_name, default_price, unit)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE fee_name = VALUES(fee_name), default_price = VALUES(default_price), unit = VALUES(unit)
                    `, [cleanStr(row['Mã phí']), cleanStr(row['Tên phí']), row['Đơn giá'], cleanStr(row['Đơn vị'])]);
                }
            }

            // --- GIAI ĐOẠN 2: DỮ LIỆU CƯ DÂN (RESIDENTS) ---
            
            // Load Map
            const [aptRows] = await connection.execute('SELECT id, apartment_code, status FROM apartments');
            const apartmentMap = new Map(); 
            aptRows.forEach(a => apartmentMap.set(a.apartment_code, { id: a.id, status: a.status }));

            const [resRows] = await connection.execute('SELECT id, cccd, user_id FROM residents');
            const residentMap = new Map(); 
            resRows.forEach(r => residentMap.set(r.cccd, r));

            if (workbook.Sheets['Residents']) {
                const rawData = xlsx.utils.sheet_to_json(workbook.Sheets['Residents']);
                const apartmentGroups = {};
                
                rawData.forEach((row, index) => {
                    const aptCode = cleanStr(row['Mã căn hộ']);
                    if (aptCode) {
                        if (!apartmentGroups[aptCode]) apartmentGroups[aptCode] = [];
                        apartmentGroups[aptCode].push({ ...row, rowIndex: index + 2 });
                    }
                });

                for (const aptCode in apartmentGroups) {
                    const residentsInExcel = apartmentGroups[aptCode];
                    const aptInfo = apartmentMap.get(aptCode);

                    if (!aptInfo) {
                        summary.errors.push(`Căn ${aptCode}: Mã căn hộ không tồn tại.`);
                        continue;
                    }

                    await connection.beginTransaction();

                    try {
                        const excelOwners = residentsInExcel.filter(r => cleanStr(r['Vai trò']) === 'Chủ hộ');
                        if (excelOwners.length > 1) throw new Error(`Có ${excelOwners.length} chủ hộ.`);

                        let hasActiveResident = false;

                        for (const row of residentsInExcel) {
                            const fullName = cleanStr(row['Họ và tên']);
                            const cccd = cleanStr(row['CCCD']);
                            const role = cleanStr(row['Vai trò']) === 'Chủ hộ' ? 'owner' : 'member';
                            const status = cleanStr(row['Trạng thái']) || 'Đang sinh sống';
                            
                            if (status === 'Đang sinh sống') hasActiveResident = true;

                            let userId = null;
                            const existingRes = residentMap.get(cccd);

                            // Xác định ID Cư dân: Nếu có rồi thì dùng cũ, chưa có thì sinh mới Rxxxx
                            let residentId = existingRes ? existingRes.id : null;
                            if (!residentId) {
                                // [LOGIC MỚI] Dùng biến đếm local resSeq
                                // Không gọi DB nữa, tự cộng dồn
                                residentId = formatId(resSeq, 'R', 4); // R0005
                                resSeq++; // R0006
                            }

                            if (existingRes) userId = existingRes.user_id;

                            // Logic User
                            if (role === 'owner') {
                                const username = cleanStr(row['Username']);
                                const password = cleanStr(row['Password']);

                                if (username && password) {
                                    const hash = await bcrypt.hash(password, 10);
                                    if (userId) {
                                        await connection.execute(`UPDATE users SET username=?, password=?, is_active=1 WHERE id=?`, [username, hash, userId]);
                                    } else {
                                        // Chưa có user -> Tạo mới với ID = ResidentID
                                        userId = residentId; // Đồng bộ ID

                                        // Kiểm tra xem ID này đã tồn tại trong users chưa (đề phòng)
                                        const [uCheck] = await connection.execute('SELECT id FROM users WHERE id = ?', [userId]);
                                        if (uCheck.length === 0) {
                                            await connection.execute(
                                                `INSERT INTO users (id, username, password, email, phone, role_id) VALUES (?, ?, ?, ?, ?, 3)`, 
                                                [userId, username, hash, cleanStr(row['Email']), cleanStr(row['SĐT'])]
                                            );
                                        } else {
                                            // Nếu ID đã tồn tại trong users (hiếm), update lại role thành resident
                                            await connection.execute(`UPDATE users SET username=?, password=?, role_id=3, is_active=1 WHERE id=?`, [username, hash, userId]);
                                        }
                                    }
                                }
                            } else if (userId) {
                                await connection.execute(`UPDATE users SET is_active=0 WHERE id=?`, [userId]);
                                userId = null;
                            }

                            // Upsert Resident
                            if (existingRes) {
                                await connection.execute(`
                                    UPDATE residents SET full_name=?, apartment_id=?, role=?, phone=?, email=?, status=?, user_id=? WHERE cccd=?
                                `, [fullName, aptInfo.id, role, cleanStr(row['SĐT']), cleanStr(row['Email']), status, userId, cccd]);
                                
                                if (row['Ngày biến động']) {
                                    const eventDate = parseExcelDate(row['Ngày biến động']);
                                    const eventType = status === 'Đang sinh sống' ? 'Chuyển đến' : 'Chuyển đi';
                                    await connection.execute(`INSERT INTO residence_history (resident_id, apartment_id, event_type, event_date) VALUES (?, ?, ?, ?)`, 
                                        [existingRes.id, aptInfo.id, eventType, eventDate]);
                                }
                            } else {
                                // Insert mới với ID đã sinh (Rxxxx)
                                await connection.execute(`
                                    INSERT INTO residents (id, user_id, apartment_id, full_name, role, cccd, phone, email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `, [residentId, userId, aptInfo.id, fullName, role, cccd, cleanStr(row['SĐT']), cleanStr(row['Email']), status]);
                                
                                // Cập nhật Map để dùng cho dòng sau nếu lặp lại (dù excel không nên lặp)
                                residentMap.set(cccd, { id: residentId, apartment_id: aptInfo.id, user_id: userId });
                            }
                        }

                        // Auto-correct old owners
                        if (excelOwners.length > 0) {
                            const newOwnerCCCD = cleanStr(excelOwners[0]['CCCD']);
                            await connection.execute(`UPDATE residents SET role='member', user_id=NULL WHERE apartment_id=? AND role='owner' AND cccd!=?`, [aptInfo.id, newOwnerCCCD]);
                        }

                        // Update Apartment Status
                        if (aptInfo.status !== 'Đang sửa chữa') {
                            const newStatus = hasActiveResident ? 'Đang sinh sống' : 'Trống';
                            await connection.execute(`UPDATE apartments SET status = ? WHERE id = ?`, [newStatus, aptInfo.id]);
                        }

                        await connection.commit();
                        summary.success += residentsInExcel.length;

                    } catch (err) {
                        await connection.rollback();
                        summary.errors.push(`Căn ${aptCode}: ${err.message}`);
                    }
                }
            }

            // --- GIAI ĐOẠN 3: XE & TÀI SẢN ---

            if (workbook.Sheets['Vehicles']) {
                const vData = xlsx.utils.sheet_to_json(workbook.Sheets['Vehicles']);
                for (const row of vData) {
                    try {
                        const owner = residentMap.get(cleanStr(row['CCCD Chủ xe']));
                        if (!owner) throw new Error('Không tìm thấy chủ xe');
                        
                        await connection.execute(`
                            INSERT INTO vehicles (resident_id, apartment_id, vehicle_type, license_plate, brand, model, status)
                            VALUES (?, ?, ?, ?, ?, ?, 'Đang sử dụng')
                            ON DUPLICATE KEY UPDATE resident_id=VALUES(resident_id)
                        `, [owner.id, owner.apartment_id, cleanStr(row['Loại xe']), cleanStr(row['Biển số']), cleanStr(row['Hãng']), cleanStr(row['Dòng xe'])]);
                    } catch (e) {
                        summary.errors.push(`Xe ${row['Biển số']}: ${e.message}`);
                    }
                }
            }

            if (workbook.Sheets['Assets']) {
                const aData = xlsx.utils.sheet_to_json(workbook.Sheets['Assets']);
                for (const row of aData) {
                    try {
                        // [MỚI] Tự động sinh mã TSxxx nếu Excel bỏ trống cột Mã tài sản
                        let assetCode = cleanStr(row['Mã tài sản']);
                        if (!assetCode) {
                            // [LOGIC MỚI] Dùng biến đếm local assetSeq
                            assetCode = formatId(assetSeq, 'TS', 3); // TS001
                            assetSeq++;
                        }

                        await connection.execute(`
                            INSERT INTO assets (asset_code, name, location, price, purchase_date, status)
                            VALUES (?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status)
                        `, [cleanStr(row['Mã tài sản']), cleanStr(row['Tên tài sản']), cleanStr(row['Vị trí']), row['Giá'], parseExcelDate(row['Ngày mua']), cleanStr(row['Trạng thái'])]);
                    } catch (e) {
                        summary.errors.push(`TS ${row['Mã tài sản']}: ${e.message}`);
                    }
                }
            }

            res.json({ success: true, message: 'Xử lý xong.', summary });

        } catch (error) {
            if (connection) await connection.rollback();
            console.error(error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        } finally {
            if (connection) connection.release();
        }
    }
};

module.exports = importController;