// File: backend/scripts/setupAccountingTables.js
// Script thiết lập database cho hệ thống Quản lý Kế toán
// Chạy: node bluemoon/backend/scripts/setupAccountingTables.js

const db = require('../config/db');

async function setupAccountingTables() {
    console.log('🚀 Starting Accounting Tables Setup...\n');

    try {
        // ==========================================
        // 1. TẠO BẢNG RECURRING_SCHEDULES
        // ==========================================
        console.log('📋 Creating recurring_schedules table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS recurring_schedules (
                id INT PRIMARY KEY AUTO_INCREMENT,
                
                title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề mẫu',
                description TEXT COMMENT 'Mô tả mẫu',
                category VARCHAR(50) COMMENT 'Danh mục: thu_phi, bao_cao, kiem_ke, cong_no, dien_nuoc, khac',
                
                frequency ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL COMMENT 'Tần suất',
                day_of_week TINYINT COMMENT '0-6 (Chủ nhật-Thứ 7) - cho weekly',
                day_of_month TINYINT COMMENT '1-31 - cho monthly',
                month_of_year TINYINT COMMENT '1-12 - cho yearly/quarterly',
                
                deadline_offset_days INT DEFAULT 7 COMMENT 'Số ngày từ khi tạo đến deadline',
                
                default_assignee INT COMMENT 'FK -> users.id - Người thực hiện mặc định',
                priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT 'Độ ưu tiên',
                
                is_active BOOLEAN DEFAULT TRUE COMMENT 'Lịch có đang hoạt động không',
                next_run_date DATE COMMENT 'Ngày chạy tiếp theo',
                last_run_date DATE COMMENT 'Lần chạy cuối',
                
                created_by INT COMMENT 'FK -> users.id - BQT tạo lịch',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_frequency (frequency),
                INDEX idx_is_active (is_active),
                INDEX idx_next_run_date (next_run_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch định kỳ tự động sinh công việc'
        `);
        console.log('✅ recurring_schedules table created!\n');

        // ==========================================
        // 2. TẠO BẢNG ACCOUNTING_TASKS  
        // ==========================================
        console.log('📋 Creating accounting_tasks table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS accounting_tasks (
                id INT PRIMARY KEY AUTO_INCREMENT,
                
                title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề công việc',
                description TEXT COMMENT 'Mô tả chi tiết',
                
                task_type ENUM('manual', 'recurring') DEFAULT 'manual' COMMENT 'Loại: thủ công/định kỳ',
                category VARCHAR(50) COMMENT 'Danh mục: thu_phi, bao_cao, kiem_ke, cong_no, dien_nuoc, khac',
                
                period_type ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') DEFAULT 'monthly' COMMENT 'Loại kỳ',
                period_value VARCHAR(20) COMMENT 'Giá trị kỳ: 2025-01, Q1-2025, 2025',
                start_date DATE COMMENT 'Ngày bắt đầu',
                due_date DATE NOT NULL COMMENT 'Deadline',
                completed_date DATETIME COMMENT 'Ngày hoàn thành thực tế',
                
                assigned_to INT COMMENT 'FK -> users.id (Kế toán được giao)',
                assigned_by INT COMMENT 'FK -> users.id (BQT giao việc)',
                status ENUM('pending', 'in_progress', 'review', 'completed', 'overdue') DEFAULT 'pending' COMMENT 'Trạng thái',
                priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT 'Độ ưu tiên',
                
                recurring_schedule_id INT COMMENT 'FK -> recurring_schedules.id',
                
                notes TEXT COMMENT 'Ghi chú thêm',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_status (status),
                INDEX idx_assigned_to (assigned_to),
                INDEX idx_due_date (due_date),
                INDEX idx_period_value (period_value),
                INDEX idx_category (category),
                INDEX idx_task_type (task_type),
                
                CONSTRAINT fk_task_recurring_schedule FOREIGN KEY (recurring_schedule_id) 
                    REFERENCES recurring_schedules(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Công việc kế toán'
        `);
        console.log('✅ accounting_tasks table created!\n');

        // ==========================================
        // 3. INSERT SAMPLE DATA - RECURRING SCHEDULES
        // ==========================================
        console.log('📋 Inserting sample recurring schedules...');

        // Check if data already exists
        const [existingSchedules] = await db.query('SELECT COUNT(*) as count FROM recurring_schedules');
        if (existingSchedules[0].count === 0) {
            await db.query(`
                INSERT INTO recurring_schedules (title, description, category, frequency, day_of_month, deadline_offset_days, priority, is_active, next_run_date) VALUES
                ('Thu phí quản lý hàng tháng', 'Thu phí quản lý từ các căn hộ theo bảng giá quy định. Bao gồm phí dịch vụ, phí bảo trì, phí vệ sinh.', 'thu_phi', 'monthly', 1, 15, 'high', TRUE, '2025-02-01'),
                ('Báo cáo thu chi tháng', 'Tổng hợp báo cáo thu chi trong tháng, bao gồm doanh thu, chi phí và lợi nhuận.', 'bao_cao', 'monthly', 25, 10, 'medium', TRUE, '2025-01-25'),
                ('Quyết toán điện nước', 'Quyết toán tiền điện, nước cho các căn hộ dựa trên chỉ số đồng hồ.', 'dien_nuoc', 'monthly', 1, 7, 'urgent', TRUE, '2025-02-01'),
                ('Thu phí gửi xe hàng tháng', 'Thu phí đỗ xe ô tô, xe máy theo hợp đồng gửi xe của cư dân.', 'thu_phi', 'monthly', 1, 20, 'medium', TRUE, '2025-02-01'),
                ('Kiểm kê tài sản quý', 'Kiểm kê tài sản cố định của tòa nhà theo quý: thang máy, máy bơm, PCCC...', 'kiem_ke', 'quarterly', 20, 11, 'medium', TRUE, '2025-03-20'),
                ('Báo cáo tài chính năm', 'Lập báo cáo tài chính tổng hợp cả năm, chuẩn bị cho đại hội cư dân.', 'bao_cao', 'yearly', 15, 30, 'high', TRUE, '2026-01-15')
            `);
            console.log('✅ Sample recurring schedules inserted!\n');
        } else {
            console.log('⏭️  Recurring schedules already exist, skipping...\n');
        }

        // ==========================================
        // 4. INSERT SAMPLE DATA - ACCOUNTING TASKS
        // ==========================================
        console.log('📋 Inserting sample accounting tasks...');

        const [existingTasks] = await db.query('SELECT COUNT(*) as count FROM accounting_tasks');
        if (existingTasks[0].count === 0) {
            await db.query(`
                INSERT INTO accounting_tasks (title, description, task_type, category, period_type, period_value, start_date, due_date, status, priority, recurring_schedule_id, notes) VALUES
                ('Thu phí quản lý tháng 1/2025', 'Thu phí quản lý từ các căn hộ theo bảng giá quy định.', 'recurring', 'thu_phi', 'monthly', '2025-01', '2025-01-01', '2025-01-15', 'in_progress', 'high', 1, 'Đã thu được 75% số căn hộ'),
                ('Quyết toán điện nước T12/2024', 'Quyết toán tiền điện, nước cho các căn hộ.', 'recurring', 'dien_nuoc', 'monthly', '2024-12', '2025-01-01', '2025-01-07', 'in_progress', 'urgent', 3, 'Đang nhập liệu chỉ số'),
                ('Thu phí gửi xe tháng 1/2025', 'Thu phí đỗ xe ô tô, xe máy.', 'recurring', 'thu_phi', 'monthly', '2025-01', '2025-01-01', '2025-01-20', 'pending', 'medium', 4, NULL),
                ('Báo cáo thu chi tháng 12/2024', 'Tổng hợp báo cáo thu chi tháng 12.', 'recurring', 'bao_cao', 'monthly', '2024-12', '2024-12-25', '2025-01-05', 'review', 'medium', 2, 'Đã hoàn thành, chờ BQT duyệt'),
                ('Kiểm kê tài sản cuối năm 2024', 'Kiểm kê toàn bộ tài sản cố định cuối năm.', 'manual', 'kiem_ke', 'quarterly', 'Q4-2024', '2024-12-20', '2024-12-31', 'completed', 'medium', NULL, 'Hoàn thành đúng tiến độ'),
                ('Đối soát công nợ quý 4/2024', 'Đối soát toàn bộ công nợ phải thu, phải trả.', 'manual', 'cong_no', 'quarterly', 'Q4-2024', '2024-12-28', '2025-01-10', 'pending', 'high', NULL, 'Cần hoàn thành trước họp BQT'),
                ('Chuẩn bị tài liệu họp cư dân', 'Chuẩn bị tài liệu tài chính cho buổi họp đại hội cư dân đầu năm 2025.', 'manual', 'khac', 'yearly', '2025', '2025-01-05', '2025-01-15', 'pending', 'high', NULL, 'Bao gồm báo cáo tài chính và dự toán năm mới')
            `);
            console.log('✅ Sample accounting tasks inserted!\n');
        } else {
            console.log('⏭️  Accounting tasks already exist, skipping...\n');
        }

        // ==========================================
        // 5. VERIFY SETUP
        // ==========================================
        console.log('📊 Verifying setup...');
        const [scheduleCount] = await db.query('SELECT COUNT(*) as count FROM recurring_schedules');
        const [taskCount] = await db.query('SELECT COUNT(*) as count FROM accounting_tasks');

        console.log(`   - recurring_schedules: ${scheduleCount[0].count} records`);
        console.log(`   - accounting_tasks: ${taskCount[0].count} records`);

        console.log('\n🎉 Accounting Tables Setup Complete!');
        console.log('=====================================\n');

    } catch (error) {
        console.error('❌ Error setting up accounting tables:', error.message);
        throw error;
    } finally {
        // Close database connection
        process.exit(0);
    }
}

// Run the setup
setupAccountingTables();
