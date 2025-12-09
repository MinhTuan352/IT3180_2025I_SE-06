-- File: database/migrate_building_info.sql
-- Tạo bảng lưu thông tin tòa nhà

-- Bảng thông tin dự án (chỉ có 1 record)
CREATE TABLE IF NOT EXISTS building_info (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
) ENGINE=InnoDB;

-- Chèn dữ liệu mặc định
INSERT INTO building_info (id, name, investor, location, scale, apartments, description, total_area, start_date, finish_date, total_investment)
VALUES (
    1,
    'CHUNG CƯ BLUEMOON',
    'Tổng công ty CP Xuất nhập khẩu & Xây dựng Việt Nam (VINACONEX)',
    '289 Khuất Duy Tiến - Trung Hòa - Cầu Giấy - Hà Nội',
    'Cao 31 tầng, 03 tầng hầm, 04 tầng dịch vụ thương mại.',
    '216 căn hộ diện tích từ 86,5 - 113m2',
    'Tọa lạc tại vị trí đắc địa, Chung cư Bluemoon tiếp giáp với nút giao thông trung tâm Vành đai 3 - Đại lộ Thăng Long - Trần Duy Hưng.\n\nTHIẾT KẾ VÀ KIẾN TRÚC:\n• Thiết kế căn hộ thông minh, tối ưu hóa ánh sáng tự nhiên và thông gió\n• Không gian xanh được bố trí hài hòa với khu vườn trên cao và cây xanh ở hành lang\n• Hệ thống thang máy tốc độ cao, tiết kiệm năng lượng\n• Sảnh đón sang trọng với phong cách khách sạn 5 sao\n\nHỆ THỐNG TIỆN ÍCH ĐẲNG CẤP:\n• Siêu thị, trung tâm mua sắm ngay tại tầng thương mại\n• Phòng tập Gym & Spa hiện đại với trang thiết bị cao cấp\n• Bể bơi bốn mùa trên tầng thượng với view toàn thành phố\n• Nhà trẻ quốc tế, khu vui chơi an toàn cho trẻ em\n• Khu BBQ và sân vườn dành cho cộng đồng cư dân\n\nAN NINH VÀ AN TOÀN:\n• Hệ thống PCCC tự động hiện đại theo tiêu chuẩn quốc tế\n• Camera an ninh 24/7 tại tất cả khu vực công cộng\n• Bảo vệ chuyên nghiệp và kiểm soát ra vào bằng thẻ từ\n• Hầm đỗ xe thông minh với hệ thống cảm biến',
    '1,3 ha',
    'Quý IV/2016',
    'Quý IV/2018',
    '618,737 tỷ đồng'
) ON DUPLICATE KEY UPDATE id = id;

-- Bảng quy định tòa nhà
CREATE TABLE IF NOT EXISTS building_regulations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content JSON NOT NULL COMMENT 'Mảng các nội dung quy định',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Chèn dữ liệu mặc định cho quy định
INSERT INTO building_regulations (title, content, sort_order) VALUES
('1. Quy định về An ninh & Ra vào', '["Cư dân ra vào tòa nhà phải sử dụng Thẻ Cư Dân.", "Khách đến thăm phải đăng ký tại Quầy Lễ Tân hoặc bảo vệ sảnh.", "Không cho người lạ đi cùng vào thang máy hoặc khu vực hạn chế.", "Mọi hành vi gây mất trật tự, an ninh sẽ bị xử lý theo quy định."]', 1),
('2. Quy định về Tiếng ồn & Giờ giấc', '["Giờ yên tĩnh: Từ 22:00 đến 07:00 sáng hôm sau và 12:00 đến 13:30 trưa.", "Việc thi công sửa chữa chỉ được phép thực hiện trong giờ hành chính (8:00 - 17:00) từ Thứ 2 đến Thứ 6 và sáng Thứ 7.", "Vui lòng không gây tiếng ồn lớn, mở nhạc to ảnh hưởng đến các căn hộ lân cận."]', 2),
('3. Quy định về Vệ sinh & Rác thải', '["Rác thải sinh hoạt phải được phân loại và bỏ vào túi kín trước khi cho vào phòng rác/ống rác.", "Không để rác, giày dép, vật dụng cá nhân tại hành lang chung.", "Cấm vứt tàn thuốc, rác thải từ ban công xuống dưới.", "Rác cồng kềnh (nội thất, xà bần) phải đăng ký với BQL để vận chuyển riêng."]', 3),
('4. Quy định về Phòng cháy Chữa cháy (PCCC)', '["Tuyệt đối không hút thuốc tại các khu vực chung, cầu thang bộ, thang máy.", "Không đốt vàng mã tại ban công hoặc hành lang (chỉ đốt tại khu vực quy định của tòa nhà).", "Không chặn cửa thoát hiểm, không để đồ vật cản trở lối đi PCCC.", "Tham gia đầy đủ các buổi diễn tập PCCC định kỳ do BQL tổ chức."]', 4),
('5. Quy định về Thú cưng', '["Cư dân nuôi thú cưng phải đăng ký với Ban Quản Lý.", "Khi đưa thú cưng ra khu vực công cộng phải có dây xích, rọ mõm và người dắt.", "Tuyệt đối giữ vệ sinh chung, chủ nuôi phải dọn dẹp chất thải của thú cưng ngay lập tức.", "Không để thú cưng gây ồn ào ảnh hưởng đến người xung quanh."]', 5);
