-- ================================================
-- SCRIPT DROP TẤT CẢ BẢNG TRONG DATABASE BLUEMOON
-- ================================================
-- ⚠️ CẢNH BÁO: Script này sẽ XÓA TOÀN BỘ dữ liệu!
-- ⚠️ Chỉ chạy khi bạn muốn RESET database từ đầu!

-- Tắt foreign key checks để drop được các bảng có ràng buộc
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tất cả bảng theo thứ tự (từ child → parent)
DROP TABLE IF EXISTS notification_recipients;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS notification_types;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS donations;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS visitors;
DROP TABLE IF EXISTS temporary_residence;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS incident_reports;
DROP TABLE IF EXISTS service_requests;
DROP TABLE IF EXISTS payment_history;
DROP TABLE IF EXISTS fee_items;
DROP TABLE IF EXISTS fees;
DROP TABLE IF EXISTS fee_types;
DROP TABLE IF EXISTS utility_readings;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS residents;
DROP TABLE IF EXISTS apartments;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS buildings;

-- Bật lại foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Hiển thị kết quả
SELECT 'Đã xóa tất cả bảng thành công!' AS status;
SHOW TABLES;
