-- =====================================================
-- Script: Tạo bảng cho hệ thống Quản lý Kế toán
-- Gồm: accounting_tasks, recurring_schedules
-- =====================================================

-- Bảng 1: recurring_schedules (Lịch định kỳ) - Tạo trước vì accounting_tasks tham chiếu đến
CREATE TABLE IF NOT EXISTS recurring_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Thông tin công việc template
    title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề mẫu',
    description TEXT COMMENT 'Mô tả mẫu',
    category VARCHAR(50) COMMENT 'Danh mục: thu_phi, bao_cao, kiem_ke, cong_no, dien_nuoc, khac',
    
    -- Cấu hình chu kỳ
    frequency ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL COMMENT 'Tần suất',
    day_of_week TINYINT COMMENT '0-6 (Chủ nhật-Thứ 7) - cho weekly',
    day_of_month TINYINT COMMENT '1-31 - cho monthly',
    month_of_year TINYINT COMMENT '1-12 - cho yearly/quarterly',
    
    -- Deadline offset (tính từ ngày tạo)
    deadline_offset_days INT DEFAULT 7 COMMENT 'Số ngày từ khi tạo đến deadline',
    
    -- Phân công mặc định
    default_assignee VARCHAR(20) COMMENT 'FK -> users.id - Người thực hiện mặc định',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT 'Độ ưu tiên',
    
    -- Trạng thái
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Lịch có đang hoạt động không',
    next_run_date DATE COMMENT 'Ngày chạy tiếp theo',
    last_run_date DATE COMMENT 'Lần chạy cuối',
    
    -- Meta
    created_by VARCHAR(20) COMMENT 'FK -> users.id - BQT tạo lịch',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_frequency (frequency),
    INDEX idx_is_active (is_active),
    INDEX idx_next_run_date (next_run_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch định kỳ tự động sinh công việc';

-- Bảng 2: accounting_tasks (Công việc kế toán)
CREATE TABLE IF NOT EXISTS accounting_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Thông tin cơ bản
    title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề công việc',
    description TEXT COMMENT 'Mô tả chi tiết',
    
    -- Phân loại công việc
    task_type ENUM('manual', 'recurring') DEFAULT 'manual' COMMENT 'Loại: thủ công/định kỳ',
    category VARCHAR(50) COMMENT 'Danh mục: thu_phi, bao_cao, kiem_ke, cong_no, dien_nuoc, khac',
    
    -- Kỳ hạn & Thời gian
    period_type ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') DEFAULT 'monthly' COMMENT 'Loại kỳ',
    period_value VARCHAR(20) COMMENT 'Giá trị kỳ: 2025-01, Q1-2025, 2025',
    start_date DATE COMMENT 'Ngày bắt đầu',
    due_date DATE NOT NULL COMMENT 'Deadline',
    completed_date DATETIME COMMENT 'Ngày hoàn thành thực tế',
    
    -- Phân công & Trạng thái
    assigned_to VARCHAR(20) COMMENT 'FK -> users.id (Kế toán được giao)',
    assigned_by VARCHAR(20) COMMENT 'FK -> users.id (BQT giao việc)',
    status ENUM('pending', 'in_progress', 'review', 'completed', 'overdue') DEFAULT 'pending' COMMENT 'Trạng thái',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT 'Độ ưu tiên',
    
    -- Từ lịch định kỳ (nếu có)
    recurring_schedule_id INT COMMENT 'FK -> recurring_schedules.id',
    
    -- Meta
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Công việc kế toán';

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Sample recurring schedules (Lịch định kỳ mẫu)
INSERT INTO recurring_schedules (title, description, category, frequency, day_of_month, deadline_offset_days, default_assignee, priority, is_active, next_run_date, created_by) VALUES
('Thu phí quản lý hàng tháng', 'Thu phí quản lý từ các căn hộ theo bảng giá quy định. Bao gồm phí dịch vụ, phí bảo trì, phí vệ sinh.', 'thu_phi', 'monthly', 1, 15, NULL, 'high', TRUE, '2025-02-01', NULL),
('Báo cáo thu chi tháng', 'Tổng hợp báo cáo thu chi trong tháng, bao gồm doanh thu, chi phí và lợi nhuận.', 'bao_cao', 'monthly', 25, 10, NULL, 'medium', TRUE, '2025-01-25', NULL),
('Quyết toán điện nước', 'Quyết toán tiền điện, nước cho các căn hộ dựa trên chỉ số đồng hồ.', 'dien_nuoc', 'monthly', 1, 7, NULL, 'urgent', TRUE, '2025-02-01', NULL),
('Thu phí gửi xe hàng tháng', 'Thu phí đỗ xe ô tô, xe máy theo hợp đồng gửi xe của cư dân.', 'thu_phi', 'monthly', 1, 20, NULL, 'medium', TRUE, '2025-02-01', NULL),
('Kiểm kê tài sản quý', 'Kiểm kê tài sản cố định của tòa nhà theo quý: thang máy, máy bơm, PCCC...', 'kiem_ke', 'quarterly', 20, 11, NULL, 'medium', TRUE, '2025-03-20', NULL),
('Báo cáo tài chính năm', 'Lập báo cáo tài chính tổng hợp cả năm, chuẩn bị cho đại hội cư dân.', 'bao_cao', 'yearly', 15, 30, NULL, 'high', TRUE, '2026-01-15', NULL);

-- Sample accounting tasks (Công việc mẫu)
INSERT INTO accounting_tasks (title, description, task_type, category, period_type, period_value, start_date, due_date, assigned_to, assigned_by, status, priority, recurring_schedule_id, notes) VALUES
-- Công việc từ lịch định kỳ - Tháng 1/2025
('Thu phí quản lý tháng 1/2025', 'Thu phí quản lý từ các căn hộ theo bảng giá quy định. Bao gồm phí dịch vụ, phí bảo trì, phí vệ sinh.', 'recurring', 'thu_phi', 'monthly', '2025-01', '2025-01-01', '2025-01-15', NULL, NULL, 'in_progress', 'high', 1, 'Đã thu được 75% số căn hộ'),
('Quyết toán điện nước T12/2024', 'Quyết toán tiền điện, nước cho các căn hộ dựa trên chỉ số đồng hồ.', 'recurring', 'dien_nuoc', 'monthly', '2024-12', '2025-01-01', '2025-01-07', NULL, NULL, 'in_progress', 'urgent', 3, 'Đang nhập liệu chỉ số'),
('Thu phí gửi xe tháng 1/2025', 'Thu phí đỗ xe ô tô, xe máy theo hợp đồng gửi xe của cư dân.', 'recurring', 'thu_phi', 'monthly', '2025-01', '2025-01-01', '2025-01-20', NULL, NULL, 'pending', 'medium', 4, NULL),

-- Công việc từ lịch định kỳ - Tháng 12/2024
('Báo cáo thu chi tháng 12/2024', 'Tổng hợp báo cáo thu chi trong tháng 12, bao gồm doanh thu, chi phí và lợi nhuận.', 'recurring', 'bao_cao', 'monthly', '2024-12', '2024-12-25', '2025-01-05', NULL, NULL, 'review', 'medium', 2, 'Đã hoàn thành, chờ BQT duyệt'),

-- Công việc thủ công
('Kiểm kê tài sản cuối năm 2024', 'Kiểm kê toàn bộ tài sản cố định của tòa nhà cuối năm 2024.', 'manual', 'kiem_ke', 'quarterly', 'Q4-2024', '2024-12-20', '2024-12-31', NULL, NULL, 'completed', 'medium', NULL, 'Hoàn thành đúng tiến độ'),
('Đối soát công nợ quý 4/2024', 'Đối soát toàn bộ công nợ phải thu, phải trả trong quý 4/2024.', 'manual', 'cong_no', 'quarterly', 'Q4-2024', '2024-12-28', '2025-01-10', NULL, NULL, 'pending', 'high', NULL, 'Cần hoàn thành trước họp BQT'),
('Chuẩn bị tài liệu họp cư dân', 'Chuẩn bị tài liệu tài chính cho buổi họp đại hội cư dân đầu năm 2025.', 'manual', 'khac', 'yearly', '2025', '2025-01-05', '2025-01-15', NULL, NULL, 'pending', 'high', NULL, 'Bao gồm báo cáo tài chính và dự toán năm mới');

-- =====================================================
-- SHOW TABLES STATUS
-- =====================================================
SELECT 'recurring_schedules' as table_name, COUNT(*) as record_count FROM recurring_schedules
UNION ALL
SELECT 'accounting_tasks' as table_name, COUNT(*) as record_count FROM accounting_tasks;
