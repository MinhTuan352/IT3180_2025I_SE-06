// File: backend/controllers/residentController.js

const Resident = require('../models/residentModel');
const db = require('../config/db');
const idGenerator = require('../utils/idGenerator');
const bcrypt = require('bcryptjs');
const AuditLog = require('../models/auditModel');

const residentController = {

    // --- CÁ NHÂN (PROFILE) ---
    getMyProfile: async (req, res) => {
        try {
            const resident = await Resident.findByUserId(req.user.id);
            if (!resident) return res.status(404).json({ success: false, message: 'Chưa có hồ sơ cư dân.' });
            res.json({ success: true, data: resident });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },

    updateMyProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const oldData = await Resident.findByUserId(userId);
            
            // Chỉ cho phép update các thông tin liên lạc, không cho đổi vai trò/căn hộ
            const { phone, email, hometown, occupation } = req.body;
            await Resident.updateMyProfile(userId, { phone, email, hometown, occupation });

            AuditLog.create({
                user_id: userId,
                action_type: 'UPDATE',
                entity_name: 'residents',
                entity_id: oldData.id,
                old_values: oldData,
                new_values: req.body,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.json({ success: true, message: 'Cập nhật thành công!' });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },

    getMyApartment: async (req, res) => {
        try {
            const resident = await Resident.findByUserId(req.user.id);
            if (!resident) return res.status(404).json({ success: false, message: 'Chưa có hồ sơ.' });
            const data = await Resident.getApartmentWithMembers(resident.apartment_id);
            res.json({ success: true, data });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },

    // --- QUẢN LÝ (ADMIN/CQCN) ---
    getAllResidents: async (req, res) => {
        try {
            const residents = await Resident.getAll(req.query);
            res.json({ success: true, count: residents.length, data: residents });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },

    getResidentDetail: async (req, res) => {
        try {
            const resident = await Resident.findById(req.params.id);
            if (!resident) return res.status(404).json({ message: 'Không tìm thấy.' });
            
            const history = await Resident.getHistory(req.params.id);
            res.json({ success: true, data: { ...resident, history } });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },

    /**
     * [CREATE] Thêm cư dân
     * - Check Single Owner
     * - Update Apartment Status -> 'Đang sinh sống'
     */
    createResident: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { 
                apartment_id, role, full_name, 
                dob, gender, cccd, phone, email, 
                hometown, occupation, relationship_with_owner, 
                identity_date, identity_place,
                username, password 
            } = req.body;

            // [CHECK 1] Single Owner Rule
            if (role === 'owner') {
                const [owners] = await connection.execute(
                    `SELECT id FROM residents WHERE apartment_id = ? AND role = 'owner' AND status = 'Đang sinh sống'`,
                    [apartment_id]
                );
                if (owners.length > 0) {
                    throw new Error('Căn hộ này đã có Chủ hộ. Vui lòng chuyển vai trò chủ hộ cũ thành thành viên trước.');
                }
            }

            const newId = await idGenerator.generateIncrementalId('residents', 'R', 'id', 4, connection);
            let userId = null;

            // [LOGIC USER] Tạo user nếu là Owner
            if (role === 'owner') {
                if (username && password) {
                    const [existing] = await connection.execute(
                        `SELECT id FROM users WHERE username = ? OR email = ?`, 
                        [username, email]
                    );
                    if (existing.length > 0) throw new Error('Username hoặc Email đã được sử dụng.');

                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(password, salt);

                    // User ID trùng Resident ID
                    await connection.execute(
                        `INSERT INTO users (id, username, password, email, phone, role_id, is_active) 
                         VALUES (?, ?, ?, ?, ?, 3, 1)`,
                        [newId, username, hashedPassword, email, phone]
                    );
                    userId = newId; 
                }
            }

            // Tạo Resident
            await Resident.create({
                id: newId,
                user_id: userId,
                apartment_id,
                full_name,
                role,
                dob, gender, cccd, phone, email,
                hometown, occupation, 
                relationship_with_owner, 
                identity_date, identity_place,
                status: 'Đang sinh sống'
            }, connection);

            // Ghi history
            await Resident.addHistory({
                resident_id: newId,
                apartment_id: apartment_id,
                event_type: 'Chuyển đến',
                event_date: new Date(),
                note: 'Đăng ký mới vào hệ thống'
            }, connection);

            // [CHECK 2] Apartment Status -> 'Đang sinh sống'
            await connection.execute(
                `UPDATE apartments SET status = 'Đang sinh sống' WHERE id = ? AND status = 'Trống'`,
                [apartment_id]
            );

            // Ghi Log
            AuditLog.create({
                user_id: req.user.id,
                action_type: 'CREATE',
                entity_name: 'residents',
                entity_id: newId,
                new_values: req.body,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            await connection.commit();
            res.status(201).json({ success: true, message: 'Thêm cư dân thành công!', data: { id: newId } });

        } catch (error) {
            await connection.rollback();
            if (error.code === 'ER_DUP_ENTRY') {
                if (error.message.includes('users.username')) return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại.' });
                if (error.message.includes('residents.cccd')) return res.status(409).json({ message: 'Số CCCD đã tồn tại.' });
            }
            res.status(500).json({ message: error.message || 'Lỗi server.' });
        } finally {
            connection.release();
        }
    },

    /**
     * [UPDATE] Cập nhật thông tin & Chuyển quyền
     * - Handle Role Switch (Owner <-> Member)
     * - Handle User Create/Disable
     */
    updateResident: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const { role, username, password, apartment_id, status } = req.body; // status có thể là 'Đã chuyển đi'

            const oldData = await Resident.findById(id);
            if (!oldData) return res.status(404).json({ message: 'Không tìm thấy cư dân.' });

            const currentAptId = apartment_id || oldData.apartment_id;
            let newUserId = oldData.user_id;

            // [LOGIC 1] Chuyển đổi Vai trò (Role Switching)
            if (role && role !== oldData.role) {
                
                // A. Member -> Owner (Thăng chức)
                if (role === 'owner') {
                    // Check xem đã có chủ hộ khác chưa
                    const [owners] = await connection.execute(
                        `SELECT id FROM residents WHERE apartment_id = ? AND role = 'owner' AND id != ? AND status != 'Đã chuyển đi'`,
                        [currentAptId, id]
                    );
                    if (owners.length > 0) {
                        throw new Error('Căn hộ đang có chủ hộ khác. Vui lòng hạ quyền chủ hộ cũ trước.');
                    }

                    // Nếu có username/password -> Tạo hoặc active user
                    if (username && password) {
                        const hash = await bcrypt.hash(password, 10);
                        if (newUserId) {
                            // Reactivate old user
                            await connection.execute(`UPDATE users SET username=?, password=?, is_active=1 WHERE id=?`, [username, hash, newUserId]);
                        } else {
                            // Create new user (ID = Resident ID)
                            newUserId = id; 
                            // Check collision
                            const [uCheck] = await connection.execute('SELECT id FROM users WHERE id = ?', [newUserId]);
                            if (uCheck.length === 0) {
                                await connection.execute(
                                    `INSERT INTO users (id, username, password, email, phone, role_id, is_active) VALUES (?, ?, ?, ?, ?, 3, 1)`,
                                    [newUserId, username, hash, req.body.email || oldData.email, req.body.phone || oldData.phone]
                                );
                            } else {
                                await connection.execute(`UPDATE users SET username=?, password=?, is_active=1 WHERE id=?`, [username, hash, newUserId]);
                            }
                        }
                    }
                } 
                
                // B. Owner -> Member (Hạ chức)
                else if (role === 'member') {
                    // Nếu status vẫn đang sống -> Phải đảm bảo đã có chủ hộ khác (hoặc sẽ có)
                    // Tuy nhiên, vì thao tác này thường làm trước khi thăng chức người khác
                    // Nên ta chỉ Cảnh báo hoặc cho phép nhưng Disable User.
                    
                    // Logic chặt: Nếu căn hộ còn người khác đang sống, mà hạ chủ hộ này xuống -> Căn hộ mất chủ
                    // Nhưng để linh hoạt cho FE, ta cho phép hạ, nhưng Disable User ngay lập tức.
                    if (newUserId) {
                        await connection.execute(`UPDATE users SET is_active = 0 WHERE id = ?`, [newUserId]);
                        newUserId = null; // Unlink trong bảng resident
                    }
                }
            }

            // Thực hiện Update
            await Resident.update(id, { ...req.body, user_id: newUserId }, connection);

            // [LOGIC 2] Nếu đổi Status -> Ghi history
            if (status && status !== oldData.status) {
                let eventType = 'Thay đổi trạng thái';
                if (status === 'Đã chuyển đi') eventType = 'Chuyển đi';
                
                await Resident.addHistory({
                    resident_id: id,
                    apartment_id: currentAptId,
                    event_type: eventType,
                    event_date: new Date(),
                    note: `Cập nhật trạng thái từ ${oldData.status} sang ${status}`
                }, connection);

                // Nếu chuyển đi -> Check Empty Apartment
                if (status === 'Đã chuyển đi') {
                    if (oldData.user_id) {
                        await connection.execute(`UPDATE users SET is_active = 0 WHERE id = ?`, [oldData.user_id]);
                    }
                    
                    // Check xem nhà còn ai không
                    const [actives] = await connection.execute(
                        `SELECT COUNT(*) as c FROM residents WHERE apartment_id = ? AND status != 'Đã chuyển đi' AND id != ?`,
                        [currentAptId, id]
                    );
                    
                    if (actives[0].c === 0) {
                        // Nhà trống -> Update status
                        await connection.execute(
                            `UPDATE apartments SET status = 'Trống' WHERE id = ? AND status != 'Đang sửa chữa'`,
                            [currentAptId]
                        );
                    }
                }
            }

            // Ghi Log
            AuditLog.create({
                user_id: req.user.id,
                action_type: 'UPDATE',
                entity_name: 'residents',
                entity_id: id,
                old_values: oldData,
                new_values: req.body,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            await connection.commit();
            res.json({ success: true, message: 'Cập nhật thành công.' });

        } catch (e) { 
            await connection.rollback();
            if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Dữ liệu bị trùng.' });
            res.status(500).json({ message: e.message }); 
        } finally {
            connection.release();
        }
    },

    /**
     * [MOVE-OUT] Chuyển đi
     * - Update status -> 'Đã chuyển đi'
     * - Disable User
     * - Update Apartment Status -> 'Trống' (nếu hết người)
     */
    moveOutResident: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const { move_out_date, reason } = req.body;

            const resident = await Resident.findById(id);
            if (!resident) throw new Error('Cư dân không tồn tại');

            // 1. Update Resident Status
            await Resident.update(id, { ...resident, status: 'Đã chuyển đi' }, connection);

            // 2. Disable User
            if (resident.user_id) {
                await connection.execute(`UPDATE users SET is_active = 0 WHERE id = ?`, [resident.user_id]);
            }

            // 3. Ghi History
            await Resident.addHistory({
                resident_id: id,
                apartment_id: resident.apartment_id,
                event_type: 'Chuyển đi',
                event_date: move_out_date || new Date(),
                note: reason || 'Chuyển đi khỏi chung cư'
            }, connection);

            // 4. [CHECK APARTMENT] Kiểm tra xem còn ai ở không
            const [actives] = await connection.execute(
                `SELECT COUNT(*) as c FROM residents WHERE apartment_id = ? AND status = 'Đang sinh sống'`,
                [resident.apartment_id]
            );
            
            if (actives[0].c === 0) {
                await connection.execute(
                    `UPDATE apartments SET status = 'Trống' WHERE id = ? AND status != 'Đang sửa chữa'`,
                    [resident.apartment_id]
                );
            }

            AuditLog.create({
                user_id: req.user.id,
                action_type: 'UPDATE',
                entity_name: 'residents',
                entity_id: id,
                old_values: { status: 'Đang sinh sống' },
                new_values: { status: 'Đã chuyển đi', reason },
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            await connection.commit();
            res.json({ success: true, message: 'Đã ghi nhận chuyển đi thành công.' });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ message: error.message });
        } finally {
            connection.release();
        }
    },

    /**
     * [DELETE] Xóa Vĩnh Viễn
     * - Check ràng buộc
     * - Update Apartment Status
     */
    deleteResident: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const oldData = await Resident.findById(id);
            if (!oldData) throw new Error('Không tồn tại.');

            // Xóa (Sẽ lỗi nếu dính khóa ngoại Fees/Reports -> Cần xử lý ở Model hoặc Catch)
            await connection.execute(`DELETE FROM residents WHERE id = ?`, [id]);

            // Nếu xóa user linked
            if (oldData.user_id) {
                await connection.execute(`DELETE FROM users WHERE id = ?`, [oldData.user_id]);
            }

            // Check Apartment Empty
            const [actives] = await connection.execute(
                `SELECT COUNT(*) as c FROM residents WHERE apartment_id = ? AND status = 'Đang sinh sống'`,
                [oldData.apartment_id]
            );
            if (actives[0].c === 0) {
                await connection.execute(
                    `UPDATE apartments SET status = 'Trống' WHERE id = ? AND status != 'Đang sửa chữa'`,
                    [oldData.apartment_id]
                );
            }

            AuditLog.create({
                user_id: req.user.id,
                action_type: 'DELETE',
                entity_name: 'residents',
                entity_id: id,
                old_values: oldData,
                new_values: null,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            await connection.commit();
            res.json({ success: true, message: 'Đã xóa hồ sơ vĩnh viễn.' });
        } catch (e) { 
            await connection.rollback();
            if (e.errno === 1451) return res.status(400).json({ message: 'Không thể xóa vì dữ liệu ràng buộc (Hóa đơn, Sự cố...). Vui lòng dùng chức năng "Chuyển đi".' });
            res.status(500).json({ message: e.message }); 
        } finally {
            connection.release();
        }
    },

    registerTemporary: async (req, res) => {
        try {
            if (!req.body.resident_id || !req.body.type || !req.body.start_date) {
                return res.status(400).json({ message: 'Thiếu thông tin bắt buộc.' });
            }
            await Resident.createTemporary(req.body);
            res.status(201).json({ success: true, message: 'Đã gửi đăng ký, vui lòng chờ duyệt.' });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },

    getTemporaryList: async (req, res) => {
        try {
            const list = await Resident.getAllTemporary(req.query);
            res.json({ success: true, data: list });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },

    approveTemporary: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const { status } = req.body; 

            await Resident.updateTemporaryStatus(id, status, req.user.id, connection);

            if (status === 'Đã duyệt') {
                const temp = await Resident.getTemporaryById(id);
                if (temp && temp.type === 'Tạm vắng') {
                    const [resInfo] = await connection.execute('SELECT * FROM residents WHERE id = ?', [temp.resident_id]);
                    if (resInfo.length > 0) {
                        await Resident.update(temp.resident_id, { ...resInfo[0], status: 'Tạm vắng' }, connection);
                        await Resident.addHistory({
                            resident_id: temp.resident_id,
                            apartment_id: resInfo[0].apartment_id,
                            event_type: 'Tạm vắng',
                            event_date: new Date(),
                            note: `Tạm vắng từ ${new Date(temp.start_date).toLocaleDateString()}: ${temp.reason}`
                        }, connection);
                    }
                }
            }

            await connection.commit();
            res.json({ success: true, message: `Đã cập nhật trạng thái thành ${status}.` });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ message: error.message });
        } finally {
            connection.release();
        }
    }
};

module.exports = residentController;