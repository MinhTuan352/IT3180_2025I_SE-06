// File: backend/controllers/residentController.js

const Resident = require('../models/residentModel');
const User = require('../models/userModel');
const db = require('../config/db');

const residentController = {

    // ========================================================
    // [MỚI] CƯ DÂN XEM PROFILE CỦA CHÍNH MÌNH
    // ========================================================

    // [GET] /api/residents/me
    getMyProfile: async (req, res) => {
        try {
            const userId = req.user.id; // Lấy từ token
            const resident = await Resident.findByUserId(userId);

            if (!resident) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin cư dân. Có thể tài khoản của bạn chưa được liên kết với hồ sơ cư dân.'
                });
            }

            res.status(200).json({ success: true, data: resident });
        } catch (error) {
            console.error('Error in getMyProfile:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [PUT] /api/residents/me
    updateMyProfile: async (req, res) => {
        try {
            const userId = req.user.id;

            // Kiểm tra xem cư dân có tồn tại không
            const existingResident = await Resident.findByUserId(userId);
            if (!existingResident) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin cư dân.'
                });
            }

            // Chỉ cho phép cập nhật các trường hạn chế
            const allowedFields = {
                phone: req.body.phone,
                email: req.body.email,
                hometown: req.body.hometown,
                occupation: req.body.occupation
            };

            await Resident.updateMyProfile(userId, allowedFields);

            res.json({
                success: true,
                message: 'Cập nhật thông tin cá nhân thành công!'
            });
        } catch (error) {
            console.error('Error in updateMyProfile:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [GET] /api/residents/my-apartment
    // Cư dân xem thông tin căn hộ của mình
    getMyApartment: async (req, res) => {
        try {
            const userId = req.user.id; // Lấy từ token

            // 1. Tìm thông tin cư dân của user
            const resident = await Resident.findByUserId(userId);
            if (!resident) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin cư dân. Có thể tài khoản của bạn chưa được liên kết với hồ sơ cư dân.'
                });
            }

            // 2. Lấy thông tin căn hộ từ apartment_id của cư dân
            const apartmentResult = await Resident.getApartmentWithMembers(resident.apartment_id);

            res.status(200).json({
                success: true,
                data: apartmentResult
            });
        } catch (error) {
            console.error('Error in getMyApartment:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // ========================================================
    // CÁC HÀM QUẢN LÝ CƯ DÂN (CHO BOD/ACCOUNTANT)
    // ========================================================

    // [GET] /api/residents
    getAllResidents: async (req, res) => {
        try {
            // Lấy tham số từ URL
            // Ví dụ: /api/residents?name=Nam&apartment_code=A-101
            const filters = {
                name: req.query.name,
                apartment_code: req.query.apartment_code,
                status: req.query.status
            };

            const residents = await Resident.getAll(filters);

            res.status(200).json({
                success: true,
                count: residents.length,
                data: residents
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server khi lấy danh sách cư dân.', error: error.message });
        }
    },

    // [GET] /api/residents/:id
    getResidentDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const resident = await Resident.findById(id);

            if (!resident) {
                return res.status(404).json({ message: 'Không tìm thấy cư dân.' });
            }

            // [MỚI] Lấy thêm lịch sử cư trú
            const [history] = await db.execute(`SELECT * FROM residence_history WHERE resident_id = ? ORDER BY event_date DESC`, [req.params.id]);

            res.status(200).json({ success: true, data: resident, history });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [POST] /api/residents
    createResident: async (req, res) => {
        try {
            // Lấy dữ liệu từ form
            const {
                id, apartment_id, full_name, role, dob, gender, cccd, 
                phone, email, username, password, identity_date, identity_place,
                hometown, occupation, relationship_with_owner
            } = req.body;

            // 1. Validate cơ bản
            if (!id || !apartment_id || !full_name || !role || !cccd) {
                return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc (ID, Căn hộ, Họ tên, Vai trò, CCCD).' });
            }

            // 2. Logic tạo mới
            // Nếu là "Chủ hộ" (owner) VÀ có đủ username/password -> Tạo User + Resident (Transaction)
            if (role === 'owner' && username && password) {
                // Kiểm tra trùng lặp trước
                const duplicateError = await User.checkDuplicate(username, email, cccd, 'residents');
                if (duplicateError) {
                    return res.status(409).json({ message: duplicateError });
                }

                // Gọi Transaction bên User Model
                const result = await User.createResidentAccount(req.body);

                await Resident.addHistory({
                    resident_id: id,
                    apartment_id: apartment_id,
                    event_type: 'Chuyển đến',
                    event_date: new Date(),
                    note: 'Đăng ký mới vào hệ thống'
                }, connection);

                return res.status(201).json({
                    success: true,
                    message: 'Thêm Cư dân (Chủ hộ) và tạo tài khoản thành công!',
                    data: result
                });

            } else {
                // Trường hợp: Thành viên (không cần user) HOẶC Chủ hộ nhưng thiếu pass (Import Excel, migration cũ...)
                // Chỉ tạo Resident bình thường

                // Mặc dù user_id có thể null, nhưng nếu Import Excel ta cứ để null
                const newResident = await Resident.create(req.body);

                await Resident.addHistory({
                    resident_id: id,
                    apartment_id: apartment_id,
                    event_type: 'Chuyển đến',
                    event_date: new Date(),
                    note: 'Đăng ký mới vào hệ thống'
                }, connection);

                return res.status(201).json({
                    success: true,
                    message: 'Thêm cư dân thành công!',
                    data: newResident
                });
            }

        } catch (error) {
            // Xử lý lỗi trùng lặp (Duplicate entry)
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Dữ liệu bị trùng lặp (ID hoặc CCCD đã tồn tại).' });
            }
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ message: 'Mã căn hộ (apartment_id) không tồn tại.' });
            }
            console.error('Error createResident:', error);
            res.status(500).json({ message: 'Lỗi server khi thêm cư dân.', error: error.message });
        }
    },

    // [PUT] /api/residents/:id
    updateResident: async (req, res) => {
        try {
            const { id } = req.params;
            const existingResident = await Resident.findById(id);

            if (!existingResident) {
                return res.status(404).json({ message: 'Cư dân không tồn tại.' });
            }

            await Resident.update(id, req.body);

            res.json({ success: true, message: 'Cập nhật thông tin thành công.' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'CCCD mới bị trùng với cư dân khác.' });
            }
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [MOVE-OUT] Chuyển đi (Thay vì xóa)
     */
    moveOutResident: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const { move_out_date, reason } = req.body;

            const resident = await Resident.findById(id);
            if (!resident) throw new Error('Cư dân không tồn tại');

            // 1. Cập nhật trạng thái thành 'Đã chuyển đi'
            await Resident.update(id, { ...resident, status: 'Đã chuyển đi' }, connection);

            // 2. Ghi lịch sử "Chuyển đi"
            await Resident.addHistory({
                resident_id: id,
                apartment_id: resident.apartment_id,
                event_type: 'Chuyển đi',
                event_date: move_out_date || new Date(),
                note: reason || 'Chuyển đi khỏi chung cư'
            }, connection);

            await connection.commit();
            res.json({ success: true, message: 'Đã ghi nhận chuyển đi thành công.' });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ message: error.message });
        } finally {
            connection.release();
        }
    },

    // [DELETE] /api/residents/:id
    deleteResident: async (req, res) => {
        try {
            const { id } = req.params;
            const existingResident = await Resident.findById(id);

            if (!existingResident) {
                return res.status(404).json({ message: 'Cư dân không tồn tại.' });
            }

            // Kiểm tra ràng buộc (nếu cần): Ví dụ nếu cư dân đang nợ phí thì không cho xóa
            // Hiện tại ta cho phép xóa, DB sẽ báo lỗi nếu có ràng buộc khóa ngoại (Foreign Key)

            await Resident.delete(id);
            res.json({ success: true, message: 'Xóa cư dân thành công.' });
        } catch (error) {
            // Lỗi 1451: Cannot delete or update a parent row (do dính khóa ngoại bảng Fees, Reports...)
            if (error.errno === 1451) {
                return res.status(400).json({ message: 'Không thể xóa cư dân này vì dữ liệu liên quan (Hóa đơn, Phản ánh) vẫn còn.' });
            }
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // --- TẠM TRÚ / TẠM VẮNG ---
    
    registerTemporary: async (req, res) => {
        try {
            // Validate sơ bộ
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

    /**
     * [APPROVE] Duyệt đơn Tạm trú/vắng
     */
    approveTemporary: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const { status } = req.body; // 'Đã duyệt' hoặc 'Từ chối'

            // 1. Cập nhật trạng thái đơn
            await Resident.updateTemporaryStatus(id, status, req.user.id, connection);

            // 2. Nếu là 'Tạm vắng' và được 'Đã duyệt' -> Cập nhật trạng thái cư dân + Ghi lịch sử
            if (status === 'Đã duyệt') {
                const temp = await Resident.getTemporaryById(id);
                if (temp && temp.type === 'Tạm vắng') {
                    // Update Status Cư dân thành 'Tạm vắng'
                    const [resInfo] = await connection.execute('SELECT * FROM residents WHERE id = ?', [temp.resident_id]);
                    if (resInfo.length > 0) {
                        await Resident.update(temp.resident_id, { ...resInfo[0], status: 'Tạm vắng' }, connection);
                        
                        // Ghi lịch sử biến động
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