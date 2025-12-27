// File: backend/controllers/reportController.js

const xl = require('excel4node');
const Resident = require('../models/residentModel');
const Asset = require('../models/assetModel'); // Bạn cần đảm bảo model này đã có hàm getAll
const Vehicle = require('../models/vehicleModel');
const Fee = require('../models/feeModel');
const db = require('../config/db');

// Helper: Định dạng ngày tháng VN
const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
};

// Helper: Định dạng tiền tệ VNĐ
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};  

const reportController = {

    /**
     * [GET] /api/reports/residents
     * Xuất danh sách cư dân (Dành cho Công an / BQT)
     */
    exportResidentList: async (req, res) => {
        try {
            // 1. Lấy dữ liệu
            // Nếu là Công an (cqcn), lấy toàn bộ. Nếu là BQT, cũng lấy toàn bộ.
            const residents = await Resident.getAll({}); 

            // 2. Tạo Workbook & Worksheet
            const wb = new xl.Workbook();
            const ws = wb.addWorksheet('Danh Sách Cư Dân');

            // 3. Style
            const headerStyle = wb.createStyle({
                font: { bold: true, color: '#FFFFFF' },
                fill: { type: 'pattern', patternType: 'solid', fgColor: '#1F4E78' }
            });

            // 4. Tạo Header
            const headers = [
                'Mã Cư Dân', 'Họ Tên', 'Căn Hộ', 'Vai Trò', 'Quan Hệ Chủ Hộ', 
                'Ngày Sinh', 'Giới Tính', 'CCCD', 'Ngày Cấp', 'Nơi Cấp', 
                'SĐT', 'Trạng Thái'
            ];

            headers.forEach((header, i) => {
                ws.cell(1, i + 1).string(header).style(headerStyle);
            });

            // 5. Đổ dữ liệu
            residents.forEach((r, i) => {
                const row = i + 2;
                ws.cell(row, 1).string(r.id || '');
                ws.cell(row, 2).string(r.full_name || '');
                ws.cell(row, 3).string(r.apartment_code || '');
                ws.cell(row, 4).string(r.role === 'owner' ? 'Chủ hộ' : 'Thành viên');
                ws.cell(row, 5).string(r.relationship_with_owner || '');
                ws.cell(row, 6).string(formatDate(r.dob));
                ws.cell(row, 7).string(r.gender || '');
                ws.cell(row, 8).string(r.cccd || '');
                ws.cell(row, 9).string(formatDate(r.identity_date));
                ws.cell(row, 10).string(r.identity_place || '');
                ws.cell(row, 11).string(r.phone || '');
                ws.cell(row, 12).string(r.status || '');
            });

            // 6. Gửi file về Client
            wb.write('DanhSachCuDan.xlsx', res);

        } catch (error) {
            console.error('Export Resident Error:', error);
            res.status(500).json({ message: 'Lỗi khi xuất báo cáo.' });
        }
    },

    /**
     * [GET] /api/reports/assets
     * Xuất danh sách tài sản (Dành cho BQT)
     */
    exportAssetList: async (req, res) => {
        try {
            // Cần import Asset Model và gọi hàm getAll
            // Giả định Asset.getAll() trả về danh sách tài sản
            // Lưu ý: Nếu Asset Model chưa có hàm getAll, bạn cần bổ sung sau.
            const assets = await Asset.getAll({});

            const wb = new xl.Workbook();
            const ws = wb.addWorksheet('Danh Sách Tài Sản');

            const headerStyle = wb.createStyle({
                font: { bold: true, color: '#FFFFFF' },
                fill: { type: 'pattern', patternType: 'solid', fgColor: '#2E7D32' }
            });

            const headers = [
                'Mã TS', 'Tên Tài Sản', 'Vị Trí', 'Ngày Mua', 
                'Giá Trị', 'Trạng Thái', 'Bảo Trì Tiếp Theo'
            ];

            headers.forEach((header, i) => {
                ws.cell(1, i + 1).string(header).style(headerStyle);
            });

            assets.forEach((a, i) => {
                const row = i + 2;
                ws.cell(row, 1).string(a.asset_code || '');
                ws.cell(row, 2).string(a.name || '');
                ws.cell(row, 3).string(a.location || '');
                ws.cell(row, 4).string(formatDate(a.purchase_date));
                ws.cell(row, 4).number(Number(a.price) || 0).style({ numberFormat: '#,##0 ₫' });
                ws.cell(row, 6).string(a.status || '');
                const nextDate = a.next_maintenance_date ? new Date(a.next_maintenance_date).toLocaleDateString('vi-VN') : '';
                ws.cell(row, 7).string(nextDate);
            });

            wb.write('DanhSachTaiSan.xlsx', res);

        } catch (error) {
            console.error('Export Asset Error:', error);
            res.status(500).json({ message: 'Lỗi khi xuất báo cáo.' });
        }
    },

    /**
     * [GET] /api/reports/vehicles
     * Xuất danh sách phương tiện (Dành cho Bảo vệ/BQT)
     */
    exportVehicleList: async (req, res) => {
        try {
            const vehicles = await Vehicle.getAll({});

            const wb = new xl.Workbook();
            const ws = wb.addWorksheet('Danh Sách Xe');

            const headerStyle = wb.createStyle({
                font: { bold: true, color: '#FFFFFF' },
                fill: { type: 'pattern', patternType: 'solid', fgColor: '#C62828' }
            });

            const headers = [
                'Căn Hộ', 'Chủ Xe', 'Loại Xe', 'Biển Số', 
                'Hãng', 'Dòng Xe', 'Trạng Thái'
            ];

            headers.forEach((header, i) => {
                ws.cell(1, i + 1).string(header).style(headerStyle);
            });

            vehicles.forEach((v, i) => {
                const row = i + 2;
                ws.cell(row, 1).string(v.apartment_code || '');
                ws.cell(row, 2).string(v.owner_name || '');
                ws.cell(row, 3).string(v.vehicle_type || '');
                ws.cell(row, 4).string(v.license_plate || '');
                ws.cell(row, 5).string(v.brand || '');
                ws.cell(row, 6).string(v.model || '');
                ws.cell(row, 7).string(v.status || '');
            });

            wb.write('DanhSachXe.xlsx', res);

        } catch (error) {
            console.error('Export Vehicle Error:', error);
            res.status(500).json({ message: 'Lỗi khi xuất báo cáo.' });
        }
    },

    /**
     * [MỚI] [GET] /api/reports/fees
     * Xuất báo cáo công nợ / hóa đơn (Dành cho Kế toán)
     */
    exportFeeList: async (req, res) => {
        try {
            // Lấy tham số lọc từ URL (nếu muốn xuất theo tháng cụ thể)
            // VD: ?month=2025-12
            const filters = {};
            if (req.query.status) filters.status = req.query.status;
            // Lưu ý: Fee.getAllFees cần hỗ trợ lọc, ở đây ta lấy mặc định
            
            const fees = await Fee.getAllFees(filters);

            const wb = new xl.Workbook();
            const ws = wb.addWorksheet('Báo Cáo Công Nợ');

            const headerStyle = wb.createStyle({
                font: { bold: true, color: '#FFFFFF' },
                fill: { type: 'pattern', patternType: 'solid', fgColor: '#F9A825' } // Màu vàng cam
            });

            const headers = [
                'Mã HĐ', 'Căn Hộ', 'Kỳ TT', 'Loại Phí', 
                'Tổng Tiền', 'Đã Trả', 'Còn Nợ', 'Trạng Thái', 'Ngày Trả'
            ];
            headers.forEach((h, i) => ws.cell(1, i + 1).string(h).style(headerStyle));

            fees.forEach((f, i) => {
                const row = i + 2;
                ws.cell(row, 1).string(f.id || '');
                ws.cell(row, 2).string(f.apartment_code || '');
                ws.cell(row, 3).string(f.billing_period || '');
                ws.cell(row, 4).string(f.fee_name || '');
                
                ws.cell(row, 5).number(Number(f.total_amount) || 0).style({ numberFormat: '#,##0' });
                ws.cell(row, 6).number(Number(f.amount_paid) || 0).style({ numberFormat: '#,##0' });
                ws.cell(row, 7).number(Number(f.amount_remaining) || 0).style({ numberFormat: '#,##0', font: { color: f.amount_remaining > 0 ? 'red' : 'black' } });
                
                ws.cell(row, 8).string(f.status || '');
                
                const payDate = f.payment_date ? new Date(f.payment_date).toLocaleDateString('vi-VN') : '';
                ws.cell(row, 9).string(payDate);
            });

            wb.write('BaoCaoCongNo.xlsx', res);
        } catch (error) {
            console.error('Export Fee Error:', error);
            res.status(500).json({ message: 'Lỗi xuất báo cáo.' });
        }
    }
};

module.exports = reportController;