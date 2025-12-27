-- File: database/migrate_profile_edit_requests.sql
-- Migration: Thêm bảng yêu cầu chỉnh sửa thông tin cư dân

USE bluemoon_db;

-- Tạo bảng profile_edit_requests
CREATE TABLE IF NOT EXISTS profile_edit_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resident_id VARCHAR(20) NOT NULL,
    requested_changes JSON NOT NULL COMMENT 'Dữ liệu muốn thay đổi {field: newValue}',
    reason TEXT COMMENT 'Lý do yêu cầu chỉnh sửa',
    status ENUM('Chờ duyệt', 'Đã duyệt', 'Từ chối') DEFAULT 'Chờ duyệt',
    admin_note TEXT COMMENT 'Ghi chú của BQT',
    processed_by VARCHAR(20) COMMENT 'User ID của admin xử lý',
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_resident (resident_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Thêm vài dữ liệu mẫu (optional)
-- INSERT INTO profile_edit_requests (resident_id, requested_changes, reason, status) VALUES
-- ('R0001', '{"phone": "0912345678", "email": "newemail@gmail.com"}', 'Đổi số điện thoại mới', 'Chờ duyệt');
