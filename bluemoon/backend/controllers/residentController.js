// File: backend/controllers/residentController.js

const Resident = require('../models/residentModel');
const db = require('../config/db');
const idGenerator = require('../utils/idGenerator');
const bcrypt = require('bcryptjs');
const AuditLog = require('../models/auditModel'); // [MỚI] Import AuditLog

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
            
            await Resident.updateMyProfile(userId, req.body);

            // [FIX REQ 2] Ghi log khi cư dân tự sửa (nếu có logic duyệt sau này sẽ khác, giờ log trước)
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

            const newId = await idGenerator.generateIncrementalId('residents', 'R', 'id', 4, connection);
            let userId = null;

            if (role === 'owner' && username && password) {
                const [existing] = await connection.execute(
                    `SELECT id FROM users WHERE username = ? OR email = ?`, 
                    [username, email]
                );
                if (existing.length > 0) {
                    throw new Error('Username hoặc Email đã được sử dụng.');
                }

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                await connection.execute(
                    `INSERT INTO users (id, username, password, email, phone, role_id, is_active) 
                     VALUES (?, ?, ?, ?, ?, 3, 1)`,
                    [newId, username, hashedPassword, email, phone]
                );
                
                userId = newId; 
            }

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

            await Resident.addHistory({
                resident_id: newId,
                apartment_id: apartment_id,
                event_type: 'Chuyển đến',
                event_date: new Date(),
                note: 'Đăng ký mới vào hệ thống'
            }, connection);

            await connection.execute(
                `UPDATE apartments SET status = 'Đang sinh sống' WHERE id = ? AND status = 'Trống'`,
                [apartment_id]
            );

            // [FIX REQ 2] Ghi Log Create
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
            res.status(201).json({ 
                success: true, 
                message: userId ? 'Thêm cư dân và tạo tài khoản thành công!' : 'Thêm cư dân thành công!', 
                data: { id: newId, username: userId ? username : null } 
            });

        } catch (error) {
            await connection.rollback();
            if (error.code === 'ER_DUP_ENTRY') {
                if (error.message.includes('users.username')) return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại.' });
                if (error.message.includes('residents.cccd')) return res.status(409).json({ message: 'Số CCCD đã tồn tại.' });
                if (error.message.includes('users.email')) return res.status(409).json({ message: 'Email đã tồn tại.' });
                return res.status(409).json({ message: 'Dữ liệu bị trùng lặp.', detail: error.message });
            }
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        } finally {
            connection.release();
        }
    },

    updateResident: async (req, res) => {
        try {
            const { id } = req.params;
            const oldData = await Resident.findById(id);
            if (!oldData) return res.status(404).json({ message: 'Không tìm thấy cư dân.' });

            await Resident.update(id, req.body);

            // [FIX REQ 2] Ghi Log Update
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

            res.json({ success: true, message: 'Cập nhật thành công.' });
        } catch (e) { 
            if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'CCCD mới bị trùng.' });
            res.status(500).json({ message: e.message }); 
        }
    },

    moveOutResident: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const { move_out_date, reason } = req.body;

            const resident = await Resident.findById(id);
            if (!resident) throw new Error('Cư dân không tồn tại');

            await Resident.update(id, { ...resident, status: 'Đã chuyển đi' }, connection);

            if (resident.user_id) {
                await connection.execute(`UPDATE users SET is_active = 0 WHERE id = ?`, [resident.user_id]);
            }

            await Resident.addHistory({
                resident_id: id,
                apartment_id: resident.apartment_id,
                event_type: 'Chuyển đi',
                event_date: move_out_date || new Date(),
                note: reason || 'Chuyển đi khỏi chung cư'
            }, connection);

            // [FIX REQ 2] Ghi Log Move Out
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

    deleteResident: async (req, res) => {
        try {
            const { id } = req.params;
            const oldData = await Resident.findById(id);
            if (!oldData) return res.status(404).json({ message: 'Không tồn tại.' });

            await Resident.delete(id);

            // [FIX REQ 2] Ghi Log Delete
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

            res.json({ success: true, message: 'Đã xóa hồ sơ vĩnh viễn.' });
        } catch (e) { 
            if (e.errno === 1451) return res.status(400).json({ message: 'Không thể xóa vì dữ liệu ràng buộc.' });
            res.status(500).json({ message: e.message }); 
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