// File: backend/scripts/seed_building_data.js
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Create direct connection without SSL for seeding
const getPool = async () => {
    return mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: null // Force disable SSL
    });
};

const db = {
    query: async (sql, params) => {
        const pool = await getPool();
        const result = await pool.query(sql, params);
        await pool.end(); // Close connection after query
        return result;
    }
};

const seedData = async () => {
    try {
        console.log('🌱 Starting to seed building data...');

        // 1. Seed Building Info
        const buildingInfo = {
            id: 1,
            name: 'CHUNG CƯ BLUEMOON',
            investor: 'Tổng công ty CP Xuất nhập khẩu & Xây dựng Việt Nam (VINACONEX)',
            location: '289 Khuất Duy Tiến - Trung Hòa - Cầu Giấy - Hà Nội',
            scale: 'Cao 31 tầng, 03 tầng hầm, 04 tầng dịch vụ thương mại.',
            apartments: '216 căn hộ diện tích từ 86,5 - 113m2',
            description: `Chung cư Bluemoon là dự án căn hộ cao cấp tọa lạc tại vị trí đắc địa, nơi giao thoa giữa các tuyến đường huyết mạch: Vành đai 3 - Đại lộ Thăng Long - Trần Duy Hưng. Với thiết kế hiện đại theo phong cách châu Âu, tòa nhà mang đến không gian sống sang trọng, tiện nghi và đẳng cấp.

THIẾT KẾ VÀ KIẾN TRÚC:
• Thiết kế căn hộ thông minh, tối ưu hóa ánh sáng tự nhiên và thông gió
• Không gian xanh được bố trí hài hòa với khu vườn trên cao và cây xanh ở hành lang
• Hệ thống thang máy tốc độ cao, tiết kiệm năng lượng
• Sảnh đón sang trọng với phong cách khách sạn 5 sao

HỆ THỐNG TIỆN ÍCH ĐẲNG CẤP:
• Siêu thị, trung tâm mua sắm ngay tại tầng thương mại
• Phòng tập Gym & Spa hiện đại với trang thiết bị cao cấp
• Bể bơi bốn mùa trên tầng thượng với view toàn thành phố
• Nhà trẻ quốc tế, khu vui chơi an toàn cho trẻ em
• Khu BBQ và sân vườn dành cho cộng đồng cư dân

AN NINH VÀ AN TOÀN:
• Hệ thống PCCC tự động hiện đại theo tiêu chuẩn quốc tế
• Camera an ninh 24/7 tại tất cả khu vực công cộng
• Bảo vệ chuyên nghiệp và kiểm soát ra vào bằng thẻ từ
• Hầm đỗ xe thông minh với hệ thống cảm biến`,
            total_area: '1,3 ha',
            start_date: 'Quý IV/2016',
            finish_date: 'Quý IV/2018',
            total_investment: '618,737 tỷ đồng'
        };

        await db.query(`
            INSERT INTO building_info (id, name, investor, location, scale, apartments, description, total_area, start_date, finish_date, total_investment)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                investor = VALUES(investor),
                location = VALUES(location),
                scale = VALUES(scale),
                apartments = VALUES(apartments),
                description = VALUES(description),
                total_area = VALUES(total_area),
                start_date = VALUES(start_date),
                finish_date = VALUES(finish_date),
                total_investment = VALUES(total_investment)
        `, [
            buildingInfo.id, buildingInfo.name, buildingInfo.investor, buildingInfo.location,
            buildingInfo.scale, buildingInfo.apartments, buildingInfo.description,
            buildingInfo.total_area, buildingInfo.start_date, buildingInfo.finish_date,
            buildingInfo.total_investment
        ]);
        console.log('✅ Building Info seeded successfully!');

        // 2. Seed Regulations
        const regulations = [
            {
                title: '1. Quy định về An ninh & Ra vào',
                content: [
                    'Cư dân ra vào tòa nhà phải sử dụng Thẻ Cư Dân.',
                    'Khách đến thăm phải đăng ký tại Quầy Lễ Tân hoặc bảo vệ sảnh.',
                    'Không cho người lạ đi cùng vào thang máy hoặc khu vực hạn chế.',
                    'Mọi hành vi gây mất trật tự, an ninh sẽ bị xử lý theo quy định.'
                ],
                sort_order: 1
            },
            {
                title: '2. Quy định về Tiếng ồn & Giờ giấc',
                content: [
                    'Giờ yên tĩnh: Từ 22:00 đến 07:00 sáng hôm sau và 12:00 đến 13:30 trưa.',
                    'Việc thi công sửa chữa chỉ được phép thực hiện trong giờ hành chính (8:00 - 17:00) từ Thứ 2 đến Thứ 6 và sáng Thứ 7.',
                    'Vui lòng không gây tiếng ồn lớn, mở nhạc to ảnh hưởng đến các căn hộ lân cận.'
                ],
                sort_order: 2
            },
            {
                title: '3. Quy định về Vệ sinh & Rác thải',
                content: [
                    'Rác thải sinh hoạt phải được phân loại và bỏ vào túi kín trước khi cho vào phòng rác/ống rác.',
                    'Không để rác, giày dép, vật dụng cá nhân tại hành lang chung.',
                    'Cấm vứt tàn thuốc, rác thải từ ban công xuống dưới.',
                    'Rác cồng kềnh (nội thất, xà bần) phải đăng ký với BQL để vận chuyển riêng.'
                ],
                sort_order: 3
            },
            {
                title: '4. Quy định về Phòng cháy Chữa cháy (PCCC)',
                content: [
                    'Tuyệt đối không hút thuốc tại các khu vực chung, cầu thang bộ, thang máy.',
                    'Không đốt vàng mã tại ban công hoặc hành lang (chỉ đốt tại khu vực quy định của tòa nhà).',
                    'Không chặn cửa thoát hiểm, không để đồ vật cản trở lối đi PCCC.',
                    'Tham gia đầy đủ các buổi diễn tập PCCC định kỳ do BQL tổ chức.'
                ],
                sort_order: 4
            },
            {
                title: '5. Quy định về Thú cưng',
                content: [
                    'Cư dân nuôi thú cưng phải đăng ký với Ban Quản Lý.',
                    'Khi đưa thú cưng ra khu vực công cộng phải có dây xích, rọ mõm và người dắt.',
                    'Tuyệt đối giữ vệ sinh chung, chủ nuôi phải dọn dẹp chất thải của thú cưng ngay lập tức.',
                    'Không để thú cưng gây ồn ào ảnh hưởng đến người xung quanh.'
                ],
                sort_order: 5
            }
        ];

        // Clear old regulations first to avoid duplicates if re-running
        await db.query('TRUNCATE TABLE building_regulations');

        for (const reg of regulations) {
            await db.query(
                'INSERT INTO building_regulations (title, content, sort_order) VALUES (?, ?, ?)',
                [reg.title, JSON.stringify(reg.content), reg.sort_order]
            );
        }
        console.log('✅ Regulations seeded successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
