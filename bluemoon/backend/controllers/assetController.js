// File: backend/controllers/assetController.js

const Asset = require('../models/assetModel');
const AuditLog = require('../models/auditModel');
const db = require('../config/db');

const assetController = {

    // [GET] /api/assets
    getAllAssets: async (req, res) => {
        try {
            const assets = await Asset.getAll(req.query);
            res.json({ success: true, count: assets.length, data: assets });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [GET] /api/assets/:id
    getAssetDetail: async (req, res) => {
        try {
            const asset = await Asset.findById(req.params.id);
            if (!asset) return res.status(404).json({ message: 'Tài sản không tồn tại.' });
            res.json({ success: true, data: asset });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [POST] /api/assets
    createAsset: async (req, res) => {
        try {
            // [FIX REQ 26 & 28] Tự động sinh mã định danh (TS + Timestamp)
            // VD: TS17035999
            const asset_code = req.body.asset_code || `TS${Date.now().toString().slice(-8)}`;
            
            // [FIX REQ 27] Status mặc định xử lý bên Model rồi, nhưng check ở đây cho chắc
            const status = req.body.status || 'Đang hoạt động';

            const newAsset = await Asset.create({ ...req.body, asset_code, status });

            // Ghi Log
            AuditLog.create({
                user_id: req.user.id,
                action_type: 'CREATE',
                entity_name: 'assets',
                entity_id: newAsset.id,
                new_values: newAsset,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.status(201).json({ success: true, message: 'Thêm tài sản thành công.', data: newAsset });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Mã tài sản đã tồn tại.' });
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [PUT] /api/assets/:id
    updateAsset: async (req, res) => {
        try {
            const { id } = req.params;
            const oldAsset = await Asset.findById(id);
            if (!oldAsset) return res.status(404).json({ message: 'Không tồn tại.' });

            const updatedAsset = await Asset.update(id, req.body);

            AuditLog.create({
                user_id: req.user.id,
                action_type: 'UPDATE',
                entity_name: 'assets',
                entity_id: id,
                old_values: oldAsset,
                new_values: updatedAsset,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.json({ success: true, message: 'Cập nhật thành công.' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // [DELETE] /api/assets/:id
    deleteAsset: async (req, res) => {
        try {
            const { id } = req.params;
            // 1. Lấy dữ liệu cũ
            const oldAsset = await Asset.findById(id);
            if (!oldAsset) {
                return res.status(404).json({ message: 'Tài sản không tồn tại.' });
            }

            // 2. [QUAN TRỌNG] Kiểm tra xem có lịch sử bảo trì không
            // Hàm findById trong Model đã trả về mảng maintenance_history
            if (oldAsset.maintenance_history && oldAsset.maintenance_history.length > 0) {
                return res.status(400).json({ 
                    message: `Không thể xóa tài sản này vì đang có ${oldAsset.maintenance_history.length} bản ghi lịch sử bảo trì.` 
                });
            }

            await Asset.delete(id);

            AuditLog.create({
                user_id: req.user.id,
                action_type: 'DELETE',
                entity_name: 'assets',
                entity_id: id,
                old_values: oldAsset,
                new_values: null,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.json({ success: true, message: 'Đã xóa tài sản.' });
        } catch (error) {
            if (error.errno === 1451) return res.status(400).json({ message: 'Không thể xóa vì có dữ liệu bảo trì liên quan.' });
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // ==========================================
    // QUẢN LÝ BẢO TRÌ (MAINTENANCE)
    // ==========================================

    // [POST] /api/assets/:id/maintenance
    // Thêm lịch bảo trì mới
    addMaintenance: async (req, res) => {
        try {
            const { id } = req.params; // Asset ID
            const { title, description, scheduled_date, technician_name, is_recurring, recurring_interval } = req.body;

            await Asset.addMaintenanceSchedule({
                asset_id: id,
                title, description, scheduled_date, technician_name, is_recurring, recurring_interval
            });

            res.status(201).json({ success: true, message: 'Đã lên lịch bảo trì.' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // [PUT] /api/assets/maintenance/:scheduleId/complete
    // [FIX REQ 31] Hoàn thành bảo trì -> Lưu Snapshot -> Tạo lịch mới (nếu lặp lại)
    completeMaintenance: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { scheduleId } = req.params;
            const { completed_date, cost, note } = req.body;

            // 1. Lấy thông tin lịch cũ
            const schedule = await Asset.getScheduleById(scheduleId);
            if (!schedule) throw new Error('Lịch trình không tồn tại.');
            if (schedule.status === 'Hoàn thành') throw new Error('Lịch này đã hoàn thành rồi.');

            // 2. Cập nhật thành Hoàn thành (Lưu Snapshot tại dòng này)
            await Asset.completeMaintenance(scheduleId, { 
                completed_date: completed_date || new Date(), 
                cost: cost || 0, 
                note 
            }, connection);

            // 3. Nếu là lặp lại (is_recurring) -> Tạo dòng mới cho tương lai
            if (schedule.is_recurring && schedule.recurring_interval > 0) {
                const nextDate = new Date(completed_date || new Date());
                nextDate.setDate(nextDate.getDate() + schedule.recurring_interval);

                const queryNew = `
                    INSERT INTO maintenance_schedules 
                    (asset_id, title, description, scheduled_date, technician_name, status, is_recurring, recurring_interval)
                    VALUES (?, ?, ?, ?, ?, 'Lên lịch', 1, ?)
                `;
                await connection.execute(queryNew, [
                    schedule.asset_id, 
                    schedule.title, 
                    schedule.description, 
                    nextDate, 
                    schedule.technician_name, 
                    schedule.recurring_interval
                ]);
            }

            // 4. Cập nhật trạng thái Tài sản (VD: Đang bảo trì -> Đang hoạt động)
            await connection.execute(`UPDATE assets SET status = 'Đang hoạt động' WHERE id = ?`, [schedule.asset_id]);

            await connection.commit();
            res.json({ success: true, message: 'Đã hoàn thành bảo trì và cập nhật lịch mới.' });

        } catch (error) {
            await connection.rollback();
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        } finally {
            connection.release();
        }
    }
};

module.exports = assetController;