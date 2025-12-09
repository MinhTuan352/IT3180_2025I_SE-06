-- File: database/init.sql

-- ===================================
-- BLUE MOON APARTMENT MANAGEMENT SYSTEM
-- ===================================

-- 1. TẠO DATABASE
CREATE DATABASE IF NOT EXISTS bluemoon_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE bluemoon_db;

-- ===================================
-- 2. TẠO BẢNG
-- ===================================

-- 1. ROLES (VAI TRÒ)
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'bod, accountance, resident',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. USERS (TÀI KHOẢN ĐĂNG NHẬP)
CREATE TABLE users (
    id VARCHAR(20) PRIMARY KEY COMMENT 'ID0001, R0001',
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    refresh_token TEXT COMMENT 'JWT refresh token',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- 3. LOGIN_HISTORY (LỊCH SỬ ĐĂNG NHẬP)
CREATE TABLE login_history (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(20) NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. ADMINS (BQL & KẾ TOÁN - Profile chi tiết)
CREATE TABLE admins (
    id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    dob DATE,
    gender ENUM('Nam', 'Nữ', 'Khác'),
    cccd VARCHAR(12) UNIQUE,
    phone VARCHAR(15),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. APARTMENTS (CĂN HỘ)
CREATE TABLE apartments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    apartment_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'A-101, B-205',
    building VARCHAR(10) NOT NULL COMMENT 'A, B, C, D',
    floor INT NOT NULL,
    area DECIMAL(10,2),
    status ENUM('Đang sinh sống', 'Trống', 'Đang sửa chữa') DEFAULT 'Trống',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_apartment_code (apartment_code),
    INDEX idx_building (building)
) ENGINE=InnoDB;

-- 6. RESIDENTS (HỒ SƠ CƯ DÂN)
CREATE TABLE residents (
    id VARCHAR(20) PRIMARY KEY COMMENT 'R0001',
    user_id VARCHAR(20) UNIQUE COMMENT 'NULL nếu không có tài khoản',
    apartment_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('owner', 'member') NOT NULL COMMENT 'owner=chủ hộ, member=thành viên',
    dob DATE,
    gender ENUM('Nam', 'Nữ', 'Khác'),
    cccd VARCHAR(12) UNIQUE,
    phone VARCHAR(15),
    email VARCHAR(100),
    status ENUM('Đang sinh sống', 'Đã chuyển đi', 'Tạm vắng') DEFAULT 'Đang sinh sống',
    hometown VARCHAR(255),
    occupation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id),
    INDEX idx_apartment (apartment_id),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- 7. FEE_TYPES (LOẠI PHÍ)
CREATE TABLE fee_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fee_name VARCHAR(100) NOT NULL COMMENT 'Phí Quản lý, Phí Gửi xe',
    fee_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'PQL, PGX, PN, PD',
    default_price DECIMAL(15,2),
    unit VARCHAR(50) COMMENT 'Tháng, m³, kWh',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. FEES (HÓA ĐƠN/CÔNG NỢ)
CREATE TABLE fees (
    id VARCHAR(20) PRIMARY KEY COMMENT 'HD0001',
    apartment_id INT NOT NULL,
    resident_id VARCHAR(20) NOT NULL COMMENT 'Người thanh toán (thường là owner)',
    fee_type_id INT NOT NULL,
    description TEXT COMMENT 'PQL Tháng 10/2025',
    billing_period VARCHAR(20) COMMENT 'T10/2025',
    due_date DATE NOT NULL COMMENT 'Hạn thanh toán',
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(15,2) DEFAULT 0,
    amount_remaining DECIMAL(15,2) NOT NULL DEFAULT 0,
    status ENUM('Chưa thanh toán', 'Đã thanh toán', 'Quá hạn', 'Thanh toán một phần') DEFAULT 'Chưa thanh toán',
    payment_date DATE COMMENT 'Ngày thanh toán',
    payment_method VARCHAR(50) COMMENT 'Chuyển khoản, Tiền mặt',
    created_by VARCHAR(20) COMMENT 'ID Kế toán tạo hóa đơn',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id),
    FOREIGN KEY (resident_id) REFERENCES residents(id),
    FOREIGN KEY (fee_type_id) REFERENCES fee_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- 9. FEE_ITEMS (CHI TIẾT HÓA ĐƠN)
CREATE TABLE fee_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fee_id VARCHAR(20) NOT NULL,
    item_name VARCHAR(255) NOT NULL COMMENT 'Phí Quản lý T10/2025',
    unit VARCHAR(50) COMMENT 'Tháng, m³, Lần',
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL COMMENT 'quantity × unit_price',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. PAYMENT_HISTORY (LỊCH SỬ THANH TOÁN)
CREATE TABLE payment_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fee_id VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_date DATE NOT NULL,
    notes TEXT,
    processed_by VARCHAR(20) COMMENT 'Kế toán xác nhận',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 11. NOTIFICATION_TYPES (LOẠI THÔNG BÁO)
CREATE TABLE notification_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Khẩn cấp, Chung, Thu phí',
    type_code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 12. NOTIFICATIONS (THÔNG BÁO)
CREATE TABLE notifications (
    id VARCHAR(20) PRIMARY KEY COMMENT 'TB001',
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type_id INT NOT NULL,
    target ENUM('Tất cả Cư dân', 'Cá nhân', 'Theo tòa nhà', 'Theo căn hộ') DEFAULT 'Tất cả Cư dân',
    scheduled_at TIMESTAMP NULL COMMENT 'Hẹn giờ gửi, NULL = gửi ngay',
    is_sent BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (type_id) REFERENCES notification_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. NOTIFICATION_RECIPIENTS (NGƯỜI NHẬN)
CREATE TABLE notification_recipients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    notification_id VARCHAR(20) NOT NULL,
    recipient_id VARCHAR(20) NOT NULL COMMENT 'resident_id (R0001...)',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES residents(id) ON DELETE CASCADE,
    UNIQUE KEY uk_noti_recipient (notification_id, recipient_id)
) ENGINE=InnoDB;

-- 14. NOTIFICATION_ATTACHMENTS (FILE ĐÍNH KÈM)
CREATE TABLE notification_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    notification_id VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. REPORTS (SỰ CỐ)
CREATE TABLE reports (
    id VARCHAR(20) PRIMARY KEY COMMENT 'SC001',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    reported_by VARCHAR(20) NOT NULL COMMENT 'resident_id',
    status ENUM('Mới', 'Đang xử lý', 'Hoàn thành', 'Đã hủy') DEFAULT 'Mới',
    priority ENUM('Thấp', 'Trung bình', 'Cao', 'Khẩn cấp') DEFAULT 'Trung bình',
    assigned_to VARCHAR(20) COMMENT 'admin_id (user_id của bod) được giao xử lý',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    admin_response TEXT COMMENT 'Phản hồi chi tiết từ BQL',
    rating INT COMMENT 'Đánh giá sao (1-5)',
    feedback TEXT COMMENT 'Ý kiến cư dân sau khi sự cố được xử lý',
    completed_at TIMESTAMP NULL COMMENT 'Thời gian hoàn thành xử lý',
    FOREIGN KEY (reported_by) REFERENCES residents(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 16. REPORT_ATTACHMENTS (FILE SỰ CỐ)
CREATE TABLE report_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 17. VEHICLES (PHƯƠNG TIỆN - Bổ sung để khớp với Fee)
CREATE TABLE vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resident_id VARCHAR(20) NOT NULL,
    apartment_id INT NOT NULL,
    vehicle_type ENUM('Ô tô', 'Xe máy') NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    status ENUM('Đang sử dụng', 'Ngừng sử dụng') DEFAULT 'Đang sử dụng',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id)
) ENGINE=InnoDB;

-- 18. ASSETS (Danh sách tài sản chung cư)
CREATE TABLE assets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    asset_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'TS001, TS002',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) COMMENT 'Vị trí: Tầng hầm B1, Sảnh A',
    purchase_date DATE,
    price DECIMAL(15,2),
    status ENUM('Đang hoạt động', 'Đang bảo trì', 'Hỏng', 'Thanh lý') DEFAULT 'Đang hoạt động',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 19. MAINTENANCE_SCHEDULES (Lịch bảo trì & Lịch sử bảo trì)
CREATE TABLE maintenance_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    asset_id INT NOT NULL,
    title VARCHAR(255) NOT NULL COMMENT 'Bảo dưỡng định kỳ thang máy T10',
    description TEXT,
    scheduled_date DATE NOT NULL COMMENT 'Ngày dự kiến',
    completed_date DATE COMMENT 'Ngày thực tế hoàn thành',
    technician_name VARCHAR(255) COMMENT 'Đơn vị hoặc người thực hiện',
    cost DECIMAL(15,2) DEFAULT 0,
    status ENUM('Lên lịch', 'Đang thực hiện', 'Hoàn thành', 'Đã hủy') DEFAULT 'Lên lịch',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 20. SERVICE_TYPES (Loại dịch vụ: BBQ, Gym, Vệ sinh)
CREATE TABLE service_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(15,2) DEFAULT 0 COMMENT 'Giá cơ bản',
    unit VARCHAR(50) COMMENT 'Giờ, Lần, Người',
    is_active BOOLEAN DEFAULT TRUE,
    category VARCHAR(100) COMMENT 'Danh mục: Sức khỏe, Ăn uống...',
    location VARCHAR(255) COMMENT 'Vị trí: Tầng 3, Sảnh A...',
    open_hours VARCHAR(100) COMMENT 'Giờ mở cửa: 8:00 - 22:00',
    contact_phone VARCHAR(20) COMMENT 'Hotline dịch vụ',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 21. SERVICE_BOOKINGS (Đơn đặt dịch vụ của cư dân)
CREATE TABLE service_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resident_id VARCHAR(20) NOT NULL,
    service_type_id INT NOT NULL,
    booking_date DATETIME NOT NULL COMMENT 'Thời gian muốn sử dụng',
    quantity INT DEFAULT 1 COMMENT 'Số giờ hoặc số người',
    total_amount DECIMAL(15,2),
    status ENUM('Chờ duyệt', 'Đã duyệt', 'Đã hủy', 'Hoàn thành') DEFAULT 'Chờ duyệt',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id)
) ENGINE=InnoDB;

-- 22. SERVICE_ATTACHMENTS (File đính kèm dịch vụ)
CREATE TABLE service_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_type_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 23. VISITORS (Khách ra vào)
CREATE TABLE visitors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    apartment_id INT NOT NULL COMMENT 'Đến căn hộ nào',
    visitor_name VARCHAR(100) NOT NULL,
    identity_card VARCHAR(20) COMMENT 'CMND/CCCD',
    check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    check_out_time DATETIME,
    vehicle_plate VARCHAR(20),
    security_guard_id VARCHAR(20) COMMENT 'Bảo vệ ghi nhận (User ID)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id),
    FOREIGN KEY (security_guard_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 24. AUDIT_LOGS (Lịch sử hệ thống - QUAN TRỌNG)
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(20) COMMENT 'Ai làm?',
    action_type VARCHAR(50) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, LOGIN',
    entity_name VARCHAR(50) NOT NULL COMMENT 'Bảng bị tác động: residents, fees...',
    entity_id VARCHAR(50) NOT NULL COMMENT 'ID của dòng bị tác động',
    old_values JSON COMMENT 'Dữ liệu trước khi sửa',
    new_values JSON COMMENT 'Dữ liệu sau khi sửa',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_entity (entity_name, entity_id)
) ENGINE=InnoDB;

-- 25. ACCESS_LOGS (LỊCH SỬ RA VÀO - Quản lý xe cộ ra vào)
CREATE TABLE access_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plate_number VARCHAR(20) NOT NULL,
    vehicle_type ENUM('Ô tô', 'Xe máy') NOT NULL,
    direction ENUM('In', 'Out') NOT NULL COMMENT 'In=Vào, Out=Ra',
    gate VARCHAR(50) NOT NULL COMMENT 'Cổng A, Cổng B, Hầm B1',
    status ENUM('Normal', 'Warning', 'Alert') DEFAULT 'Normal',
    resident_id VARCHAR(20) NULL COMMENT 'NULL nếu xe lạ',
    note TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL,
    INDEX idx_plate (plate_number),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;


-- ===================================
-- 3. INSERT DATA (DỮ LIỆU MẪU)
-- ===================================

-- Roles
INSERT INTO roles (id, role_name, role_code) VALUES
(1, 'Ban Quản Trị', 'bod'),
(2, 'Kế Toán', 'accountance'),
(3, 'Cư Dân', 'resident'),
(4, 'Cơ Quan Chức Năng', 'cqcn');

-- Notification Types
INSERT INTO notification_types (type_name, type_code) VALUES
('Khẩn cấp', 'EMERGENCY'),
('Chung', 'GENERAL'),
('Thu phí', 'FEE');

-- Fee Types
INSERT INTO fee_types (fee_name, fee_code, default_price, unit) VALUES
('Phí Quản lý', 'PQL', 1200000, 'Tháng'),
('Phí Gửi xe', 'PGX', 1000000, 'Tháng'),
('Phí Nước', 'PN', 15000, 'm³'),
('Phí Điện', 'PD', 2500, 'kWh'),
('Sửa chữa', 'SC', 0, 'Lần');

-- Apartments
INSERT INTO apartments (apartment_code, building, floor, area, status) VALUES
('A-101', 'A', 1, 85.5, 'Đang sinh sống'),
('B-205', 'B', 2, 92.0, 'Đang sinh sống'),
('A-1503', 'A', 15, 110.5, 'Đang sinh sống'),
('B-404', 'B', 4, 78.0, 'Đang sinh sống');

-- Users & Admins (Password: password123 -> Hash mẫu)
INSERT INTO users (id, username, password, email, phone, role_id) VALUES
('ID0001', 'admin.a', '$2b$10$ukwGjOqP.ly7YnMCPGTh/O5NcY1Bc5Ye2syWyncT0/ojoL4PM.8oa', 'admin.a@bluemoon.com', '0900000001', 1),
('ID0002', 'ketoan.b', '$2b$10$ukwGjOqP.ly7YnMCPGTh/O5NcY1Bc5Ye2syWyncT0/ojoL4PM.8oa', 'ketoan.b@bluemoon.com', '0900000002', 2),
('R0001', 'chuho_a101', '$2b$10$ukwGjOqP.ly7YnMCPGTh/O5NcY1Bc5Ye2syWyncT0/ojoL4PM.8oa', 'chuho.a@bluemoon.com', '0900000011', 3),
('ID0003', 'cqcn.c', '$2b$10$ukwGjOqP.ly7YnMCPGTh/O5NcY1Bc5Ye2syWyncT0/ojoL4PM.8oa', 'cqcn.c@bluemoon.com', '0900000003', 4);

INSERT INTO admins (id, user_id, full_name, dob, gender, cccd, phone, email) VALUES
('ID0001', 'ID0001', 'Nguyễn Văn A', '1990-01-01', 'Nam', '012345678901', '0900000001', 'admin.a@bluemoon.com'),
('ID0002', 'ID0002', 'Nguyễn Văn B', '1992-05-10', 'Nam', '012345678902', '0900000002', 'ketoan.b@bluemoon.com'),
('ID0003', 'ID0003', 'Trần Thị C', '1988-03-15', 'Nữ', '012345678903', '0900000003', 'cqcn.c@bluemoon.com');

-- Residents
INSERT INTO residents (id, user_id, apartment_id, full_name, role, dob, gender, cccd, phone, email, status, hometown, occupation) VALUES
('R0001', 'R0001', 1, 'Trần Văn Hộ', 'owner', '1980-01-01', 'Nam', '012345678001', '0900000011', 'chuho.a@bluemoon.com', 'Đang sinh sống', 'Hà Nội', 'Kỹ sư'),
('R0002', NULL, 1, 'Nguyễn Thị Thành Viên', 'member', '1985-02-02', 'Nữ', '012345678002', '0900000012', 'thanhvien.a@bluemoon.com', 'Đang sinh sống', 'Hải Phòng', 'Giáo viên'),
('R0003', NULL, 2, 'Lê Gia Đình', 'owner', '1988-03-15', 'Nam', '012345678003', '0900000013', 'legiadinh@bluemoon.com', 'Đang sinh sống', 'Hà Nội', 'Kinh doanh'),
('R0004', NULL, 3, 'Phạm Văn B', 'owner', '1975-12-20', 'Nam', '012345678004', '0900000014', 'phamvanb@bluemoon.com', 'Đang sinh sống', 'TP.HCM', 'Bác sĩ'),
('R0005', NULL, 4, 'Hoàng Thị C', 'member', '1990-07-08', 'Nữ', '012345678005', '0900000015', 'hoangthic@bluemoon.com', 'Đang sinh sống', 'Đà Nẵng', 'Nhân viên văn phòng');

-- Vehicles
INSERT INTO vehicles (resident_id, apartment_id, vehicle_type, license_plate, brand, model, status) VALUES
('R0001', 1, 'Ô tô', '29A-12345', 'Toyota', 'Vios', 'Đang sử dụng'),
('R0001', 1, 'Xe máy', '29X1-23456', 'Honda', 'Air Blade', 'Đang sử dụng'),
('R0003', 2, 'Ô tô', '30G-98765', 'Mazda', 'CX-5', 'Đang sử dụng');

-- Fees
INSERT INTO fees (id, apartment_id, resident_id, fee_type_id, description, billing_period, due_date, total_amount, amount_paid, amount_remaining, status, payment_date, created_by) VALUES
('HD0001', 1, 'R0001', 1, 'PQL Tháng 10/2025', 'T10/2025', '2025-10-15', 1200000, 1200000, 0, 'Đã thanh toán', '2025-10-10', 'ID0002'),
('HD0002', 1, 'R0001', 2, 'Xe ô tô BKS 29A-12345', 'T10/2025', '2025-10-15', 1000000, 0, 1000000, 'Chưa thanh toán', NULL, 'ID0002'),
('HD0003', 2, 'R0003', 1, 'PQL Tháng 09/2025', 'T09/2025', '2025-09-15', 1500000, 0, 1500000, 'Quá hạn', NULL, 'ID0002'),
('HD0004', 3, 'R0004', 3, 'Tiền nước T09 (25m³)', 'T09/2025', '2025-10-05', 350000, 350000, 0, 'Đã thanh toán', '2025-10-01', 'ID0002'),
('HD0005', 4, 'R0005', 5, 'Sửa rò rỉ ống nước', 'T10/2025', '2025-10-20', 800000, 400000, 400000, 'Thanh toán một phần', NULL, 'ID0002');

-- Fee Items
INSERT INTO fee_items (fee_id, item_name, unit, quantity, unit_price, amount) VALUES
('HD0001', 'Phí Quản lý T10/2025', 'Tháng', 1, 1200000, 1200000),
('HD0002', 'Phí Gửi xe T10/2025 (Xe 29A-12345)', 'Tháng', 1, 1000000, 1000000),
('HD0003', 'Phí Quản lý T09/2025', 'Tháng', 1, 1500000, 1500000),
('HD0004', 'Tiền nước T09', 'm³', 25, 14000, 350000),
('HD0005', 'Công sửa chữa ống nước', 'Lần', 1, 500000, 500000),
('HD0005', 'Vật tư thay thế', 'Lần', 1, 300000, 300000);

-- Payment History
INSERT INTO payment_history (fee_id, amount, payment_method, payment_date, processed_by) VALUES
('HD0001', 1200000, 'Chuyển khoản', '2025-10-10', 'ID0002'),
('HD0004', 350000, 'Tiền mặt', '2025-10-01', 'ID0002'),
('HD0005', 400000, 'Chuyển khoản', '2025-10-15', 'ID0002');

-- Notifications
INSERT INTO notifications (id, title, content, type_id, target, scheduled_at, is_sent, created_by, created_at) VALUES
('TB001', 'Thông báo lịch cắt điện Tòa A', 'Do sự cố đột xuất tại trạm biến áp, Tòa A sẽ tạm ngưng cung cấp điện từ 14:00 đến 15:00 ngày 28/10/2025 để khắc phục. Mong quý cư dân thông cảm.', 1, 'Tất cả Cư dân', NULL, TRUE, 'ID0001', '2025-10-28 10:30:00'),
('TB002', 'Thông báo họp tổ dân phố Quý 4', 'Kính gửi quý cư dân, Ban quản trị thông báo cuộc họp tổ dân phố Quý 4/2025 sẽ diễn ra vào 14h ngày 05/11/2025 tại sảnh tầng 1.', 2, 'Tất cả Cư dân', NULL, TRUE, 'ID0001', '2025-10-27 15:00:00'),
('TB003', 'Nhắc nhở đóng phí quản lý T10/2025', 'Kính gửi quý cư dân, đến hạn thanh toán phí quản lý tháng 10/2025. Xin vui lòng thanh toán trước ngày 15/10/2025.', 3, 'Cá nhân', NULL, TRUE, 'ID0002', '2025-10-25 09:00:00'),
('TB004', 'Thông báo lịch phun thuốc muỗi (Hẹn giờ)', 'Chung cư sẽ tiến hành phun thuốc diệt muỗi vào 9h sáng ngày 30/10/2025. Đề nghị cư dân đóng cửa sổ.', 2, 'Tất cả Cư dân', '2025-10-30 09:00:00', FALSE, 'ID0001', '2025-10-24 11:00:00');

-- Notification Attachments
INSERT INTO notification_attachments (notification_id, file_name, file_path, file_size) VALUES
('TB001', 'SoDoTramBienAp.jpg', '/uploads/notifications/TB001/SoDoTramBienAp.jpg', 245632);

-- Notification Recipients
INSERT INTO notification_recipients (notification_id, recipient_id, is_read)
SELECT 'TB001', id, FALSE FROM residents;

-- Reports (Sự cố) - [ĐÃ SỬA LỖI: Thêm cột created_at]
INSERT INTO reports (id, title, description, location, reported_by, status, priority, created_at, admin_response, completed_at, rating, feedback) VALUES
('SC001', 'Vỡ ống nước khu vực hầm B2', 'Tôi phát hiện nước chảy thành dòng lớn ở hầm B2, khu vực cột 15. Đang ngập ra khu vực đỗ xe. Yêu cầu BQL xử lý khẩn cấp.', 'Hầm B2, cột 15', 'R0001', 'Mới', 'Khẩn cấp', '2025-10-28 09:00:00', 'Đã kiểm tra áp lực nước, bình thường.', '2025-10-28 18:00:00', 1, 'Vẫn còn yếu, BQL trả lời cho có lệ.'),
('SC002', 'Thang máy sảnh B liên tục báo lỗi', 'Thang máy sảnh B (thang chở hàng) đi từ tầng 1 lên tầng 10 thì bị dừng đột ngột và báo lỗi "DOOR_ERR". Phải đợi 5 phút mới mở cửa được. Yêu cầu BQL kiểm tra gấp.', 'Thang máy B, Tòa B', 'R0003', 'Đang xử lý', 'Cao', '2025-10-27 14:30:00', 'Đã sửa xong, thang máy có thể hoạt động bình thường.', '2025-10-27 14:40:00', 5, 'Xử lý rất nhanh, thang máy đã chạy bình thường'),
('SC003', 'Bóng đèn hành lang tầng 15 Tòa A bị cháy', 'Bóng đèn hành lang tầng 15 Tòa A đã cháy từ 2 ngày nay, ban đêm rất tối.', 'Hành lang Tầng 15, Tòa A', 'R0004', 'Hoàn thành', 'Trung bình', '2025-10-27 11:00:00', 'Đã thay bóng đèn mới.', '2025-10-28 16:00:00', 1, 'Phản hồi rất muộn.'),
('SC004', 'Tiếng ồn lạ từ máy phát điện', 'Tối qua khoảng 22h, tôi nghe thấy tiếng ồn lạ phát ra từ phòng kỹ thuật, có vẻ là từ máy phát điện.', 'Phòng kỹ thuật, Tầng G', 'R0005', 'Mới', 'Cao', '2025-10-26 22:00:00', 'Đã đến kiểm tra và không có tiếng ồn.', '2025-10-26 22:15:00', 4, 'Không phải tiếng ồn thật.');

INSERT INTO service_types (name, description, base_price, unit, is_active, category, location, open_hours, contact_phone) VALUES 
('BlueFit Gym & Yoga Center', 'Trung tâm thể hình đẳng cấp 5 sao với máy móc Technogym nhập khẩu Ý. Có bể bơi 4 mùa, xông hơi và các lớp Yoga miễn phí.', 500000, 'Tháng', TRUE, 'Sức khỏe & Làm đẹp', 'Tầng 3 - Tòa A', '05:30 - 22:00', '0901.234.567'),
('Siêu thị BlueMart (Đi chợ hộ)', 'Dịch vụ đi chợ hộ dành cho cư dân bận rộn. Phí dịch vụ tính trên một lần đi mua (chưa bao gồm tiền hàng hóa thực tế).', 30000, 'Lần', TRUE, 'Tiện ích đời sống', 'Tầng 1 - Tòa B', '07:00 - 21:00', '0909.888.999'),
('Moonlight Coffee & Lounge', 'Thuê phòng VIP để họp nhóm, tiếp khách hoặc làm việc. Không gian yên tĩnh, view panorama toàn thành phố.', 200000, 'Giờ', TRUE, 'Ẩm thực & Giải trí', 'Tầng Thượng (Rooftop)', '08:00 - 23:00', '0912.333.444'),
('Trường Mầm non Little Stars', 'Môi trường giáo dục chuẩn quốc tế, giáo viên bản ngữ. Đăng ký giữ chỗ hoặc tham quan trường cho bé.', 8500000, 'Tháng', TRUE, 'Giáo dục', 'Tầng 2 - Tòa C', '07:00 - 17:30', '024.3333.8888'),
('Nhà hàng Ẩm thực Á Đông', 'Đặt bàn tiệc gia đình, sinh nhật, tất niên. Thực đơn phong phú 3 miền. Giá tham khảo cho bàn 6 người.', 3500000, 'Bàn', TRUE, 'Ẩm thực & Giải trí', 'Tầng 1 - Tòa D', '10:00 - 22:00', '0988.777.666'),
('Khu vui chơi KidzWorld', 'Thiên đường vui chơi cho trẻ em với nhà bóng, cầu trượt, khu hướng nghiệp. Giá vé ưu đãi cho cư dân.', 120000, 'Vé', TRUE, 'Giải trí', 'Tầng 2 - Trung tâm thương mại', '09:00 - 21:30', '0905.111.222');

-- B. Dữ liệu Bookings (Giả định ID Service chạy từ 1->6 do vừa Reset bảng)
-- R0001 đặt Gym 1 tháng
INSERT INTO service_bookings (resident_id, service_type_id, booking_date, quantity, total_amount, status, note)
VALUES ('R0001', 1, '2025-12-01 08:00:00', 1, 500000, 'Đã duyệt', 'Gia hạn thẻ tập tháng 12');

-- R0002 đặt phòng họp 3 tiếng
INSERT INTO service_bookings (resident_id, service_type_id, booking_date, quantity, total_amount, status, note)
VALUES ('R0002', 3, '2025-12-15 14:00:00', 3, 600000, 'Hoàn thành', 'Họp team marketing, cần máy chiếu');

-- R0003 nhờ đi chợ hộ
INSERT INTO service_bookings (resident_id, service_type_id, booking_date, quantity, total_amount, status, note)
VALUES ('R0003', 2, NOW(), 1, 30000, 'Chờ duyệt', 'Mua giúp 2kg gạo ST25 và 1 vỉ trứng gà');

-- C. Dữ liệu Attachments (Ảnh chi tiết cho Gym)
INSERT INTO service_attachments (service_type_id, file_name, file_path, file_size) VALUES 
(1, 'gym_detail_1.jpg', '/uploads/services/gym_detail_1.jpg', 102400),
(1, 'gym_detail_2.jpg', '/uploads/services/gym_detail_2.jpg', 204800),
(1, 'gym_pool.jpg', '/uploads/services/gym_pool.jpg', 512000);

-- Mẫu Tài sản
INSERT INTO assets (asset_code, name, location, status) VALUES 
('TS001', 'Thang máy A1', 'Tòa A - Sảnh chính', 'Đang hoạt động'),
('TS002', 'Máy bơm PCCC số 1', 'Hầm B2', 'Đang hoạt động');

-- Thêm lịch bảo trì
INSERT INTO maintenance_schedules (asset_id, title, description, scheduled_date, status, technician_name, cost) VALUES 
(1, 'Bảo trì thang máy A1 Quý 4', 'Tra dầu, kiểm tra cáp, vệ sinh buồng máy', '2025-11-01', 'Lên lịch', 'Cty Thang máy Otis', 5000000),
(2, 'Sửa chữa máy bơm PCCC', 'Thay phớt máy bơm bị rò rỉ', '2025-10-20', 'Hoàn thành', 'Kỹ thuật tòa nhà', 200000);

-- Giả lập log admin sửa phí
INSERT INTO audit_logs (user_id, action_type, entity_name, entity_id, old_values, new_values, ip_address, user_agent) VALUES 
('ID0001', 'UPDATE', 'fees', 'HD0003', '{"total_amount": 1000000}', '{"total_amount": 1500000}', '192.168.1.10', 'Chrome/119.0.0.0'),
('ID0002', 'CREATE', 'assets', 'TS001', NULL, '{"asset_code": "TS001", "name": "Thang máy A1"}', '192.168.1.15', 'Firefox/100.0');

-- Dữ liệu mẫu Lịch sử Ra Vào (Access Logs)
INSERT INTO access_logs (plate_number, vehicle_type, direction, gate, status, resident_id, note, image_url, created_at) VALUES
('29A-12345', 'Ô tô', 'In', 'Cổng A', 'Normal', 'R0001', 'Cư dân A-101', NULL, NOW() - INTERVAL 3 HOUR),
('29X1-23456', 'Xe máy', 'In', 'Cổng B', 'Normal', 'R0001', 'Cư dân A-101', NULL, NOW() - INTERVAL 2 HOUR 30 MINUTE),
('30G-98765', 'Ô tô', 'Out', 'Hầm B1', 'Normal', 'R0003', 'Cư dân B-205', NULL, NOW() - INTERVAL 2 HOUR),
('29A-12345', 'Ô tô', 'Out', 'Cổng A', 'Normal', 'R0001', 'Cư dân A-101', NULL, NOW() - INTERVAL 1 HOUR 30 MINUTE),
('51G-99999', 'Ô tô', 'In', 'Cổng A', 'Warning', NULL, 'Xe lạ chưa đăng ký', NULL, NOW() - INTERVAL 1 HOUR),
('BLACKLIST', 'Xe máy', 'In', 'Cổng B', 'Alert', NULL, 'Biển số trong danh sách đen!', NULL, NOW() - INTERVAL 30 MINUTE),
('30G-98765', 'Ô tô', 'In', 'Cổng A', 'Normal', 'R0003', 'Cư dân B-205', NULL, NOW() - INTERVAL 15 MINUTE);