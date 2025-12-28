/**
 * SEEDING DATA GENERATOR - BLUEMOON (FINAL VERSION 3.0 - FIXED)
 * Fix: Sinh dữ liệu đầy đủ cho TOÀN BỘ 35 bảng.
 * Fix: Notification Attachments, Image Extensions.
 * Run: node database/generate_seeding.js
 */

const fs = require('fs');
const path = require('path');

// CẤU HÌNH
const OUTPUT_FILE = path.join(__dirname, 'bluemoon_full_data.sql');
const PASSWORD_HASH = '$2b$10$ukwGjOqP.ly7YnMCPGTh/O5NcY1Bc5Ye2syWyncT0/ojoL4PM.8oa'; // password123
const BUILDING_BLOCKS = ['A', 'B'];
const FLOORS = 31;
const ROOMS_PER_FLOOR = 8;
const TODAY = new Date();
const SIX_MONTHS_AGO = new Date(TODAY);
SIX_MONTHS_AGO.setMonth(TODAY.getMonth() - 6);
const SIX_MONTHS_LATER = new Date(TODAY);
SIX_MONTHS_LATER.setMonth(TODAY.getMonth() + 6);

// HELPER FUNCTIONS
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const formatDate = (date) => date.toISOString().slice(0, 19).replace('T', ' ');
const formatDateOnly = (date) => date.toISOString().slice(0, 10);
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Helper: Format DDMMYYYY cho ID
const toDDMMYYYY = (date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}${m}${y}`;
};

// Helper: ID Generator với Sequence reset theo ngày
const idSequences = {}; // { 'TB-29122025': 1, 'SC-29122025': 5 }
const generateDailyId = (prefix, dateObj) => {
    const dateStr = toDDMMYYYY(dateObj);
    const key = `${prefix}-${dateStr}`;
    if (!idSequences[key]) idSequences[key] = 0;
    idSequences[key]++;
    return `${prefix}-${dateStr}-${String(idSequences[key]).padStart(4, '0')}`;
};

// Helpers cho dữ liệu phong phú
const randomIP = () => `${randomInt(10, 200)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`;
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36'
];

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// DỮ LIỆU GIẢ LẬP VIỆT NAM
const FIRST_NAMES = ['An', 'Bình', 'Cường', 'Dũng', 'Giang', 'Hùng', 'Hương', 'Khánh', 'Lan', 'Minh', 'Ngọc', 'Phúc', 'Quân', 'Sơn', 'Thảo', 'Tuấn', 'Vân', 'Yến'];
const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ'];
const MIDDLE_NAMES = ['Văn', 'Thị', 'Đức', 'Thanh', 'Mạnh', 'Hữu', 'Kim', 'Ngọc', 'Minh'];
const genName = () => `${randomItem(LAST_NAMES)} ${randomItem(MIDDLE_NAMES)} ${randomItem(FIRST_NAMES)}`;
const genPhone = () => `09${randomInt(10000000, 99999999)}`;
const genCCCD = () => `0${randomInt(0, 9)}0${randomInt(1940, 2015)}${randomInt(100000, 999999)}`;

const stream = fs.createWriteStream(OUTPUT_FILE);

console.log('🚀 Đang khởi tạo dữ liệu Seeding (Full 35 Tables)...');

// --- HEADER ---
stream.write(`SET FOREIGN_KEY_CHECKS = 0;\n`);
stream.write(`SET NAMES 'utf8mb4';\n\n`);

// 1. TRUNCATE ALL TABLES
const tables = [
    'audit_logs', 'login_history', 'payment_history', 'fee_items', 'fees', 'utility_readings',
    'maintenance_schedules', 'assets', 'access_logs', 'vehicle_blacklist', 'vehicles', 
    'visitors', 'service_bookings', 'service_attachments', 'service_types', 
    'report_attachments', 'reports', 'notification_attachments', 'notification_recipients', 
    'notifications', 'notification_types', 'donations', 'fund_campaigns', 'reviews', 
    'profile_edit_requests', 'temporary_residence', 'residence_history', 
    'residents', 'admins', 'users', 'apartments', 'roles', 'fee_types', 
    'building_info', 'building_regulations'
];
tables.forEach(t => stream.write(`TRUNCATE TABLE ${t};\n`));
stream.write(`\n`);

// 2. STATIC DATA (Cấu hình & Admin)
console.log('- Sinh dữ liệu tĩnh...');
// Roles & Types
stream.write(`INSERT INTO roles (id, role_name, role_code) VALUES (1, 'Ban Quản Trị', 'bod'), (2, 'Kế Toán', 'accountance'), (3, 'Cư Dân', 'resident'), (4, 'Cơ Quan Chức Năng', 'cqcn');\n`);
stream.write(`INSERT INTO fee_types (id, fee_name, fee_code, default_price, unit) VALUES (1, 'Phí Quản lý', 'PQL', 7000, 'm²'), (2, 'Phí Gửi xe', 'PGX', 0, 'Tháng'), (3, 'Phí Điện', 'PD', 3000, 'kWh'), (4, 'Phí Nước', 'PN', 15000, 'm³');\n`);
stream.write(`INSERT INTO notification_types (id, type_name, type_code) VALUES (1, 'Khẩn cấp', 'EMERGENCY'), (2, 'Chung', 'GENERAL'), (3, 'Thu phí', 'FEE'), (4, 'Dịch vụ', 'SERVICE');\n`);
stream.write(`INSERT INTO service_types (name, description, base_price, unit, is_active, category, location, open_hours, contact_phone) VALUES 
('BlueFit Gym & Yoga Center', 'Trung tâm thể hình đẳng cấp 5 sao với máy móc Technogym nhập khẩu Ý. Có bể bơi 4 mùa, xông hơi và các lớp Yoga miễn phí.', 500000, 'Tháng', TRUE, 'Sức khỏe & Làm đẹp', 'Tầng 3 - Tòa A', '05:30 - 22:00', '0901.234.567'),
('Siêu thị BlueMart (Đi chợ hộ)', 'Dịch vụ đi chợ hộ dành cho cư dân bận rộn. Phí dịch vụ tính trên một lần đi mua (chưa bao gồm tiền hàng hóa thực tế).', 30000, 'Lần', TRUE, 'Tiện ích đời sống', 'Tầng 1 - Tòa B', '07:00 - 21:00', '0909.888.999'),
('Moonlight Coffee & Lounge', 'Thuê phòng VIP để họp nhóm, tiếp khách hoặc làm việc. Không gian yên tĩnh, view panorama toàn thành phố.', 200000, 'Giờ', TRUE, 'Ẩm thực & Giải trí', 'Tầng Thượng (Rooftop)', '08:00 - 23:00', '0912.333.444'),
('Trường Mầm non Little Stars', 'Môi trường giáo dục chuẩn quốc tế, giáo viên bản ngữ. Đăng ký giữ chỗ hoặc tham quan trường cho bé.', 8500000, 'Tháng', TRUE, 'Giáo dục', 'Tầng 2 - Tòa C', '07:00 - 17:30', '024.3333.8888'),
('Nhà hàng Ẩm thực Á Đông', 'Đặt bàn tiệc gia đình, sinh nhật, tất niên. Thực đơn phong phú 3 miền. Giá tham khảo cho bàn 6 người.', 3500000, 'Bàn', TRUE, 'Ẩm thực & Giải trí', 'Tầng 1 - Tòa D', '10:00 - 22:00', '0988.777.666'),
('Khu vui chơi KidzWorld', 'Thiên đường vui chơi cho trẻ em với nhà bóng, cầu trượt, khu hướng nghiệp. Giá vé ưu đãi cho cư dân.', 120000, 'Vé', TRUE, 'Giải trí', 'Tầng 2 - Trung tâm thương mại', '09:00 - 21:30', '0905.111.222');\n`);

// Building Info
stream.write(`INSERT INTO building_info (id, name, investor, location, scale, apartments, description, total_area, start_date, finish_date, total_investment)
VALUES (
    1,
    'CHUNG CƯ BLUEMOON',
    'Tổng công ty CP Xuất nhập khẩu & Xây dựng Việt Nam (VINACONEX)',
    '289 Khuất Duy Tiến - Trung Hòa - Cầu Giấy - Hà Nội',
    'Cao 31 tầng, 03 tầng hầm, 04 tầng dịch vụ thương mại.',
    '216 căn hộ diện tích từ 86,5 - 113m2',
    'Tọa lạc tại vị trí đắc địa, Chung cư Bluemoon tiếp giáp với nút giao thông trung tâm Vành đai 3 - Đại lộ Thăng Long - Trần Duy Hưng.\n\nTòa nhà được thiết kế với không gian sống xanh, hòa với thiên nhiên cùng hệ thống hạ tầng khớp nối đồng bộ. Tiện ích và dịch vụ hoàn hảo, khép kín phù hợp với nhu cầu đa dạng của các thế hệ trong gia đình: Siêu thị, dịch vụ spa, phòng tập gym, nhà trẻ...\n\nVới tiêu chí an toàn cho cư dân, tòa nhà có hệ thống PCCC tự động, hiện đại, hệ thống camera giám sát an ninh, hệ thống kiểm soát bảo vệ 24/24.',
    '1,3 ha',
    'Quý IV/2016',
    'Quý IV/2018',
    '618,737 tỷ đồng'
);\n`);
stream.write(`INSERT INTO building_regulations (title, content, sort_order) VALUES
('1. Quy định về An ninh & Ra vào', '["Cư dân ra vào tòa nhà phải sử dụng Thẻ Cư Dân.", "Khách đến thăm phải đăng ký tại Quầy Lễ Tân hoặc bảo vệ sảnh.", "Không cho người lạ đi cùng vào thang máy hoặc khu vực hạn chế.", "Mọi hành vi gây mất trật tự, an ninh sẽ bị xử lý theo quy định."]', 1),
('2. Quy định về Tiếng ồn & Giờ giấc', '["Giờ yên tĩnh: Từ 22:00 đến 07:00 sáng hôm sau và 12:00 đến 13:30 trưa.", "Việc thi công sửa chữa chỉ được phép thực hiện trong giờ hành chính (8:00 - 17:00) từ Thứ 2 đến Thứ 6 và sáng Thứ 7.", "Vui lòng không gây tiếng ồn lớn, mở nhạc to ảnh hưởng đến các căn hộ lân cận."]', 2),
('3. Quy định về Vệ sinh & Rác thải', '["Rác thải sinh hoạt phải được phân loại và bỏ vào túi kín trước khi cho vào phòng rác/ống rác.", "Không để rác, giày dép, vật dụng cá nhân tại hành lang chung.", "Cấm vứt tàn thuốc, rác thải từ ban công xuống dưới.", "Rác cồng kềnh (nội thất, xà bần) phải đăng ký với BQL để vận chuyển riêng."]', 3),
('4. Quy định về Phòng cháy Chữa cháy (PCCC)', '["Tuyệt đối không hút thuốc tại các khu vực chung, cầu thang bộ, thang máy.", "Không đốt vàng mã tại ban công hoặc hành lang (chỉ đốt tại khu vực quy định của tòa nhà).", "Không chặn cửa thoát hiểm, không để đồ vật cản trở lối đi PCCC.", "Tham gia đầy đủ các buổi diễn tập PCCC định kỳ do BQL tổ chức."]', 4),
('5. Quy định về Thú cưng', '["Cư dân nuôi thú cưng phải đăng ký với Ban Quản Lý.", "Khi đưa thú cưng ra khu vực công cộng phải có dây xích, rọ mõm và người dắt.", "Tuyệt đối giữ vệ sinh chung, chủ nuôi phải dọn dẹp chất thải của thú cưng ngay lập tức.", "Không để thú cưng gây ồn ào ảnh hưởng đến người xung quanh."]', 5);\n`);
stream.write(`INSERT INTO vehicle_blacklist (license_plate, reason, added_by) VALUES ('29A-CRIMINAL', 'Xe trộm cắp', 'ID0001'), ('30H-FAKE', 'Biển giả', 'ID0001'), ('14A-BLOCKED', 'Gây rối', 'ID0001'), ('51G-DEBT', 'Nợ phí', 'ID0002'), ('99X-DANGER', 'Hàng cấm', 'ID0001');\n`);

// Admin Users
stream.write(`INSERT INTO users (id, username, password, email, phone, role_id) VALUES 
('ID0001', 'admin.a', '${PASSWORD_HASH}', 'admin.a@bluemoon.com', '0901000001', 1),
('ID0002', 'ketoan.a', '${PASSWORD_HASH}', 'ketoan.b@bluemoon', '0901000002', 2),
('ID0003', 'cqcn.c', '${PASSWORD_HASH}', 'cqcn.c@bluemoon.com', '0901000003', 1);\n`); 

stream.write(`INSERT INTO admins (id, user_id, full_name, email) VALUES 
('ID0001', 'ID0001', 'Quản Trị Viên', 'admin.a@bluemoon.com'),
('ID0002', 'ID0002', 'Kế Toán Trưởng', 'ketoan.b@bluemoon.com'),
('ID0003', 'ID0003', 'Công An', 'cqcn.c@bluemoon.com');\n`);

// Login History cho Admin (30 ngày gần nhất)
for(let d=0; d<30; d++) {
    const loginTime = new Date(); loginTime.setDate(loginTime.getDate() - d);
    stream.write(`INSERT INTO login_history (user_id, login_time, ip_address, user_agent) VALUES ('ID0001', '${formatDate(loginTime)}', '192.168.1.10', 'Chrome Desktop');\n`);
    stream.write(`INSERT INTO login_history (user_id, login_time, ip_address, user_agent) VALUES ('ID0002', '${formatDate(loginTime)}', '192.168.1.11', 'Firefox Desktop');\n`);
    stream.write(`INSERT INTO login_history (user_id, login_time, ip_address, user_agent) VALUES ('ID0003', '${formatDate(loginTime)}', '192.168.1.12', 'Firefox Desktop');\n`);
}

// CORE: APARTMENTS & RESIDENTS (Main Loop)
console.log('- Sinh 496 căn hộ và cư dân (Core)...');
const activeResidents = []; // Lưu danh sách cư dân để dùng cho các bảng phụ
const activeUsers = ['ID0001', 'ID0002', 'ID0003']
const activeApartments = [];
let aptIdCounter = 1;
let residentIdCounter = 1;
let vehicleIdCounter = 1;

BUILDING_BLOCKS.forEach(block => {
    for (let floor = 1; floor <= FLOORS; floor++) {
        for (let room = 1; room <= ROOMS_PER_FLOOR; room++) {
            const aptCode = `${block}-${floor}${room < 10 ? '0' + room : room}`;
            const area = randomItem([85.5, 92.0, 105.0, 120.0]);
            const status = Math.random() < 0.7 ? 'Đang sinh sống' : 'Trống';
            const fullName = genName();

            stream.write(`INSERT INTO apartments (id, apartment_code, building, floor, area, status) VALUES (${aptIdCounter}, '${aptCode}', '${block}', ${floor}, ${area}, '${status}');\n`);

            if (status === 'Đang sinh sống') {
                activeApartments.push({ id: aptIdCounter, code: aptCode, area: area });
                // Ngày chuyển đến: Phải TRƯỚC 6 tháng để logic hóa đơn đúng (Điểm số 7)
                const moveInDate = randomDate(new Date(2023, 0, 1), SIX_MONTHS_AGO);

                // Chủ hộ
                const rId = `R${String(residentIdCounter).padStart(4, '0')}`;
                const username = `chuho_${aptCode.replace('-', '').toLowerCase()}`;
                
                const phone = genPhone();
                
                stream.write(`INSERT INTO users (id, username, password, email, phone, role_id) VALUES ('${rId}', '${username}', '${PASSWORD_HASH}', '${username}@gmail.com', '${phone}', 3);\n`);
                stream.write(`INSERT INTO residents (id, user_id, apartment_id, full_name, role, relationship_with_owner, phone, email, status, cccd) VALUES ('${rId}', '${rId}', ${aptIdCounter}, '${fullName}', 'owner', 'Chủ hộ', '${phone}', '${username}@gmail.com', 'Đang sinh sống', '${genCCCD()}');\n`);
                stream.write(`INSERT INTO residence_history (resident_id, apartment_id, event_type, event_date, note) VALUES ('${rId}', ${aptIdCounter}, 'Chuyển đến', '${formatDateOnly(moveInDate)}', 'Mua căn hộ');\n`);

                activeResidents.push({ id: rId, aptId: aptIdCounter, name: fullName });
                activeUsers.push(rId);
                const ownerId = rId;
                residentIdCounter++;

                // Login History cho Cư dân (Random)
                if (Math.random() < 0.3) {
                    stream.write(`INSERT INTO login_history (user_id, login_time, ip_address, user_agent) VALUES ('${rId}', '${formatDate(randomDate(SIX_MONTHS_AGO, TODAY))}', '14.162.1.1', 'Mobile App');\n`);
                }

                // 2.2 Sinh thành viên (0-4 người)
                const numMembers = randomInt(0, 4);
                for (let m = 0; m < numMembers; m++) {
                    const memId = `R${String(residentIdCounter).padStart(4, '0')}`;
                    const memName = genName();
                    const relation = randomItem(['Vợ', 'Chồng', 'Con', 'Bố', 'Mẹ']);
                    let memUserId = 'NULL';
                    
                    // 10% thành viên có tài khoản
                    if (Math.random() < 0.1) {
                        const memUser = `mem.${memId}`;
                        stream.write(`INSERT INTO users (id, username, password, email, phone, role_id) VALUES ('${memId}', '${memUser}', '${PASSWORD_HASH}', '${memUser}@gmail.com', '${genPhone()}', 3);\n`);
                        memUserId = `'${memId}'`;
                        
                        activeUsers.push(memId);
                    }

                    stream.write(`INSERT INTO residents (id, user_id, apartment_id, full_name, role, relationship_with_owner, status) VALUES ('${memId}', ${memUserId}, ${aptIdCounter}, '${memName}', 'member', '${relation}', 'Đang sinh sống');\n`);
                    residentIdCounter++;
                }

                // Xe cộ
                const numVehicles = randomInt(0, 3);
                const vehicles = [];
                for (let v = 0; v < numVehicles; v++) {
                    const type = Math.random() < 0.3 ? 'Ô tô' : 'Xe máy';
                    const plate = type === 'Ô tô' ? `30${randomItem(['A','E','F','G'])}-${randomInt(100,999)}.${randomInt(10,99)}` : `29${randomItem(['X','H','K','P'])}${randomInt(1,9)}-${randomInt(1000,9999)}`;
                    // Fix ảnh .jpg
                    const img = `/uploads/vehicles/${plate}_${Date.now()}.jpg`; 
                    if (type == 'Ô tô') brand = Math.random() < 0.2 ? 'Toyota' : (Math.random() < 0.25 ? 'Audi' : (Math.random() < 0.3 ? 'Mercedes' : (Math.random() < 0.5 ? 'Huyndai' : 'Ford')));
                    if (type == 'Xe máy') brand = Math.random() < 0.2 ? 'Exciter' : (Math.random() < 0.25 ? 'BMW' : (Math.random() < 0.3 ? 'VinFast' : (Math.random() < 0.5 ? 'Ducati' : 'Yamaha')));
                    stream.write(`INSERT INTO vehicles (id, resident_id, apartment_id, vehicle_type, license_plate, brand, status, vehicle_image) VALUES (${vehicleIdCounter}, '${ownerId}', ${aptIdCounter}, '${type}', '${plate}', '${brand}', 'Đang sử dụng', '${img}');\n`);
                    vehicles.push({ plate, type, brand });
                    vehicleIdCounter++;
                }

                // Phí & Vận hành (6 tháng)
                let elecIndex = randomInt(100, 1000);
                let waterIndex = randomInt(50, 500);

                for (let i = 5; i >= 0; i--) {
                    const monthDate = new Date(); monthDate.setMonth(monthDate.getMonth() - i);
                    const period = `T${monthDate.getMonth() + 1}/${monthDate.getFullYear()}`;
                    const feeSuffix = `${(monthDate.getMonth() + 1).toString().padStart(2,'0')}${monthDate.getFullYear()}`;
                    const billDate = formatDateOnly(new Date(monthDate.getFullYear(), monthDate.getMonth(), 5));

                    // Readings
                    const elec = randomInt(100, 300); const water = randomInt(10, 30);
                    stream.write(`INSERT INTO utility_readings (apartment_id, service_type, billing_period, old_index, new_index, recorded_date) VALUES (${aptIdCounter}, 'Điện', '${period}', ${elecIndex}, ${elecIndex+elec}, '${billDate}');\n`);
                    stream.write(`INSERT INTO utility_readings (apartment_id, service_type, billing_period, old_index, new_index, recorded_date) VALUES (${aptIdCounter}, 'Nước', '${period}', ${waterIndex}, ${waterIndex+water}, '${billDate}');\n`);
                    elecIndex += elec; waterIndex += water;

                    // 1. PHÍ QUẢN LÝ (PQL)
                    const idPQL = `PQL-${aptCode}-${feeSuffix}`;
                    const amtPQL = area * 7000;
                    let statPQL = i===0 && Math.random()<0.3 ? 'Chưa thanh toán' : 'Đã thanh toán';
                    stream.write(`INSERT INTO fees (id, apartment_id, resident_id, fee_type_id, description, billing_period, due_date, total_amount, amount_paid, amount_remaining, status) VALUES ('${idPQL}', ${aptIdCounter}, '${ownerId}', 1, 'Phí Quản Lý ${period}', '${period}', '${billDate}', ${amtPQL}, ${statPQL==='Đã thanh toán'?amtPQL:0}, ${statPQL!=='Đã thanh toán'?amtPQL:0}, '${statPQL}');\n`);
                    stream.write(`INSERT INTO fee_items (fee_id, item_name, unit, quantity, unit_price, amount) VALUES ('${idPQL}', 'PQL ${period}', 'm²', ${area}, 7000, ${amtPQL});\n`);

                    // 2. PHÍ GỬI XE (PGX)
                    const idPGX = `PGX-${aptCode}-${feeSuffix}`;
                    let amtPGX = 0;
                    // FIX: Thêm v => ... để sửa lỗi TypeError
                    vehicles.forEach(v => amtPGX += (v.type==='Ô tô' ? 1200000 : 70000));
                    
                    if (amtPGX > 0) {
                        let statPGX = i===0 && Math.random()<0.3 ? 'Chưa thanh toán' : 'Đã thanh toán';
                        stream.write(`INSERT INTO fees (id, apartment_id, resident_id, fee_type_id, description, billing_period, due_date, total_amount, amount_paid, amount_remaining, status) VALUES ('${idPGX}', ${aptIdCounter}, '${ownerId}', 2, 'Phí Gửi xe ${period}', '${period}', '${billDate}', ${amtPGX}, ${statPGX==='Đã thanh toán'?amtPGX:0}, ${statPGX!=='Đã thanh toán'?amtPGX:0}, '${statPGX}');\n`);
                        vehicles.forEach(v => {
                            const price = v.type==='Ô tô' ? 1200000 : 70000;
                            stream.write(`INSERT INTO fee_items (fee_id, item_name, unit, quantity, unit_price, amount) VALUES ('${idPGX}', 'Gửi xe ${v.plate}', 'Xe', 1, ${price}, ${price});\n`);
                        });
                    }

                    // 3. TIỀN ĐIỆN (PD)
                    const idPD = `PD-${aptCode}-${feeSuffix}`;
                    const amtPD = elec * 3000;
                    let statPD = i===0 && Math.random()<0.2 ? 'Chưa thanh toán' : 'Đã thanh toán';
                    stream.write(`INSERT INTO fees (id, apartment_id, resident_id, fee_type_id, description, billing_period, due_date, total_amount, amount_paid, amount_remaining, status) VALUES ('${idPD}', ${aptIdCounter}, '${ownerId}', 3, 'Tiền điện ${period}', '${period}', '${billDate}', ${amtPD}, ${statPD==='Đã thanh toán'?amtPD:0}, ${statPD!=='Đã thanh toán'?amtPD:0}, '${statPD}');\n`);
                    stream.write(`INSERT INTO fee_items (fee_id, item_name, unit, quantity, unit_price, amount) VALUES ('${idPD}', 'Điện sinh hoạt', 'kWh', ${elec}, 3000, ${amtPD});\n`);

                    // 4. TIỀN NƯỚC (PN)
                    const idPN = `PN-${aptCode}-${feeSuffix}`;
                    const amtPN = water * 15000;
                    let statPN = i===0 && Math.random()<0.2 ? 'Chưa thanh toán' : 'Đã thanh toán';
                    stream.write(`INSERT INTO fees (id, apartment_id, resident_id, fee_type_id, description, billing_period, due_date, total_amount, amount_paid, amount_remaining, status) VALUES ('${idPN}', ${aptIdCounter}, '${ownerId}', 4, 'Tiền nước ${period}', '${period}', '${billDate}', ${amtPN}, ${statPN==='Đã thanh toán'?amtPN:0}, ${statPN!=='Đã thanh toán'?amtPN:0}, '${statPN}');\n`);
                    stream.write(`INSERT INTO fee_items (fee_id, item_name, unit, quantity, unit_price, amount) VALUES ('${idPN}', 'Nước sinh hoạt', 'm³', ${water}, 15000, ${amtPN});\n`);
                }

                // 3.3 Access Logs (Nhật ký ra vào - Sinh cho tháng hiện tại dày đặc)
                // Logic Anti-passback: Out (Sáng) -> In (Chiều)
                vehicles.forEach(veh => {
                    for (let d = 1; d <= 30; d++) { // 30 ngày gần nhất
                        const logDate = new Date();
                        logDate.setDate(logDate.getDate() - d);
                        
                        // Sáng đi làm (Out)
                        logDate.setHours(5 + randomInt(0, 6), randomInt(0, 59));
                        stream.write(`INSERT INTO access_logs (plate_number, vehicle_type, direction, gate, status, resident_id, created_at, image_url) VALUES ('${veh.plate}', '${veh.type}', 'Out', 'Cổng A', 'Normal', '${ownerId}', '${formatDate(logDate)}', '/uploads/access/out.jpg');\n`);
                        
                        // Chiều về (In)
                        logDate.setHours(16 + randomInt(0, 6), randomInt(0, 59));
                        stream.write(`INSERT INTO access_logs (plate_number, vehicle_type, direction, gate, status, resident_id, created_at, image_url) VALUES ('${veh.plate}', '${veh.type}', 'In', 'Cổng A', 'Normal', '${ownerId}', '${formatDate(logDate)}', '/uploads/access/in.jpg');\n`);
                    }
                });
            } else if (status === 'Trống' && Math.random() < 0.1) {
                // --- HISTORICAL DATA (Cư dân cũ đã chuyển đi) ---
                const oldRId = `R_OLD_${aptIdCounter}`;
                stream.write(`INSERT INTO residents (id, user_id, apartment_id, full_name, role, status) VALUES ('${oldRId}', NULL, ${aptIdCounter}, '${fullName}', 'owner', 'Đã chuyển đi');\n`);
                stream.write(`INSERT INTO residence_history (resident_id, apartment_id, event_type, event_date, note) VALUES ('${oldRId}', ${aptIdCounter}, 'Chuyển đi', '${formatDateOnly(SIX_MONTHS_AGO)}', 'Hết hạn thuê');\n`);
            }
            aptIdCounter++;
        }
    }
});

// ==========================================================
// CÁC BẢNG PHỤ (FIXED MISSING DATA)
// ==========================================================

// --- LOGIN HISTORY (ALL USERS - RANDOM TIME/IP) ---
console.log('- Sinh Lịch sử đăng nhập phong phú...');
for(let i=0; i<3000; i++) { // 3000 logs
    const uId = randomItem(activeUsers);
    const time = randomDate(new Date(TODAY.getTime() - 86400000*30), TODAY); // 30 ngày gần nhất
    const ip = randomIP();
    const ua = randomItem(USER_AGENTS);
    stream.write(`INSERT INTO login_history (user_id, login_time, ip_address, user_agent) VALUES ('${uId}', '${formatDate(time)}', '${ip}', '${ua}');\n`);
}

// 4. NOTIFICATIONS & RECIPIENTS & ATTACHMENTS (FIXED)
console.log('- Sinh Thông báo & Sự cố (ID Reset Daily)...');

// --- NOTIFICATIONS ---
const NOTI_TEMPLATES = [
    { type: 1, title: 'Cắt điện bảo trì', prefix: 'TB' },
    { type: 2, title: 'Họp tổ dân phố', prefix: 'TB' },
    { type: 3, title: 'Nhắc đóng phí', prefix: 'TB' },
    { type: 2, title: 'Phun thuốc muỗi', prefix: 'TB' }
];

// Sinh 500 thông báo trong 6 tháng gần đây
for(let i=0; i<500; i++) {
    const tpl = randomItem(NOTI_TEMPLATES);
    const date = randomDate(SIX_MONTHS_AGO, new Date(TODAY.getTime() + 86400000*5)); // Quá khứ đến Tương lai 5 ngày
    const id = generateDailyId('TB', date);
    const isFuture = date > TODAY;
    
    stream.write(`INSERT INTO notifications (id, title, content, type_id, target, scheduled_at, is_sent, created_by, created_at) VALUES ('${id}', '${tpl.title} ${formatDateOnly(date)}', 'Nội dung chi tiết...', ${tpl.type}, 'Tất cả Cư dân', '${formatDate(date)}', ${isFuture?0:1}, 'ID0001', '${formatDate(date)}');\n`);
    
    // Random attachments
    if (Math.random() < 0.5) {
        stream.write(`INSERT INTO notification_attachments (notification_id, file_name, file_path, file_size) VALUES ('${id}', 'thongbao.jpg', '/uploads/notifications/${id}/tb.jpg', 1024);\n`);
    }
}

// 5. REPORTS & ATTACHMENTS (FIXED)
console.log('- Sinh sự cố và ảnh...');
const REPORT_TYPES = [
    { t: 'Vỡ ống nước', loc: 'Hầm B1', p: 'Khẩn cấp' },
    { t: 'Đèn hành lang nhấp nháy', loc: 'Hành lang', p: 'Thấp' },
    { t: 'Thang máy rung lắc', loc: 'Thang A1', p: 'Cao' },
    { t: 'Rác thải bừa bãi', loc: 'Sảnh thang bộ', p: 'Trung bình' },
    { t: 'Ồn ào sau 22h', loc: 'Căn hộ tầng trên', p: 'Trung bình' }
];
for(let i=0; i<40; i++) {
    const tpl = randomItem(REPORT_TYPES);
    const rId = randomItem(activeResidents);
    const date = randomDate(SIX_MONTHS_AGO, TODAY);
    const id = generateDailyId('SC', date);
    const status = randomItem(['Mới', 'Đang xử lý', 'Hoàn thành', 'Đã hủy']);
    
    stream.write(`INSERT INTO reports (id, title, description, location, reported_by, status, priority, created_at) VALUES ('${id}', '${tpl.t}', 'Mô tả chi tiết sự cố...', '${tpl.loc}', '${rId}', '${status}', '${tpl.p}', '${formatDate(date)}');\n`);
    // Random attachments
    if (Math.random() < 0.5) {
        stream.write(`INSERT INTO report_attachments (report_id, file_name, file_path, file_size) VALUES ('${id}', 'suco.jpg', '/uploads/reports/${id}/tb.jpg', 1024);\n`);
    }
}

// 6. PROFILE EDIT REQUESTS
console.log('- Sinh yêu cầu sửa thông tin...');
for(let i=0; i<15; i++) {
    const r = randomItem(activeResidents);
    const status = randomItem(['Chờ duyệt', 'Đã duyệt', 'Từ chối']);
    const phone = genPhone();
    const date = randomDate(SIX_MONTHS_AGO, TODAY);
    stream.write(`INSERT INTO profile_edit_requests (resident_id, requested_changes, reason, status, created_at) VALUES ('${r.id}', '{"phone": "${phone}"}', 'Đổi số điện thoại', '${status}', '${formatDate(date)}');\n`);
}

// 7. SERVICE BOOKINGS & ATTACHMENTS (FIXED)
console.log('- Sinh đặt dịch vụ...');
for(let i=0; i<20; i++) {
    const r = randomItem(activeResidents);
    const status = randomItem(['Chờ duyệt', 'Đã duyệt']);
    const type = Math.floor(Math.random() * 6) + 1;
    const date = randomDate(SIX_MONTHS_AGO, TODAY);
    stream.write(`INSERT INTO service_bookings (resident_id, service_type_id, booking_date, quantity, total_amount, status) VALUES ('${r.id}', ${type}, '${formatDate(date)}', 1, 500000, '${status}');\n`);
}
// Fix: Ảnh banner dịch vụ (.jpg)
stream.write(`INSERT INTO service_attachments (service_type_id, file_name, file_path) VALUES (1, 'gym-banner.jpg', '/uploads/services/1/gym-banner.jpg');\n`);
stream.write(`INSERT INTO service_attachments (service_type_id, file_name, file_path) VALUES (2, 'pool-banner.jpg', '/uploads/services/2/pool-banner.jpg');\n`);

// 8. TEMPORARY RESIDENCE
console.log('- Sinh tạm trú/tạm vắng...');
// Đã duyệt (Quá khứ)
for(let i=0; i<15; i++) {
    const r = randomItem(activeResidents);
    const reason = randomItem(['Du lịch', 'Nghỉ mát', 'Đi công tác']);
    const date = randomDate(SIX_MONTHS_AGO, TODAY);
    const date2 = addDays(date, 10);
    stream.write(`INSERT INTO temporary_residence (resident_id, type, start_date, end_date, reason, status, approved_by) VALUES ('${r.id}', 'Tạm vắng', '${formatDate(date)}', '${formatDate(date2)}', '${reason}', 'Đã duyệt', 'ID0001');\n`);
}
// Chờ duyệt (Hiện tại)
for(let i=0; i<10; i++) {
    const r = randomItem(activeResidents);
    const reason = randomItem(['Người nhà lên chơi', 'Thuê trọ', 'Ôn thi đại học']);
    const date = randomDate(SIX_MONTHS_AGO, TODAY);
    const date2 = addDays(date, 10);
    stream.write(`INSERT INTO temporary_residence (resident_id, type, start_date, end_date, reason, status) VALUES ('${r.id}', 'Tạm trú', '${formatDate(date)}', '${formatDate(date2)}', '${reason}', 'Chờ duyệt');\n`);
}

// 9. AUDIT LOGS (Quan trọng cho Dashboard)
console.log('- Sinh Logs hệ thống ngẫu nhiên...');
for(let i=0; i<50; i++) {
    const action = randomItem(['UPDATE fees', 'CREATE notification', 'UPDATE vehicle', 'DELETE visitor']);
    const user = randomItem(['ID0001', 'ID0002']);
    const time = randomDate(SIX_MONTHS_AGO, TODAY);
    stream.write(`INSERT INTO audit_logs (user_id, action_type, entity_name, entity_id, created_at, ip_address, user_agent) VALUES ('${user}', '${action.split(' ')[0]}', '${action.split(' ')[1]}', '1', '${formatDate(time)}', '${randomIP()}', '${randomItem(USER_AGENTS)}');\n`);
}

// 10. REVIEWS
console.log('- Sinh đánh giá...');
for(let i=0; i<100; i++) {
    const r = randomItem(activeResidents);
    stream.write(`INSERT INTO reviews (resident_id, rating, feedback, status) VALUES ('${r.id}', ${randomInt(1,5)}, 'Dịch vụ rất tốt', 'Mới');\n`);
}

// 11. FUND CAMPAIGNS & DONATIONS
console.log('- Sinh quỹ từ thiện...');
// Quỹ 1: Đã đóng
stream.write(`INSERT INTO fund_campaigns (id, title, start_date, end_date, target_amount, current_amount, status, created_by) VALUES (1, 'Vui Hội Trăng Rằm 2025', '2025-08-01', '2025-09-01', 20000000, 25000000, 'Closed', 'ID0002');\n`);
// Quỹ 2: Đang mở
stream.write(`INSERT INTO fund_campaigns (id, title, start_date, end_date, target_amount, current_amount, status, created_by) VALUES (2, 'Quỹ Khuyến Học 2025', '2025-01-01', '2025-12-31', 50000000, 15000000, 'Active', 'ID0002');\n`);
// Quỹ 3: Tương lai
stream.write(`INSERT INTO fund_campaigns (id, title, start_date, end_date, target_amount, current_amount, status, created_by) VALUES (3, 'Tết Sum Vầy 2026', '2026-01-01', '2026-02-01', 100000000, 0, 'Planned', 'ID0002');\n`);

// Donations (Random 30 người)
for(let i=0; i<30; i++) {
    const r = randomItem(activeResidents);
    const campaignId = randomItem([1, 2]);
    const amount = randomItem([50000, 100000, 200000, 500000]);
    const method = Math.random() < 0.7 ? 'AppPayment' : 'Cash';
    stream.write(`INSERT INTO donations (campaign_id, resident_id, amount, payment_method, is_anonymous) VALUES (${campaignId}, '${r.id}', ${amount}, '${method}', ${Math.random()<0.2 ? 1 : 0});\n`);
}

// 12. VISITORS (100 Khách)
console.log('- Sinh dữ liệu khách...');
for(let i=0; i<100; i++) {
    const apt = randomItem(activeApartments);
    const inTime = randomDate(SIX_MONTHS_AGO, TODAY);
    const outTime = new Date(inTime.getTime() + randomInt(30, 240) * 60000); // Ở lại 30-240 phút
    const name = genName();
    stream.write(`INSERT INTO visitors (apartment_id, visitor_name, identity_card, check_in_time, check_out_time, security_guard_id) VALUES (${apt.id}, '${name}', '${genCCCD()}', '${formatDate(inTime)}', '${formatDate(outTime)}', 'ID0003');\n`);
}

// 13. ASSETS & MAINTENANCE
console.log('- Sinh Tài sản...');
const ASSETS = [
    'Thang máy A1', 'Thang máy A2', 'Máy phát điện Cummins', 'Bơm tăng áp', 
    'Sofa sảnh A', 'Bàn Lễ tân', 'Camera Sảnh chính', 'Bình chữa cháy T1'
];
ASSETS.forEach((name, idx) => {
    const code = `TS${String(idx+1).padStart(3,'0')}`;
    const date = randomDate(SIX_MONTHS_AGO, TODAY);
    stream.write(`INSERT INTO assets (id, asset_code, name, status, location) VALUES (${idx+1}, '${code}', '${name}', 'Đang hoạt động', 'Tòa A');\n`);
    stream.write(`INSERT INTO maintenance_schedules (asset_id, title, scheduled_date, status, cost) VALUES (${idx+1}, 'Bảo trì ${name}', '${formatDate(date)}', 'Hoàn thành', ${randomInt(500000, 5000000)});\n`);
});

// 14. LOGS (Blacklist alerts)
const date = randomDate(SIX_MONTHS_AGO, TODAY);
stream.write(`INSERT INTO access_logs (plate_number, vehicle_type, direction, gate, status, note, created_at) VALUES ('29A-CRIMINAL', 'Ô tô', 'In', 'Cổng A', 'Alert', 'Xe trộm cắp', '${formatDate(date)}');\n`);
stream.write(`INSERT INTO access_logs (plate_number, vehicle_type, direction, gate, status, note, created_at) VALUES ('99X-UNKNOWN', 'Xe máy', 'In', 'Cổng B', 'Warning', 'Xe lạ', '${formatDate(date)}');\n`);

stream.write(`SET FOREIGN_KEY_CHECKS = 1;\n`);
stream.end();

console.log('✅ Đã tạo xong file: ' + OUTPUT_FILE);
console.log('👉 Vui lòng chạy lệnh: node backend/scripts/setupDatabase.js');