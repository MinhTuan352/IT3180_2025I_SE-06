-- File: database/migrate_access_logs.sql
-- Chạy script này để thêm/sửa bảng access_logs

USE bluemoon_db;

-- Xóa bảng cũ nếu có (để tạo lại đúng cấu trúc)
DROP TABLE IF EXISTS access_logs;

-- Tạo bảng mới
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

-- Thêm dữ liệu mẫu
INSERT INTO access_logs (plate_number, vehicle_type, direction, gate, status, resident_id, note, created_at) VALUES
('29A-12345', 'Ô tô', 'In', 'Cổng A', 'Normal', 'R0001', 'Cư dân A-101', NOW() - INTERVAL 3 HOUR),
('29X1-23456', 'Xe máy', 'In', 'Cổng B', 'Normal', 'R0001', 'Cư dân A-101', NOW() - INTERVAL 2 HOUR),
('30G-98765', 'Ô tô', 'Out', 'Hầm B1', 'Normal', 'R0003', 'Cư dân B-205', NOW() - INTERVAL 1 HOUR),
('51G-99999', 'Ô tô', 'In', 'Cổng A', 'Warning', NULL, 'Xe lạ chưa đăng ký', NOW() - INTERVAL 30 MINUTE);

SELECT 'Done! Table access_logs created successfully.' AS result;
