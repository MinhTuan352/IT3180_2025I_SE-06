-- File: backend/scripts/insert_sample_maintenance.sql
-- Script để tạo dữ liệu mẫu cho bảng maintenance_schedules
-- Chạy script này để kiểm tra hiển thị lịch sử bảo trì trên frontend

USE bluemoon_db;

-- Xóa dữ liệu cũ (nếu có) để test từ đầu
DELETE FROM maintenance_schedules WHERE asset_id IN (
    SELECT id FROM assets LIMIT 5
);

-- Lấy ID của tài sản đầu tiên để test
SET @asset1 = (SELECT id FROM assets ORDER BY id ASC LIMIT 1);
SET @asset2 = (SELECT id FROM assets ORDER BY id ASC LIMIT 1 OFFSET 1);

-- Insert lịch sử bảo trì ĐÃ HOÀN THÀNH (để hiển thị ở frontend)
INSERT INTO maintenance_schedules 
(asset_id, title, description, scheduled_date, completed_date, technician_name, cost, status, is_recurring, recurring_interval)
VALUES
-- Tài sản 1: Lịch sử bảo trì
(@asset1, 'Bảo trì định kỳ tháng 11/2024', 'Tra dầu, kiểm tra cáp thang máy, vệ sinh buồng', '2024-11-20', '2024-11-20', 'Kỹ thuật viên A - Công ty ABC', 500000, 'Hoàn thành', 1, 30),
(@asset1, 'Sửa chữa khẩn cấp', 'Thay nút bấm tầng 5 bị hỏng | Kết quả: Đã thay mới hoàn toàn', '2024-10-15', '2024-10-16', 'Công ty Thang máy XYZ', 2500000, 'Hoàn thành', 0, NULL),
(@asset1, 'Bảo trì định kỳ tháng 9/2024', 'Bảo dưỡng định kỳ: Kiểm tra hệ thống phanh, tra dầu mỡ | Kết quả: Mọi thứ hoạt động tốt', '2024-09-20', '2024-09-20', 'Kỹ thuật viên A - Công ty ABC', 500000, 'Hoàn thành', 1, 30),
(@asset1, 'Bảo trì định kỳ tháng 8/2024', 'Bảo dưỡng định kỳ: Làm vệ sinh, kiểm tra hệ thống điện | Kết quả: Phát hiện cáp điện bị mòn nhẹ, đã thay thế', '2024-08-20', '2024-08-21', 'Kỹ thuật viên B - Công ty ABC', 750000, 'Hoàn thành', 1, 30),

-- Tài sản 2: Lịch sử bảo trì
(@asset2, 'Kiểm tra an toàn PCCC', 'Kiểm định hệ thống báo cháy và hệ thống phun nước tự động | Kết quả: Hệ thống hoạt động bình thường', '2024-12-01', '2024-12-01', 'Đơn vị Kiểm định PCCC', 3000000, 'Hoàn thành', 0, NULL),
(@asset2, 'Bảo dưỡng định kỳ Q4/2024', 'Bảo dưỡng, vệ sinh hệ thống PCCC | Kết quả: Đạt yêu cầu', '2024-11-15', '2024-11-16', 'Công ty PCCC An Toàn', 1200000, 'Hoàn thành', 0, NULL);

-- Insert lịch BẢO TRÌ SẮP TỚI (Lên lịch) - Không hiển thị ở phần Lịch sử
INSERT INTO maintenance_schedules 
(asset_id, title, description, scheduled_date, technician_name, cost, status, is_recurring, recurring_interval)
VALUES
(@asset1, 'Bảo trì định kỳ tháng 1/2025', 'Bảo dưỡng định kỳ đầu năm: Kiểm tra toàn bộ hệ thống', '2025-01-20', 'Kỹ thuật viên A - Công ty ABC', 0, 'Lên lịch', 1, 30),
(@asset2, 'Kiểm định an toàn PCCC 6 tháng', 'Kiểm định định kỳ 6 tháng một lần theo quy định', '2025-06-01', 'Đơn vị Kiểm định PCCC', 0, 'Lên lịch', 1, 180);

-- Kiểm tra dữ liệu đã insert
SELECT 
    ms.id,
    a.name as asset_name,
    ms.title,
    ms.scheduled_date,
    ms.completed_date,
    ms.status,
    ms.cost
FROM maintenance_schedules ms
JOIN assets a ON ms.asset_id = a.id
ORDER BY ms.completed_date DESC, ms.scheduled_date DESC;

SELECT '✅ Đã insert dữ liệu mẫu cho bảng maintenance_schedules' as result;
