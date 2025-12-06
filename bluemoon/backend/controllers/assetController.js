// File: backend/controllers/assetController.js

const Asset = require('../models/assetModel');
const AuditLog = require('../models/auditModel');

const assetController = {

    // =================================================
    // 1. XEM DANH SÁCH & CHI TIẾT
    // =================================================

    /**
     * [GET] /api/assets
     * Lấy danh sách tài sản (Hỗ trợ lọc theo trạng thái và tìm kiếm)
     */
    getAllAssets: async (req, res) => {
        try {
            const filters = {
                status: req.query.status,    // VD: ?status=Hỏng
                keyword: req.query.keyword   // VD: ?keyword=Thang máy
            };

            const assets = await Asset.getAll(filters);
            
            res.status(200).json({
                success: true,
                count: assets.length,
                data: assets
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server khi lấy danh sách tài sản.', error: error.message });
        }
    },

    /**
     * [GET] /api/assets/:id
     * Xem chi tiết một tài sản
     */
    getAssetDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const asset = await Asset.findById(id);

            if (!asset) {
                return res.status(404).json({ message: 'Tài sản không tồn tại.' });
            }

            res.status(200).json({ success: true, data: asset });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // =================================================
    // 2. THÊM - SỬA - XÓA (CÓ GHI LOG)
    // =================================================

    /**
     * [POST] /api/assets
     * Tạo tài sản mới
     */
    createAsset: async (req, res) => {
        try {
            const { asset_code, name, description, location, purchase_date, price, status } = req.body;

            // 1. Validate dữ liệu bắt buộc
            if (!asset_code || !name) {
                return res.status(400).json({ message: 'Mã tài sản và Tên tài sản là bắt buộc.' });
            }

            // 2. Kiểm tra trùng mã tài sản
            const isDuplicate = await Asset.checkDuplicateCode(asset_code);
            if (isDuplicate) {
                return res.status(409).json({ message: `Mã tài sản '${asset_code}' đã tồn tại.` });
            }

            // 3. Thực hiện tạo mới
            const newAsset = await Asset.create(req.body);

            // 4. [AUDIT LOG] Ghi lại hành động
            // Lưu ý: create AuditLog không await để tránh làm chậm response của user
            AuditLog.create({
                user_id: req.user.id,        // Lấy từ Token
                action_type: 'CREATE',
                entity_name: 'assets',
                entity_id: newAsset.id,
                old_values: null,            // Tạo mới thì không có dữ liệu cũ
                new_values: newAsset,        // Lưu toàn bộ dữ liệu vừa tạo
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.status(201).json({
                success: true,
                message: 'Thêm tài sản thành công.',
                data: newAsset
            });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server khi tạo tài sản.', error: error.message });
        }
    },

    /**
     * [PUT] /api/assets/:id
     * Cập nhật thông tin tài sản
     */
    updateAsset: async (req, res) => {
        try {
            const { id } = req.params;
            
            // 1. Kiểm tra tài sản có tồn tại không & Lấy dữ liệu cũ để lưu log
            const oldAsset = await Asset.findById(id);
            if (!oldAsset) {
                return res.status(404).json({ message: 'Tài sản không tồn tại.' });
            }

            // 2. Thực hiện cập nhật
            const updatedData = await Asset.update(id, req.body);

            // 3. [AUDIT LOG] Ghi lại hành động
            AuditLog.create({
                user_id: req.user.id,
                action_type: 'UPDATE',
                entity_name: 'assets',
                entity_id: id,
                old_values: oldAsset,       // Quan trọng: Lưu lại giá trị TRƯỚC khi sửa
                new_values: updatedData,    // Giá trị SAU khi sửa
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.status(200).json({
                success: true,
                message: 'Cập nhật tài sản thành công.',
                data: updatedData
            });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server khi cập nhật tài sản.', error: error.message });
        }
    },

    /**
     * [DELETE] /api/assets/:id
     * Xóa tài sản
     */
    deleteAsset: async (req, res) => {
        try {
            const { id } = req.params;

            // 1. Lấy dữ liệu cũ lần cuối để lưu log (nếu xóa rồi thì không biết đã xóa cái gì)
            const oldAsset = await Asset.findById(id);
            if (!oldAsset) {
                return res.status(404).json({ message: 'Tài sản không tồn tại.' });
            }

            // 2. Thực hiện xóa
            await Asset.delete(id);

            // 3. [AUDIT LOG] Ghi lại hành động
            AuditLog.create({
                user_id: req.user.id,
                action_type: 'DELETE',
                entity_name: 'assets',
                entity_id: id,
                old_values: oldAsset,      // Lưu lại thông tin tài sản bị xóa để tra cứu nếu cần
                new_values: null,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.status(200).json({ success: true, message: 'Đã xóa tài sản thành công.' });

        } catch (error) {
            // Xử lý lỗi ràng buộc khóa ngoại (Foreign Key)
            // Ví dụ: Tài sản này đang có trong bảng maintenance_schedules
            if (error.errno === 1451) {
                return res.status(400).json({ 
                    message: 'Không thể xóa tài sản này vì đang có dữ liệu lịch sử bảo trì liên quan.' 
                });
            }
            res.status(500).json({ message: 'Lỗi server khi xóa tài sản.', error: error.message });
        }
    }
};

module.exports = assetController;