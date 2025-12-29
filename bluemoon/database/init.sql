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
-- 2. TẠO BẢNG (CORE SYSTEM)
-- ===================================

-- 1. ROLES (VAI TRÒ)
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'bod, accountance, resident, cqcn',
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
    building VARCHAR(10) NOT NULL COMMENT 'A, B',
    floor INT NOT NULL,
    area DECIMAL(10,2),
    status ENUM('Đang sinh sống', 'Trống', 'Đang sửa chữa') DEFAULT 'Trống',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_apartment_code (apartment_code),
    INDEX idx_building (building)
) ENGINE=InnoDB;

-- 6. RESIDENTS (HỒ SƠ CƯ DÂN & NHÂN KHẨU)
CREATE TABLE residents (
    id VARCHAR(20) PRIMARY KEY COMMENT 'R0001',
    user_id VARCHAR(20) UNIQUE COMMENT 'NULL nếu không có tài khoản',
    apartment_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('owner', 'member') NOT NULL COMMENT 'owner=chủ hộ, member=thành viên',
    relationship_with_owner VARCHAR(50) DEFAULT 'Chủ hộ' COMMENT 'Quan hệ với chủ hộ',
    dob DATE,
    gender ENUM('Nam', 'Nữ', 'Khác'),
    cccd VARCHAR(12) UNIQUE,
    identity_date DATE COMMENT 'Ngày cấp CCCD',
    identity_place VARCHAR(100) COMMENT 'Nơi cấp CCCD',
    phone VARCHAR(15),
    email VARCHAR(100),
    status ENUM('Đang sinh sống', 'Đã chuyển đi', 'Tạm vắng', 'Tạm trú') DEFAULT 'Đang sinh sống',
    hometown VARCHAR(255),
    occupation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id),
    INDEX idx_apartment (apartment_id),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- 7. TEMPORARY_RESIDENCE (KHAI BÁO TẠM TRÚ / TẠM VẮNG)
CREATE TABLE temporary_residence (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resident_id VARCHAR(20) NOT NULL,
    type ENUM('Tạm trú', 'Tạm vắng') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    attachments VARCHAR(500) COMMENT 'File ảnh giấy tờ scan',
    status ENUM('Chờ duyệt', 'Đã duyệt', 'Từ chối') DEFAULT 'Chờ duyệt',
    approved_by VARCHAR(20) COMMENT 'User ID của Admin duyệt',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- [MỚI] 8. RESIDENCE_HISTORY (LỊCH SỬ BIẾN ĐỘNG NHÂN KHẨU)
-- Dùng để xuất báo cáo HK01/HK02 cho công an
CREATE TABLE residence_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resident_id VARCHAR(20) NOT NULL,
    apartment_id INT NOT NULL,
    event_type ENUM('Chuyển đến', 'Chuyển đi', 'Tạm vắng', 'Tạm trú', 'Khai tử') NOT NULL,
    event_date DATE NOT NULL,
    note TEXT COMMENT 'Ghi chú chi tiết',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id)
) ENGINE=InnoDB;

-- ===================================
-- 3. MODULE TÀI CHÍNH & DỊCH VỤ
-- ===================================

-- 9. FEE_TYPES (LOẠI PHÍ)
CREATE TABLE fee_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fee_name VARCHAR(100) NOT NULL COMMENT 'Phí Quản lý, Phí Gửi xe',
    fee_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'PQL, PGX, PN, PD',
    default_price DECIMAL(15,2),
    unit VARCHAR(50) COMMENT 'Tháng, m³, kWh',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 10. FEES (HÓA ĐƠN/CÔNG NỢ)
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

-- 11. FEE_ITEMS (CHI TIẾT HÓA ĐƠN)
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

-- 12. PAYMENT_HISTORY (LỊCH SỬ THANH TOÁN)
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

-- [MỚI] 13. UTILITY_READINGS (CHỈ SỐ ĐIỆN NƯỚC)
-- Lưu chỉ số chốt hàng tháng để minh bạch hóa đơn
CREATE TABLE utility_readings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    apartment_id INT NOT NULL,
    service_type ENUM('Điện', 'Nước') NOT NULL,
    billing_period VARCHAR(20) NOT NULL COMMENT 'T10/2025',
    old_index DECIMAL(10,2) NOT NULL,
    new_index DECIMAL(10,2) NOT NULL,
    usage_amount DECIMAL(10,2) GENERATED ALWAYS AS (new_index - old_index) STORED COMMENT 'Số tiêu thụ',
    image_proof VARCHAR(500) COMMENT 'Ảnh chụp công tơ (nếu có)',
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id),
    UNIQUE KEY uk_reading (apartment_id, service_type, billing_period)
) ENGINE=InnoDB;

-- ===================================
-- 4. MODULE TIỆN ÍCH & VẬN HÀNH
-- ===================================

-- 14. NOTIFICATION_TYPES (LOẠI THÔNG BÁO)
CREATE TABLE notification_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Khẩn cấp, Chung, Thu phí',
    type_code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 15. NOTIFICATIONS (THÔNG BÁO)
CREATE TABLE notifications (
    id VARCHAR(20) PRIMARY KEY COMMENT 'TB001',
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type_id INT NOT NULL,
    target ENUM('Tất cả Cư dân', 'Cá nhân', 'Theo tòa nhà', 'Theo căn hộ') DEFAULT 'Tất cả Cư dân',
    target_value VARCHAR(255) COMMENT '[MỚI] Giá trị cụ thể: Tòa A, Tầng 15...',
    scheduled_at TIMESTAMP NULL COMMENT 'Hẹn giờ gửi, NULL = gửi ngay',
    is_sent BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (type_id) REFERENCES notification_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 16. NOTIFICATION_RECIPIENTS (NGƯỜI NHẬN)
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

-- 17. NOTIFICATION_ATTACHMENTS (FILE ĐÍNH KÈM)
CREATE TABLE notification_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    notification_id VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 18. REPORTS (SỰ CỐ)
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

-- 19. REPORT_ATTACHMENTS (FILE SỰ CỐ)
CREATE TABLE report_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 20. VEHICLES (PHƯƠNG TIỆN & GỬI XE)
-- [BỔ SUNG] Cột registration_date để tính phí theo ngày
CREATE TABLE vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resident_id VARCHAR(20) NOT NULL,
    apartment_id INT NOT NULL,
    vehicle_type ENUM('Ô tô', 'Xe máy') NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    vehicle_image VARCHAR(500) COMMENT 'Ảnh chụp xe',
    registration_cert VARCHAR(500) COMMENT 'Ảnh đăng ký xe',
    registration_date DATE DEFAULT (CURRENT_DATE) COMMENT '[MỚI] Ngày bắt đầu tính phí',
    status ENUM('Đang sử dụng', 'Ngừng sử dụng', 'Chờ duyệt') DEFAULT 'Chờ duyệt',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id)
) ENGINE=InnoDB;

-- 21. ASSETS (TÀI SẢN CHUNG)
-- [BỔ SUNG] Thông tin bảo hành và nhà cung cấp
CREATE TABLE assets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    asset_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'TS001, TS002',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) COMMENT 'Vị trí: Tầng hầm B1, Sảnh A',
    purchase_date DATE,
    price DECIMAL(15,2),
    status ENUM('Đang hoạt động', 'Đang bảo trì', 'Hỏng', 'Thanh lý') DEFAULT 'Đang hoạt động',
    warranty_expiry_date DATE COMMENT '[MỚI] Hạn bảo hành',
    supplier_info TEXT COMMENT '[MỚI] Thông tin nhà cung cấp (SĐT, Tên)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 22. MAINTENANCE_SCHEDULES (LỊCH BẢO TRÌ)
-- [BỔ SUNG] Cơ chế lặp lại
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
    is_recurring BOOLEAN DEFAULT FALSE COMMENT '[MỚI] Có lặp lại định kỳ không',
    recurring_interval INT COMMENT '[MỚI] Số ngày lặp lại (ví dụ 30 ngày)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 23. SERVICE_TYPES (LOẠI DỊCH VỤ)
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

-- 24. SERVICE_BOOKINGS (ĐƠN ĐẶT DỊCH VỤ)
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

-- 25. SERVICE_ATTACHMENTS (FILE ĐÍNH KÈM)
CREATE TABLE service_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_type_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 26. VISITORS (KHÁCH RA VÀO)
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

-- 27. AUDIT_LOGS (LỊCH SỬ HỆ THỐNG)
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

-- 28. ACCESS_LOGS (LỊCH SỬ XE RA VÀO)
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

-- 28b. VEHICLE_BLACKLIST (DANH SÁCH ĐEN XE)
CREATE TABLE vehicle_blacklist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    license_plate VARCHAR(20) NOT NULL UNIQUE COMMENT 'Biển số xe cấm',
    reason VARCHAR(500) COMMENT 'Lý do đưa vào danh sách đen',
    added_by VARCHAR(20) COMMENT 'User ID của người thêm',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_plate (license_plate)
) ENGINE=InnoDB;

-- 29. BUILDING_INFO (THÔNG TIN TÒA NHÀ)
CREATE TABLE building_info (
    id INT PRIMARY KEY DEFAULT 1,
    name VARCHAR(255) NOT NULL DEFAULT 'CHUNG CƯ BLUEMOON',
    investor VARCHAR(255),
    location VARCHAR(500),
    scale VARCHAR(500),
    apartments VARCHAR(255),
    description TEXT,
    total_area VARCHAR(50),
    start_date VARCHAR(50),
    finish_date VARCHAR(50),
    total_investment VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 30. BUILDING_REGULATIONS (QUY ĐỊNH TÒA NHÀ)
CREATE TABLE building_regulations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content JSON NOT NULL COMMENT 'Mảng các nội dung quy định',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 31. REVIEWS (ĐÁNH GIÁ & GÓP Ý)
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resident_id VARCHAR(20) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    survey_response JSON COMMENT 'Câu trả lời khảo sát',
    status ENUM('Mới', 'Đã xem') DEFAULT 'Mới',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 32. FUND_CAMPAIGNS (CHIẾN DỊCH GÓP QUỸ)
CREATE TABLE fund_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL COMMENT 'Tên quỹ: Quỹ Vaccine, Quỹ Vì người nghèo...',
    description TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    target_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Mục tiêu (0 = không giới hạn)',
    current_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Tổng tiền đã nhận (Tự động cộng dồn)',
    status ENUM('Active', 'Closed', 'Planned') DEFAULT 'Active',
    created_by VARCHAR(20) NOT NULL COMMENT 'ID Kế toán tạo (User ID)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 33. DONATIONS (CHI TIẾT ỦNG HỘ)
CREATE TABLE IF NOT EXISTS donations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    resident_id VARCHAR(20) NOT NULL COMMENT 'Link tới bảng residents',
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    payment_method ENUM('Cash', 'Transfer', 'AppPayment') DEFAULT 'AppPayment',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by VARCHAR(20) COMMENT 'User ID người thực hiện nhập liệu (Kế toán hoặc chính User)',
    note TEXT COMMENT 'Lời nhắn: Gia đình cháu A ủng hộ...',
    is_anonymous BOOLEAN DEFAULT FALSE COMMENT 'Ẩn danh trên sao kê công khai',
    FOREIGN KEY (campaign_id) REFERENCES fund_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;


-- Bảng Profile Edit Requests (Yêu cầu chỉnh sửa thông tin)
-- (Thường bị thiếu do quá trình edit trước đó)
CREATE TABLE IF NOT EXISTS profile_edit_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resident_id VARCHAR(20) NOT NULL,
    requested_changes JSON NOT NULL,
    reason TEXT,
    status ENUM('Chờ duyệt', 'Đã duyệt', 'Từ chối') DEFAULT 'Chờ duyệt',
    admin_note TEXT,
    processed_by VARCHAR(20),
    processed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);