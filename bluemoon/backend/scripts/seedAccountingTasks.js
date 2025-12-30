// File: backend/scripts/seedAccountingTasks.js
// Script thêm 10 dữ liệu mẫu cho bảng tiến độ công việc (accounting_tasks)
// Chạy: node bluemoon/backend/scripts/seedAccountingTasks.js

const db = require('../config/db');

async function seedAccountingTasks() {
    console.log('🚀 Starting Seed Accounting Tasks...\n');

    try {
        console.log('📋 Inserting 10 sample accounting tasks...\n');

        await db.query(`
            INSERT INTO accounting_tasks (title, description, task_type, category, period_type, period_value, start_date, due_date, assigned_to, assigned_by, status, priority, recurring_schedule_id, notes) VALUES

            -- 1. Thu phí quản lý tháng 12/2024
            ('Thu phí quản lý tháng 12/2024', 
             'Thu phí quản lý từ các căn hộ theo bảng giá quy định tháng 12/2024. Bao gồm phí dịch vụ, phí bảo trì, phí vệ sinh chung.', 
             'recurring', 'thu_phi', 'monthly', '2024-12', '2024-12-01', '2024-12-15', 
             NULL, NULL, 'completed', 'high', 1, 'Đã thu đủ 100% các căn hộ'),

            -- 2. Báo cáo thu chi tháng 1/2025
            ('Báo cáo thu chi tháng 1/2025', 
             'Tổng hợp báo cáo thu chi trong tháng 1/2025, bao gồm doanh thu từ phí quản lý, phí dịch vụ và các khoản chi phí vận hành.', 
             'recurring', 'bao_cao', 'monthly', '2025-01', '2025-01-25', '2025-02-05', 
             NULL, NULL, 'pending', 'medium', 2, 'Chờ số liệu cuối tháng'),

            -- 3. Quyết toán điện nước tháng 1/2025
            ('Quyết toán điện nước tháng 1/2025', 
             'Quyết toán tiền điện, nước cho các căn hộ tháng 1/2025 dựa trên chỉ số đồng hồ thực tế.', 
             'recurring', 'dien_nuoc', 'monthly', '2025-01', '2025-02-01', '2025-02-07', 
             NULL, NULL, 'pending', 'urgent', 3, 'Đọc chỉ số ngày 31/1'),

            -- 4. Kiểm kê tài sản quý 1/2025
            ('Kiểm kê tài sản quý 1/2025', 
             'Kiểm kê tài sản cố định của tòa nhà quý 1/2025: thang máy, máy bơm, hệ thống PCCC, camera an ninh...', 
             'recurring', 'kiem_ke', 'quarterly', 'Q1-2025', '2025-03-20', '2025-03-31', 
             NULL, NULL, 'pending', 'medium', 5, NULL),

            -- 5. Đối soát công nợ tháng 1/2025
            ('Đối soát công nợ tháng 1/2025', 
             'Đối soát toàn bộ công nợ phải thu, phải trả trong tháng 1/2025. Xác định các khoản nợ xấu cần xử lý.', 
             'manual', 'cong_no', 'monthly', '2025-01', '2025-01-28', '2025-02-05', 
             NULL, NULL, 'in_progress', 'high', NULL, 'Đang đối soát với ngân hàng'),

            -- 6. Thu phí gửi xe tháng 2/2025
            ('Thu phí gửi xe tháng 2/2025', 
             'Thu phí đỗ xe ô tô, xe máy tháng 2/2025 theo hợp đồng gửi xe của cư dân. Cập nhật danh sách xe mới đăng ký.', 
             'recurring', 'thu_phi', 'monthly', '2025-02', '2025-02-01', '2025-02-20', 
             NULL, NULL, 'pending', 'medium', 4, NULL),

            -- 7. Lập dự toán chi phí quý 2/2025
            ('Lập dự toán chi phí quý 2/2025', 
             'Xây dựng dự toán chi phí vận hành tòa nhà quý 2/2025. Bao gồm chi phí điện, nước, nhân sự, bảo trì thiết bị.', 
             'manual', 'bao_cao', 'quarterly', 'Q2-2025', '2025-03-01', '2025-03-20', 
             NULL, NULL, 'pending', 'high', NULL, 'Trình BQT phê duyệt trước 25/3'),

            -- 8. Thanh toán hóa đơn điện tòa nhà
            ('Thanh toán hóa đơn điện tòa nhà tháng 1/2025', 
             'Thanh toán hóa đơn tiền điện công cộng của tòa nhà tháng 1/2025 cho Điện lực. Deadline: 10/2/2025.', 
             'manual', 'dien_nuoc', 'monthly', '2025-01', '2025-02-01', '2025-02-10', 
             NULL, NULL, 'in_progress', 'urgent', NULL, 'Số tiền: 45,000,000 VNĐ'),

            -- 9. Rà soát hợp đồng thuê mặt bằng
            ('Rà soát hợp đồng thuê mặt bằng', 
             'Rà soát các hợp đồng cho thuê mặt bằng thương mại tầng 1. Kiểm tra các điều khoản, gia hạn và điều chỉnh giá thuê.', 
             'manual', 'khac', 'quarterly', 'Q1-2025', '2025-01-15', '2025-02-28', 
             NULL, NULL, 'in_progress', 'medium', NULL, 'Có 3 hợp đồng cần gia hạn'),

            -- 10. Chuẩn bị quyết toán thuế GTGT
            ('Chuẩn bị quyết toán thuế GTGT quý 4/2024', 
             'Chuẩn bị hồ sơ và số liệu cho quyết toán thuế GTGT quý 4/2024. Nộp tờ khai trước ngày 30/1/2025.', 
             'manual', 'khac', 'quarterly', 'Q4-2024', '2025-01-10', '2025-01-30', 
             NULL, NULL, 'completed', 'urgent', NULL, 'Đã nộp tờ khai đúng hạn')
        `);

        console.log('✅ 10 sample accounting tasks inserted successfully!\n');

        // Verify
        const [taskCount] = await db.query('SELECT COUNT(*) as count FROM accounting_tasks');
        console.log(`📊 Total accounting tasks in database: ${taskCount[0].count} records`);

        console.log('\n🎉 Seed complete!');

    } catch (error) {
        console.error('❌ Error seeding accounting tasks:', error.message);
        throw error;
    } finally {
        process.exit(0);
    }
}

// Run the seed
seedAccountingTasks();
