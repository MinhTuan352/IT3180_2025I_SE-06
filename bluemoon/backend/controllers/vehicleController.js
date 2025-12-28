// File: backend/controllers/vehicleController.js

const Vehicle = require('../models/vehicleModel');
const AuditLog = require('../models/auditModel'); // Ghi log khi BQT duyệt xe
const db = require('../config/db');

// Helper: Tìm Resident ID từ User ID
const getResidentIdFromUser = async (userId) => {
    const query = `SELECT id FROM residents WHERE user_id = ?`;
    const [rows] = await db.execute(query, [userId]);
    if (rows.length > 0) return rows[0].id;
    return null;
};

const vehicleController = {

    // ==========================================
    // 1. DÀNH CHO CƯ DÂN (RESIDENT)
    // ==========================================

    /**
     * [GET] /api/vehicles/me
     * Xem danh sách xe của chính mình
     */
    getMyVehicles: async (req, res) => {
        try {
            const residentId = await getResidentIdFromUser(req.user.id);
            if (!residentId) {
                return res.status(403).json({ message: 'Không tìm thấy hồ sơ cư dân.' });
            }

            const vehicles = await Vehicle.getByResidentId(residentId);
            res.json({ success: true, data: vehicles });
        } catch (error) {
            console.error('Error getMyVehicles:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [POST] /api/vehicles/register
     * Đăng ký xe mới (Cư dân tự đăng ký -> Trạng thái: Chờ duyệt)
     * Yêu cầu: Upload ảnh xe & ảnh đăng ký xe
     */
    registerVehicle: async (req, res) => {
        try {
            const { vehicle_type, license_plate, brand, model } = req.body;

            // 1. Validate cơ bản
            if (!vehicle_type || !license_plate) {
                return res.status(400).json({ message: 'Loại xe và Biển số là bắt buộc.' });
            }

            // 2. Lấy thông tin cư dân & căn hộ
            // Cần lấy cả apartment_id để lưu vào bảng vehicles
            const [residents] = await db.execute(
                `SELECT id, apartment_id FROM residents WHERE user_id = ?`,
                [req.user.id]
            );

            if (residents.length === 0) {
                return res.status(403).json({ message: 'Bạn chưa có hồ sơ cư dân.' });
            }
            const resident = residents[0];

            // 3. Kiểm tra biển số trùng
            const isExist = await Vehicle.checkPlateExists(license_plate);
            if (isExist) {
                return res.status(409).json({ message: `Biển số ${license_plate} đã được đăng ký trong hệ thống.` });
            }

            // 4. Xử lý File Upload (Từ Multer)
            // Frontend gửi: formData.append('vehicle_image', file1) và formData.append('registration_cert', file2)
            let vehicle_image = null;
            let registration_cert = null;

            if (req.files) {
                if (req.files.vehicle_image && req.files.vehicle_image.length > 0) {
                    vehicle_image = `/uploads/vehicles/${req.files.vehicle_image[0].filename}`;
                }
                if (req.files.registration_cert && req.files.registration_cert.length > 0) {
                    registration_cert = `/uploads/vehicles/${req.files.registration_cert[0].filename}`;
                }
            }

            // 5. Tạo dữ liệu
            const newVehicle = await Vehicle.create({
                resident_id: resident.id,
                apartment_id: resident.apartment_id,
                vehicle_type,
                license_plate,
                brand,
                model,
                vehicle_image,
                registration_cert,
                status: 'Chờ duyệt' // Mặc định
            });

            res.status(201).json({
                success: true,
                message: 'Đăng ký xe thành công! Vui lòng chờ Ban Quản Trị duyệt.',
                data: newVehicle
            });

        } catch (error) {
            console.error('Error registerVehicle:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [DELETE] /api/vehicles/:id
     * Hủy đăng ký xe (Cư dân tự hủy hoặc báo bán xe)
     */
    cancelRegistration: async (req, res) => {
        try {
            const { id } = req.params;
            const residentId = await getResidentIdFromUser(req.user.id);

            // Kiểm tra quyền sở hữu
            const vehicle = await Vehicle.getById(id);
            if (!vehicle) {
                return res.status(404).json({ message: 'Xe không tồn tại.' });
            }

            if (vehicle.resident_id !== residentId) {
                return res.status(403).json({ message: 'Bạn không có quyền xóa xe này.' });
            }

            // Thực hiện xóa
            await Vehicle.delete(id);

            res.json({ success: true, message: 'Đã hủy đăng ký xe thành công.' });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    // ==========================================
    // 2. DÀNH CHO BAN QUẢN TRỊ (BOD)
    // ==========================================

    /**
     * [GET] /api/vehicles
     * Xem danh sách tất cả xe (Hỗ trợ lọc theo trạng thái/căn hộ)
     */
    getAllVehicles: async (req, res) => {
        try {
            // Lấy params lọc từ URL
            const filters = {
                status: req.query.status,           // 'Chờ duyệt', 'Đang sử dụng'
                apartment_id: req.query.apartment_id,
                keyword: req.query.keyword          // Tìm theo biển số hoặc tên chủ xe
            };

            const vehicles = await Vehicle.getAll(filters);

            res.json({
                success: true,
                count: vehicles.length,
                data: vehicles
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [PUT] /api/vehicles/:id/status
     * Duyệt hoặc Từ chối xe
     */
    updateVehicleStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body; // 'Đang sử dụng' hoặc 'Ngừng sử dụng'

            if (!['Đang sử dụng', 'Ngừng sử dụng', 'Chờ duyệt'].includes(status)) {
                return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
            }

            const vehicle = await Vehicle.getById(id);
            if (!vehicle) return res.status(404).json({ message: 'Xe không tồn tại.' });

            // Cập nhật
            await Vehicle.update(id, { status });

            // Ghi Audit Log
            await AuditLog.create({
                user_id: req.user.id,
                action_type: 'UPDATE',
                entity_name: 'vehicles',
                entity_id: id,
                old_values: { status: vehicle.status },
                new_values: { status },
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            res.json({
                success: true,
                message: `Đã cập nhật trạng thái xe thành: ${status}`
            });

        } catch (error) {
            console.error('Error updateVehicleStatus:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [GET] /api/vehicles/resident/:residentId
     * BOD/CQCN xem danh sách xe của một cư dân cụ thể
     */
    getVehiclesByResidentId: async (req, res) => {
        try {
            const { residentId } = req.params;
            const vehicles = await Vehicle.getByResidentId(residentId);
            res.json({ success: true, data: vehicles });
        } catch (error) {
            console.error('Error getVehiclesByResidentId:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * [PUT] /api/vehicles/:id
     * Admin chỉnh sửa thông tin xe (VD: sửa sai biển số, loại xe)
     */
    updateVehicleInfo: async (req, res) => {
        try {
            const { id } = req.params;
            const { license_plate, brand, model, vehicle_type } = req.body;

            const vehicle = await Vehicle.getById(id);
            if (!vehicle) return res.status(404).json({ message: 'Xe không tồn tại.' });

            await Vehicle.update(id, { license_plate, brand, model, vehicle_type });

            res.json({ success: true, message: 'Cập nhật thông tin xe thành công.' });

        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [POST] /api/vehicles
     * BOD thêm xe mới (status = 'Đang sử dụng' luôn)
     */
    createVehicle: async (req, res) => {
        try {
            const { resident_id, vehicle_type, license_plate, brand, model, status } = req.body;

            // Validate
            if (!resident_id || !vehicle_type || !license_plate) {
                return res.status(400).json({ message: 'Mã cư dân, loại xe và biển số là bắt buộc.' });
            }

            // Check resident exists and get apartment_id
            const [residents] = await db.execute(
                `SELECT id, apartment_id FROM residents WHERE id = ?`,
                [resident_id]
            );

            if (residents.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy cư dân với mã này.' });
            }
            const resident = residents[0];

            // Check duplicate plate
            const isExist = await Vehicle.checkPlateExists(license_plate);
            if (isExist) {
                return res.status(409).json({ message: `Biển số ${license_plate} đã được đăng ký.` });
            }

            // Handle file uploads
            let vehicle_image = null;
            let registration_cert = null;
            if (req.files) {
                if (req.files.vehicle_image && req.files.vehicle_image.length > 0) {
                    vehicle_image = `/uploads/vehicles/${req.files.vehicle_image[0].filename}`;
                }
                if (req.files.registration_cert && req.files.registration_cert.length > 0) {
                    registration_cert = `/uploads/vehicles/${req.files.registration_cert[0].filename}`;
                }
            }

            // Create vehicle
            const newVehicle = await Vehicle.create({
                resident_id: resident.id,
                apartment_id: resident.apartment_id,
                vehicle_type,
                license_plate: license_plate.toUpperCase(),
                brand,
                model,
                vehicle_image,
                registration_cert,
                status: status || 'Đang sử dụng' // BOD tạo thì auto duyệt
            });

            res.status(201).json({
                success: true,
                message: 'Thêm xe thành công!',
                data: newVehicle
            });

        } catch (error) {
            console.error('Error createVehicle:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [GET] /api/vehicles/export
     * Export danh sách xe ra Excel
     */
    exportVehicles: async (req, res) => {
        try {
            const filters = {
                status: req.query.status,
                keyword: req.query.keyword
            };

            const vehicles = await Vehicle.getAll(filters);

            // Create Excel using excel4node
            const xl = require('excel4node');
            const wb = new xl.Workbook();
            const ws = wb.addWorksheet('Danh sách xe');

            // Header style
            const headerStyle = wb.createStyle({
                font: { bold: true, color: '#FFFFFF' },
                fill: { type: 'pattern', patternType: 'solid', fgColor: '#1976d2' },
                alignment: { horizontal: 'center' }
            });

            // Headers
            const headers = ['STT', 'Loại xe', 'Biển số', 'Hãng xe', 'Model', 'Căn hộ', 'Tòa nhà', 'Chủ xe', 'Trạng thái', 'Ngày đăng ký'];
            headers.forEach((h, i) => ws.cell(1, i + 1).string(h).style(headerStyle));

            // Data rows
            vehicles.forEach((v, i) => {
                ws.cell(i + 2, 1).number(i + 1);
                ws.cell(i + 2, 2).string(v.vehicle_type || '');
                ws.cell(i + 2, 3).string(v.license_plate || '');
                ws.cell(i + 2, 4).string(v.brand || '');
                ws.cell(i + 2, 5).string(v.model || '');
                ws.cell(i + 2, 6).string(v.apartment_code || '');
                ws.cell(i + 2, 7).string(v.building || '');
                ws.cell(i + 2, 8).string(v.owner_name || '');
                ws.cell(i + 2, 9).string(v.status || '');
                ws.cell(i + 2, 10).string(v.registration_date ? new Date(v.registration_date).toLocaleDateString('vi-VN') : '');
            });

            // Column widths
            [5, 12, 15, 12, 15, 10, 10, 20, 15, 15].forEach((w, i) => ws.column(i + 1).setWidth(w));

            // Send file
            const fileName = `danh_sach_xe_${new Date().toISOString().split('T')[0]}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

            wb.write(fileName, res);

        } catch (error) {
            console.error('Error exportVehicles:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    },

    /**
     * [POST] /api/vehicles/import
     * Import danh sách xe từ Excel
     * Cột: Loại xe, Biển số, Hãng xe, Model, Căn hộ, Tòa nhà, Chủ xe, Trạng thái, Ngày đăng ký
     */
    importVehicles: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Vui lòng upload file Excel.' });
            }

            const XLSX = require('xlsx');
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                return res.status(400).json({ message: 'File Excel không có dữ liệu.' });
            }

            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const row of jsonData) {
                try {
                    // Map columns (Vietnamese headers)
                    const vehicleType = row['Loại xe'] || row['Loai xe'];
                    const licensePlate = row['Biển số'] || row['Bien so'];
                    const brand = row['Hãng xe'] || row['Hang xe'];
                    const model = row['Model'];
                    const apartmentCode = row['Căn hộ'] || row['Can ho'];
                    const ownerName = row['Chủ xe'] || row['Chu xe'];
                    const status = row['Trạng thái'] || row['Trang thai'] || 'Đang sử dụng';

                    // Validate required fields
                    if (!vehicleType || !licensePlate || !apartmentCode) {
                        errors.push(`Dòng thiếu thông tin bắt buộc: ${licensePlate || 'N/A'}`);
                        errorCount++;
                        continue;
                    }

                    // Check duplicate plate
                    const isExist = await Vehicle.checkPlateExists(licensePlate.toString().trim().toUpperCase());
                    if (isExist) {
                        errors.push(`Biển số ${licensePlate} đã tồn tại.`);
                        errorCount++;
                        continue;
                    }

                    // Find apartment by code
                    const [apartments] = await db.execute(
                        `SELECT id FROM apartments WHERE apartment_code = ?`,
                        [apartmentCode.toString().trim()]
                    );

                    if (apartments.length === 0) {
                        errors.push(`Căn hộ ${apartmentCode} không tồn tại.`);
                        errorCount++;
                        continue;
                    }

                    // Find resident by name in that apartment (owner first)
                    let residentId = null;
                    if (ownerName) {
                        const [residents] = await db.execute(
                            `SELECT id FROM residents WHERE apartment_id = ? AND full_name LIKE ? ORDER BY role = 'owner' DESC LIMIT 1`,
                            [apartments[0].id, `%${ownerName.toString().trim()}%`]
                        );
                        if (residents.length > 0) {
                            residentId = residents[0].id;
                        }
                    }

                    // If no resident found, get apartment owner
                    if (!residentId) {
                        const [owners] = await db.execute(
                            `SELECT id FROM residents WHERE apartment_id = ? AND role = 'owner' LIMIT 1`,
                            [apartments[0].id]
                        );
                        if (owners.length > 0) {
                            residentId = owners[0].id;
                        }
                    }

                    if (!residentId) {
                        errors.push(`Không tìm thấy cư dân cho căn hộ ${apartmentCode}.`);
                        errorCount++;
                        continue;
                    }

                    // Create vehicle
                    await Vehicle.create({
                        resident_id: residentId,
                        apartment_id: apartments[0].id,
                        vehicle_type: vehicleType.toString().trim(),
                        license_plate: licensePlate.toString().trim().toUpperCase(),
                        brand: brand ? brand.toString().trim() : null,
                        model: model ? model.toString().trim() : null,
                        status: status.toString().trim()
                    });

                    successCount++;

                } catch (err) {
                    console.error('Error importing row:', err);
                    errorCount++;
                    errors.push(`Lỗi dòng: ${err.message}`);
                }
            }

            res.json({
                success: true,
                message: `Import hoàn tất: ${successCount} thành công, ${errorCount} lỗi.`,
                successCount,
                errorCount,
                errors: errors.slice(0, 10) // Return max 10 errors
            });

        } catch (error) {
            console.error('Error importVehicles:', error);
            res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
};

module.exports = vehicleController;