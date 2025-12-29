/**
 * BLUEMOON APARTMENT - OPTIMIZED SEEDING DATA GENERATOR v4.3
 * Critical Fixes:
 * - Fixed 'Column count doesn't match value count' for 'users' table.
 * (Admins and Residents must share the exact same column definition in Bulk Insert)
 * * Run: node database/generate_seeding.js
 */

const fs = require('fs');
const path = require('path');

// ==================== CONFIGURATION ====================
const CONFIG = {
    OUTPUT_FILE: path.join(__dirname, 'bluemoon_full_data.sql'),
    PASSWORD_HASH: '$2b$10$ukwGjOqP.ly7YnMCPGTh/O5NcY1Bc5Ye2syWyncT0/ojoL4PM.8oa',
    BUILDING_BLOCKS: ['A', 'B'],
    FLOORS: 31,
    ROOMS_PER_FLOOR: 8,
    OCCUPANCY_RATE: 0.75, // 75% căn hộ có người ở
    APARTMENT_AREAS: [85.5, 92.0, 98.5, 105.0, 112.0, 120.0],
    FEE_PRICES: {
        MANAGEMENT: 7000,     // per m²
        PARKING_CAR: 1200000, // per month
        PARKING_MOTORBIKE: 70000,
        ELECTRICITY: 3000,    // per kWh
        WATER: 15000         // per m³
    }
};

// ==================== DATE UTILITIES ====================
class DateHelper {
    static TODAY = new Date();
    static SIX_MONTHS_AGO = new Date(this.TODAY.getFullYear(), this.TODAY.getMonth() - 6, 1);
    static ONE_YEAR_AGO = new Date(this.TODAY.getFullYear() - 1, this.TODAY.getMonth(), 1);
    static SIX_MONTHS_LATER = new Date(this.TODAY.getFullYear(), this.TODAY.getMonth() + 6, 1);

    static format(date) {
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }

    static formatDateOnly(date) {
        return date.toISOString().slice(0, 10);
    }

    static randomBetween(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    static addMonths(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }

    static toDDMMYYYY(date) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}${m}${y}`;
    }

    static getBillingPeriod(date) {
        return `T${date.getMonth() + 1}/${date.getFullYear()}`;
    }
}

// ==================== RANDOM UTILITIES ====================
class RandomHelper {
    static int(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static item(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    static items(arr, count) {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    static weighted(items) {
        const weights = items.map(item => item.weight);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) return items[i].value;
        }
        return items[items.length - 1].value;
    }

    static boolean(probability = 0.5) {
        return Math.random() < probability;
    }

    static ip() {
        return `${this.int(10, 200)}.${this.int(0, 255)}.${this.int(0, 255)}.${this.int(1, 255)}`;
    }
}

// ==================== ID GENERATOR ====================
class IdGenerator {
    constructor() {
        this.sequences = {};
    }

    generateDailyId(prefix, dateObj) {
        const dateStr = DateHelper.toDDMMYYYY(dateObj);
        const key = `${prefix}-${dateStr}`;
        if (!this.sequences[key]) this.sequences[key] = 0;
        this.sequences[key]++;
        return `${prefix}-${dateStr}-${String(this.sequences[key]).padStart(4, '0')}`;
    }

    reset() {
        this.sequences = {};
    }
}

// ==================== VIETNAMESE DATA ====================
const VietnameseData = {
    LAST_NAMES: ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'],
    
    MIDDLE_NAMES_MALE: ['Văn', 'Đức', 'Thanh', 'Mạnh', 'Hữu', 'Quang', 'Minh', 'Tuấn', 'Công', 'Duy'],
    MIDDLE_NAMES_FEMALE: ['Thị', 'Kim', 'Ngọc', 'Thanh', 'Thu', 'Phương', 'Hồng', 'Lan', 'Mai'],
    
    FIRST_NAMES_MALE: ['An', 'Bình', 'Cường', 'Dũng', 'Hùng', 'Khánh', 'Minh', 'Phúc', 'Quân', 'Sơn', 'Tuấn', 'Việt', 'Hoàng', 'Long', 'Nam', 'Hải', 'Tùng', 'Đạt'],
    FIRST_NAMES_FEMALE: ['Anh', 'Chi', 'Giang', 'Hà', 'Hương', 'Lan', 'Linh', 'Mai', 'Nga', 'Nhung', 'Oanh', 'Phương', 'Thảo', 'Trang', 'Vân', 'Yến'],
    
    RELATIONSHIPS: ['Vợ', 'Chồng', 'Con trai', 'Con gái', 'Bố', 'Mẹ', 'Anh', 'Em', 'Ông', 'Bà'],
    
    OCCUPATIONS: [
        'Kỹ sư', 'Bác sĩ', 'Giáo viên', 'Nhân viên văn phòng', 'Kinh doanh',
        'Kế toán', 'Lập trình viên', 'Luật sư', 'Kiến trúc sư', 'Dược sĩ',
        'Nhân viên ngân hàng', 'Marketing', 'Thiết kế', 'Nhà báo', 'Freelancer'
    ],
    
    HOMETOWNS: [
        'Hà Nội', 'Hải Phòng', 'Nam Định', 'Thái Bình', 'Ninh Bình',
        'Hà Nam', 'Hưng Yên', 'Bắc Ninh', 'Bắc Giang', 'Vĩnh Phúc',
        'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'TP. Hồ Chí Minh', 'Đà Nẵng'
    ],

    CAR_BRANDS: ['Toyota', 'Honda', 'Hyundai', 'Mazda', 'Ford', 'Kia', 'Vinfast', 'Mercedes', 'BMW', 'Audi'],
    MOTORBIKE_BRANDS: ['Honda', 'Yamaha', 'SYM', 'Piaggio', 'Suzuki', 'Vinfast', 'Exciter', 'Wave', 'Vision'],
    
    generateName(isMale = RandomHelper.boolean()) {
        const lastName = RandomHelper.item(this.LAST_NAMES);
        const middleName = RandomHelper.item(isMale ? this.MIDDLE_NAMES_MALE : this.MIDDLE_NAMES_FEMALE);
        const firstName = RandomHelper.item(isMale ? this.FIRST_NAMES_MALE : this.FIRST_NAMES_FEMALE);
        return `${lastName} ${middleName} ${firstName}`;
    },

    generatePhone() {
        const prefixes = ['090', '091', '093', '094', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039'];
        return `${RandomHelper.item(prefixes)}${RandomHelper.int(1000000, 9999999)}`;
    },

    generateCCCD() {
        const year = RandomHelper.int(1960, 2005);
        return `0${RandomHelper.int(0, 9)}${year}${RandomHelper.int(100000, 999999)}`;
    },

    generateLicensePlate(isMotorbike = false) {
        if (isMotorbike) {
            const city = RandomHelper.item(['29', '30', '14', '51', '99']);
            const letter = RandomHelper.item(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'M', 'N', 'P', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z']);
            return `${city}${letter}${RandomHelper.int(1, 9)}-${String(RandomHelper.int(100, 9999)).padStart(4, '0')}`;
        } else {
            const city = RandomHelper.item(['29', '30', '14', '51', '99']);
            const letter = RandomHelper.item(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L']);
            return `${city}${letter}-${String(RandomHelper.int(100, 999))}.${String(RandomHelper.int(10, 99))}`;
        }
    }
};

// ==================== USER AGENTS ====================
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 Version/17.1 Mobile Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 Chrome/119.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'
];

// ==================== SQL WRITER ====================
class SQLWriter {
    constructor(filename) {
        this.stream = fs.createWriteStream(filename);
        this.stats = {
            apartments: 0,
            residents: 0,
            vehicles: 0,
            fees: 0,
            notifications: 0,
            reports: 0
        };
        this.buffers = {};
        this.storedInserts = {}; // Store generated SQL strings by table name
        this.BATCH_SIZE = 1000;
        
        // Define write order to strict satisfy Foreign Key constraints
        this.WRITE_ORDER = [
            'roles', 'fee_types', 'notification_types', 'service_types', 'building_info', 'building_regulations', // Static
            'users', // Parent of admins, residents
            'admins',
            'login_history',
            'apartments', // Parent of residents
            'residents', // Parent of many
            'residence_history',
            'vehicles',
            'access_logs',
            'vehicle_blacklist',
            'fees',
            'fee_items',
            'payment_history',
            'utility_readings',
            'notifications',
            'notification_attachments',
            'notification_recipients',
            'reports',
            'report_attachments',
            'service_bookings',
            'service_attachments',
            'visitors',
            'temporary_residence',
            'profile_edit_requests',
            'fund_campaigns',
            'donations',
            'reviews',
            'assets',
            'maintenance_schedules',
            'audit_logs'
        ];
    }

    write(sql) {
        this.stream.write(sql);
    }

    writeln(sql = '') {
        this.stream.write(sql + '\n');
    }

    addBatch(table, columns, value) {
        if (!this.buffers[table]) {
            this.buffers[table] = { columns, values: [] };
        }
        this.buffers[table].values.push(value);
        
        if (this.buffers[table].values.length >= this.BATCH_SIZE) {
            this.flushBatch(table);
        }
    }

    flushBatch(table) {
        if (!this.buffers[table] || this.buffers[table].values.length === 0) return;
        
        const { columns, values } = this.buffers[table];
        
        // Instead of writing to stream immediately, store in memory
        if (!this.storedInserts[table]) {
            this.storedInserts[table] = [];
        }
        
        const sql = `INSERT INTO ${table} (${columns}) VALUES\n${values.join(',\n')};`;
        this.storedInserts[table].push(sql);
        
        this.buffers[table].values = []; // Reset buffer
    }

    flushAll() {
        Object.keys(this.buffers).forEach(table => this.flushBatch(table));
    }

    writeHeader() {
        this.writeln('-- ================================================');
        this.writeln('-- BLUEMOON APARTMENT - SEEDING DATA');
        this.writeln(`-- Generated: ${new Date().toLocaleString('vi-VN')}`);
        this.writeln('-- ================================================\n');
        this.writeln('SET FOREIGN_KEY_CHECKS = 0;');
        this.writeln('SET NAMES utf8mb4;\n');
    }

    truncateTables() {
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
        
        tables.forEach(table => this.writeln(`TRUNCATE TABLE ${table};`));
        this.writeln();
    }

    writeFooter() {
        // Flush any remaining items in buffers
        this.flushAll();

        // Write stored inserts in CORRECT ORDER
        console.log('💾 Writing buffered data to file in dependency order...');
        
        this.WRITE_ORDER.forEach(table => {
            if (this.storedInserts[table] && this.storedInserts[table].length > 0) {
                this.writeln(`-- Table: ${table}`);
                this.storedInserts[table].forEach(sql => this.writeln(sql));
                this.writeln();
            }
        });

        // Write any tables not in the list (fallback)
        Object.keys(this.storedInserts).forEach(table => {
            if (!this.WRITE_ORDER.includes(table)) {
                console.warn(`⚠️ Warning: Table '${table}' not in strict write order. Appending at end.`);
                this.writeln(`-- Table: ${table}`);
                this.storedInserts[table].forEach(sql => this.writeln(sql));
                this.writeln();
            }
        });

        this.writeln('\nSET FOREIGN_KEY_CHECKS = 1;');
        this.writeln('\n-- ================================================');
        this.writeln('-- STATISTICS');
        this.writeln(`-- Apartments: ${this.stats.apartments}`);
        this.writeln(`-- Residents: ${this.stats.residents}`);
        this.writeln(`-- Vehicles: ${this.stats.vehicles}`);
        this.writeln(`-- Fees: ${this.stats.fees}`);
        this.writeln(`-- Notifications: ${this.stats.notifications}`);
        this.writeln(`-- Reports: ${this.stats.reports}`);
        this.writeln('-- ================================================');
    }

    close() {
        this.stream.end();
    }
}

// ==================== DATA GENERATORS ====================

class StaticDataGenerator {
    static generate(writer) {
        console.log('📝 Generating static data...');
        
        // Roles
        writer.addBatch('roles', 'id, role_name, role_code', "(1, 'Ban Quản Trị', 'bod')");
        writer.addBatch('roles', 'id, role_name, role_code', "(2, 'Kế Toán', 'accountance')");
        writer.addBatch('roles', 'id, role_name, role_code', "(3, 'Cư Dân', 'resident')");
        writer.addBatch('roles', 'id, role_name, role_code', "(4, 'Cơ Quan Chức Năng', 'cqcn')");

        // Fee Types
        writer.addBatch('fee_types', 'id, fee_name, fee_code, default_price, unit', `(1, 'Phí Quản lý', 'PQL', ${CONFIG.FEE_PRICES.MANAGEMENT}, 'm²')`);
        writer.addBatch('fee_types', 'id, fee_name, fee_code, default_price, unit', `(2, 'Phí Gửi xe', 'PGX', 0, 'Tháng')`);
        writer.addBatch('fee_types', 'id, fee_name, fee_code, default_price, unit', `(3, 'Phí Điện', 'PD', ${CONFIG.FEE_PRICES.ELECTRICITY}, 'kWh')`);
        writer.addBatch('fee_types', 'id, fee_name, fee_code, default_price, unit', `(4, 'Phí Nước', 'PN', ${CONFIG.FEE_PRICES.WATER}, 'm³')`);

        // Notification Types
        writer.addBatch('notification_types', 'id, type_name, type_code', "(1, 'Khẩn cấp', 'EMERGENCY')");
        writer.addBatch('notification_types', 'id, type_name, type_code', "(2, 'Chung', 'GENERAL')");
        writer.addBatch('notification_types', 'id, type_name, type_code', "(3, 'Thu phí', 'FEE')");
        writer.addBatch('notification_types', 'id, type_name, type_code', "(4, 'Dịch vụ', 'SERVICE')");

        // Service Types
        this.generateServiceTypes(writer);
        
        // Building Info & Regulations
        this.generateBuildingInfo(writer);
        
        // Vehicle Blacklist
        this.generateVehicleBlacklist(writer);
        
        // Admin Users
        this.generateAdminUsers(writer);
    }

    static generateServiceTypes(writer) {
        const services = [
            ['BlueFit Gym & Yoga Center', 'Trung tâm thể hình đẳng cấp 5 sao với máy móc Technogym nhập khẩu Ý. Có bể bơi 4 mùa, xông hơi và các lớp Yoga miễn phí.', 500000, 'Tháng', 'Sức khỏe & Làm đẹp', 'Tầng 3 - Tòa A', '05:30 - 22:00', '0901.234.567'],
            ['Siêu thị BlueMart (Đi chợ hộ)', 'Dịch vụ đi chợ hộ dành cho cư dân bận rộn. Phí dịch vụ tính trên một lần đi mua.', 30000, 'Lần', 'Tiện ích đời sống', 'Tầng 1 - Tòa B', '07:00 - 21:00', '0909.888.999'],
            ['Moonlight Coffee & Lounge', 'Thuê phòng VIP để họp nhóm, tiếp khách hoặc làm việc. Không gian yên tĩnh, view toàn thành phố.', 200000, 'Giờ', 'Ẩm thực & Giải trí', 'Tầng Thượng (Rooftop)', '08:00 - 23:00', '0912.333.444'],
            ['Trường Mầm non Little Stars', 'Môi trường giáo dục chuẩn quốc tế, giáo viên bản ngữ. Đăng ký giữ chỗ hoặc tham quan.', 8500000, 'Tháng', 'Giáo dục', 'Tầng 2 - Tòa C', '07:00 - 17:30', '024.3333.8888'],
            ['Nhà hàng Ẩm thực Á Đông', 'Đặt bàn tiệc gia đình, sinh nhật, tất niên. Thực đơn phong phú 3 miền.', 3500000, 'Bàn', 'Ẩm thực & Giải trí', 'Tầng 1 - Tòa D', '10:00 - 22:00', '0988.777.666'],
            ['Khu vui chơi KidzWorld', 'Thiên đường vui chơi cho trẻ em với nhà bóng, cầu trượt, khu hướng nghiệp.', 120000, 'Vé', 'Giải trí', 'Tầng 2 - TTTM', '09:00 - 21:30', '0905.111.222']
        ];

        services.forEach((s) => {
            writer.addBatch('service_types', 'name, description, base_price, unit, is_active, category, location, open_hours, contact_phone', `('${s[0]}', '${s[1]}', ${s[2]}, '${s[3]}', TRUE, '${s[4]}', '${s[5]}', '${s[6]}', '${s[7]}')`);
        });
    }

    static generateBuildingInfo(writer) {
        writer.addBatch('building_info', 'id, name, investor, location, scale, apartments, description, total_area, start_date, finish_date, total_investment', `(1, 'CHUNG CƯ BLUEMOON', 'Tổng công ty CP Xuất nhập khẩu & Xây dựng Việt Nam (VINACONEX)', '289 Khuất Duy Tiến - Trung Hòa - Cầu Giấy - Hà Nội', 'Cao 31 tầng, 03 tầng hầm, 04 tầng dịch vụ thương mại.', '496 căn hộ diện tích từ 85.5 - 120m²', 'Tọa lạc tại vị trí đắc địa, Chung cư Bluemoon tiếp giáp với nút giao thông trung tâm Vành đai 3 - Đại lộ Thăng Long - Trần Duy Hưng. Tòa nhà được thiết kế với không gian sống xanh, hòa với thiên nhiên cùng hệ thống hạ tầng khớp nối đồng bộ.', '1,3 ha', 'Quý IV/2016', 'Quý IV/2018', '618,737 tỷ đồng')`);

        const regulations = [
            ['1. Quy định về An ninh & Ra vào', '["Cư dân ra vào tòa nhà phải sử dụng Thẻ Cư Dân.", "Khách đến thăm phải đăng ký tại Quầy Lễ Tân.", "Không cho người lạ vào thang máy hoặc khu vực hạn chế.", "Mọi hành vi gây mất trật tự sẽ bị xử lý."]', 1],
            ['2. Quy định về Tiếng ồn & Giờ giấc', '["Giờ yên tĩnh: 22:00 - 07:00 và 12:00 - 13:30.", "Thi công sửa chữa chỉ trong giờ hành chính (8:00 - 17:00).", "Không gây tiếng ồn ảnh hưởng căn hộ lân cận."]', 2],
            ['3. Quy định về Vệ sinh & Rác thải', '["Rác phải phân loại và bỏ vào túi kín.", "Không để rác tại hành lang chung.", "Cấm vứt rác từ ban công.", "Rác cồng kềnh phải đăng ký với BQL."]', 3],
            ['4. Quy định về PCCC', '["Cấm hút thuốc tại khu vực chung.", "Không đốt vàng mã tại ban công.", "Không chặn cửa thoát hiểm.", "Tham gia diễn tập PCCC định kỳ."]', 4],
            ['5. Quy định về Thú cưng', '["Phải đăng ký thú cưng với BQL.", "Ra ngoài phải có dây xích, rọ mõm.", "Chủ nuôi phải dọn chất thải ngay.", "Không để thú cưng gây ồn ào."]', 5]
        ];

        regulations.forEach((r) => {
            writer.addBatch('building_regulations', 'title, content, sort_order', `('${r[0]}', '${r[1]}', ${r[2]})`);
        });
    }

    static generateVehicleBlacklist(writer) {
        const blacklist = [
            ['29A-CRIMINAL', 'Xe trộm cắp được cơ quan công an thông báo', 'ID0001'],
            ['30H-FAKE', 'Biển số giả mạo', 'ID0001'],
            ['14A-BLOCKED', 'Chủ xe gây rối trật tự nhiều lần', 'ID0001'],
            ['51G-DEBT', 'Nợ phí quản lý quá hạn 6 tháng', 'ID0002'],
            ['99X-DANGER', 'Phát hiện chở hàng nguy hiểm', 'ID0001']
        ];

        blacklist.forEach((b) => {
            writer.addBatch('vehicle_blacklist', 'license_plate, reason, added_by', `('${b[0]}', '${b[1]}', '${b[2]}')`);
        });
    }

    static generateAdminUsers(writer) {
        // [FIXED] Updated to include created_at and updated_at to match 'users' table structure in dynamic generation
        const now = DateHelper.format(DateHelper.TODAY);
        const userCols = 'id, username, password, email, phone, role_id, created_at, updated_at';

        writer.addBatch('users', userCols, `('ID0001', 'admin.a', '${CONFIG.PASSWORD_HASH}', 'admin.a@bluemoon.com', '0901000001', 1, '${now}', '${now}')`);
        writer.addBatch('users', userCols, `('ID0002', 'ketoan.b', '${CONFIG.PASSWORD_HASH}', 'ketoan.b@bluemoon.com', '0901000002', 2, '${now}', '${now}')`);
        writer.addBatch('users', userCols, `('ID0003', 'cqcn.c', '${CONFIG.PASSWORD_HASH}', 'cqcn.c@bluemoon.com', '0901000003', 4, '${now}', '${now}')`);

        writer.addBatch('admins', 'id, user_id, full_name, email, phone', `('ID0001', 'ID0001', 'Nguyễn Văn Quản', 'admin.a@bluemoon.com', '0901000001')`);
        writer.addBatch('admins', 'id, user_id, full_name, email, phone', `('ID0002', 'ID0002', 'Trần Thị Lan', 'ketoan.b@bluemoon.com', '0901000002')`);
        writer.addBatch('admins', 'id, user_id, full_name, email, phone', `('ID0003', 'ID0003', 'Lê Công An', 'cqcn.c@bluemoon.com', '0901000003')`);

        // Admin login history
        for (let d = 0; d < 30; d++) {
            const loginTime = DateHelper.addDays(DateHelper.TODAY, -d);
            const timeWithHours = new Date(loginTime);
            timeWithHours.setHours(RandomHelper.int(7, 9), RandomHelper.int(0, 59));
            
            writer.addBatch('login_history', 'user_id, login_time, ip_address, user_agent', `('ID0001', '${DateHelper.format(timeWithHours)}', '192.168.1.10', '${RandomHelper.item(USER_AGENTS)}')`);
            
            if (RandomHelper.boolean(0.8)) {
                timeWithHours.setHours(RandomHelper.int(8, 10), RandomHelper.int(0, 59));
                writer.addBatch('login_history', 'user_id, login_time, ip_address, user_agent', `('ID0002', '${DateHelper.format(timeWithHours)}', '192.168.1.11', '${RandomHelper.item(USER_AGENTS)}')`);
            }
        }
    }
}

// ==================== MAIN GENERATOR ====================
class BluemoonDataGenerator {
    constructor() {
        this.writer = new SQLWriter(CONFIG.OUTPUT_FILE);
        this.idGen = new IdGenerator();
        this.activeResidents = [];
        this.activeUsers = ['ID0001', 'ID0002', 'ID0003'];
        this.activeApartments = [];
        this.residentCounter = 1;
        this.vehicleCounter = 1;
    }

    generate() {
        console.log('🚀 Starting Bluemoon Seeding Data Generation...\n');
        
        this.writer.writeHeader();
        this.writer.truncateTables();
        
        StaticDataGenerator.generate(this.writer);
        this.generateApartmentsAndResidents();
        this.generateSupplementaryData();
        
        this.writer.writeFooter();
        this.writer.close();
        
        console.log('\n✅ Generation completed!');
        console.log(`📁 Output file: ${CONFIG.OUTPUT_FILE}`);
        console.log(`📊 Statistics:`);
        console.log(`   - Apartments: ${this.writer.stats.apartments}`);
        console.log(`   - Residents: ${this.writer.stats.residents}`);
        console.log(`   - Vehicles: ${this.writer.stats.vehicles}`);
        console.log(`   - Fees: ${this.writer.stats.fees}`);
        console.log(`   - Notifications: ${this.writer.stats.notifications}`);
        console.log(`   - Reports: ${this.writer.stats.reports}`);
        console.log('\n👉 Next step: node backend/scripts/setupDatabase.js');
    }

    generateApartmentsAndResidents() {
        console.log('🏢 Generating apartments and residents...');
        let aptIdCounter = 1;

        CONFIG.BUILDING_BLOCKS.forEach(block => {
            for (let floor = 1; floor <= CONFIG.FLOORS; floor++) {
                for (let room = 1; room <= CONFIG.ROOMS_PER_FLOOR; room++) {
                    const aptCode = `${block}-${floor}${room < 10 ? '0' + room : room}`;
                    const area = RandomHelper.item(CONFIG.APARTMENT_AREAS);
                    const isOccupied = RandomHelper.boolean(CONFIG.OCCUPANCY_RATE);
                    const status = isOccupied ? 'Đang sinh sống' : 'Trống';

                    this.writer.addBatch('apartments', 'id, apartment_code, building, floor, area, status', `(${aptIdCounter}, '${aptCode}', '${block}', ${floor}, ${area}, '${status}')`);
                    this.writer.stats.apartments++;

                    if (isOccupied) {
                        this.activeApartments.push({ id: aptIdCounter, code: aptCode, area: area, floor: floor, building: block });
                        this.generateResidentFamily(aptIdCounter, aptCode, area);
                    } else if (RandomHelper.boolean(0.15)) {
                        this.generateHistoricalResident(aptIdCounter);
                    }

                    aptIdCounter++;
                }
            }
        });
        
        console.log(`   ✓ Created ${this.writer.stats.apartments} apartments`);
        console.log(`   ✓ Created ${this.writer.stats.residents} residents`);
    }

    generateResidentFamily(aptId, aptCode, area) {
        const moveInDate = DateHelper.randomBetween(
            new Date(2021, 0, 1),
            DateHelper.SIX_MONTHS_AGO
        );

        // Owner
        const ownerId = `R${String(this.residentCounter).padStart(4, '0')}`;
        const ownerGender = RandomHelper.boolean();
        const ownerName = VietnameseData.generateName(ownerGender);
        const username = `chuho_${aptCode.replace('-', '').toLowerCase()}`;
        const phone = VietnameseData.generatePhone();
        const email = `${username}@gmail.com`;
        const cccd = VietnameseData.generateCCCD();
        const dob = new Date(RandomHelper.int(1970, 1995), RandomHelper.int(0, 11), RandomHelper.int(1, 28));
        const hometown = RandomHelper.item(VietnameseData.HOMETOWNS);
        const occupation = RandomHelper.item(VietnameseData.OCCUPATIONS);

        this.writer.addBatch('users', 'id, username, password, email, phone, role_id, created_at, updated_at', `('${ownerId}', '${username}', '${CONFIG.PASSWORD_HASH}', '${email}', '${phone}', 3, '${DateHelper.format(moveInDate)}', '${DateHelper.format(moveInDate)}')`);
        
        // Use STANDARD COLUMNS for all residents (both owner and members)
        const resColumns = 'id, user_id, apartment_id, full_name, role, relationship_with_owner, phone, email, status, cccd, dob, gender, hometown, occupation, created_at, updated_at';

        this.writer.addBatch('residents', resColumns, `('${ownerId}', '${ownerId}', ${aptId}, '${ownerName}', 'owner', 'Chủ hộ', '${phone}', '${email}', 'Đang sinh sống', '${cccd}', '${DateHelper.formatDateOnly(dob)}', '${ownerGender ? 'Nam' : 'Nữ'}', '${hometown}', '${occupation}', '${DateHelper.format(moveInDate)}', '${DateHelper.format(moveInDate)}')`);
        
        this.writer.addBatch('residence_history', 'resident_id, apartment_id, event_type, event_date, note', `('${ownerId}', ${aptId}, 'Chuyển đến', '${DateHelper.formatDateOnly(moveInDate)}', 'Mua căn hộ mới')`);

        this.activeResidents.push({ 
            id: ownerId, 
            aptId: aptId, 
            name: ownerName, 
            isOwner: true,
            moveInDate: moveInDate
        });
        this.activeUsers.push(ownerId);
        this.writer.stats.residents++;
        this.residentCounter++;

        // Login history for owner
        if (RandomHelper.boolean(0.4)) {
            const loginCount = RandomHelper.int(1, 5);
            for (let i = 0; i < loginCount; i++) {
                const loginTime = DateHelper.randomBetween(DateHelper.SIX_MONTHS_AGO, DateHelper.TODAY);
                loginTime.setHours(RandomHelper.int(6, 23), RandomHelper.int(0, 59));
                this.writer.addBatch('login_history', 'user_id, login_time, ip_address, user_agent', `('${ownerId}', '${DateHelper.format(loginTime)}', '${RandomHelper.ip()}', '${RandomHelper.item(USER_AGENTS)}')`);
            }
        }

        // Family members
        const numMembers = RandomHelper.weighted([
            { value: 0, weight: 15 },
            { value: 1, weight: 20 },
            { value: 2, weight: 30 },
            { value: 3, weight: 25 },
            { value: 4, weight: 10 }
        ]);

        for (let m = 0; m < numMembers; m++) {
            const memId = `R${String(this.residentCounter).padStart(4, '0')}`;
            const memGender = RandomHelper.boolean();
            const memName = VietnameseData.generateName(memGender);
            const relation = this.getRelationship(m, ownerGender);
            const memDob = this.getMemberDob(relation);
            
            let memUserId = 'NULL';
            let memPhone = 'NULL';
            let memEmail = 'NULL';
            
            if (RandomHelper.boolean(0.15) && relation !== 'Con') {
                const memUsername = `mem_${memId.toLowerCase()}`;
                const rawPhone = VietnameseData.generatePhone();
                memPhone = `'${rawPhone}'`;
                memEmail = `'${memUsername}@gmail.com'`;
                
                this.writer.addBatch('users', 'id, username, password, email, phone, role_id, created_at, updated_at', `('${memId}', '${memUsername}', '${CONFIG.PASSWORD_HASH}', ${memEmail}, ${memPhone}, 3, '${DateHelper.format(moveInDate)}', '${DateHelper.format(moveInDate)}')`);
                memUserId = `'${memId}'`;
                this.activeUsers.push(memId);
            }

            // FIX: Using standardized columns, passing NULL for missing fields
            this.writer.addBatch('residents', resColumns, `('${memId}', ${memUserId}, ${aptId}, '${memName}', 'member', '${relation}', ${memPhone}, ${memEmail}, 'Đang sinh sống', NULL, '${DateHelper.formatDateOnly(memDob)}', '${memGender ? 'Nam' : 'Nữ'}', NULL, NULL, '${DateHelper.format(moveInDate)}', '${DateHelper.format(moveInDate)}')`);
            
            this.activeResidents.push({ id: memId, aptId: aptId, name: memName, isOwner: false });
            this.writer.stats.residents++;
            this.residentCounter++;
        }

        const familyVehicles = this.generateVehicles(ownerId, aptId, aptCode);
        this.generateFees(aptId, ownerId, aptCode, area, familyVehicles);
    }

    getRelationship(index, ownerGender) {
        const relationships = ownerGender 
            ? ['Vợ', 'Con trai', 'Con gái', 'Mẹ', 'Bố']
            : ['Chồng', 'Con trai', 'Con gái', 'Mẹ', 'Bố'];
        
        if (index === 0) return relationships[0];
        if (index === 1 || index === 2) return RandomHelper.item(['Con trai', 'Con gái']);
        return RandomHelper.item(['Mẹ', 'Bố', 'Anh', 'Em']);
    }

    getMemberDob(relation) {
        const year = DateHelper.TODAY.getFullYear();
        if (relation.includes('Con')) {
            return new Date(RandomHelper.int(year - 25, year - 5), RandomHelper.int(0, 11), RandomHelper.int(1, 28));
        } else if (relation === 'Mẹ' || relation === 'Bố') {
            return new Date(RandomHelper.int(year - 75, year - 55), RandomHelper.int(0, 11), RandomHelper.int(1, 28));
        }
        return new Date(RandomHelper.int(year - 50, year - 25), RandomHelper.int(0, 11), RandomHelper.int(1, 28));
    }

    generateHistoricalResident(aptId) {
        const oldRId = `R_OLD_${aptId}`;
        const name = VietnameseData.generateName();
        const moveOutDate = DateHelper.randomBetween(DateHelper.ONE_YEAR_AGO, DateHelper.SIX_MONTHS_AGO);
        
        // Fix: Standard columns for historical resident too
        const resColumns = 'id, user_id, apartment_id, full_name, role, relationship_with_owner, phone, email, status, cccd, dob, gender, hometown, occupation, created_at, updated_at';
        this.writer.addBatch('residents', resColumns, `('${oldRId}', NULL, ${aptId}, '${name}', 'owner', 'Chủ hộ', NULL, NULL, 'Đã chuyển đi', NULL, NULL, NULL, NULL, NULL, NULL, NULL)`);
        
        this.writer.addBatch('residence_history', 'resident_id, apartment_id, event_type, event_date, note', `('${oldRId}', ${aptId}, 'Chuyển đi', '${DateHelper.formatDateOnly(moveOutDate)}', 'Hết hợp đồng thuê')`);
    }

    generateVehicles(ownerId, aptId, aptCode) {
        const numVehicles = RandomHelper.weighted([
            { value: 0, weight: 20 },
            { value: 1, weight: 35 },
            { value: 2, weight: 30 },
            { value: 3, weight: 15 }
        ]);

        const vehicles = [];
        
        for (let v = 0; v < numVehicles; v++) {
            const isMotorbike = v === 0 ? RandomHelper.boolean(0.6) : true;
            const type = isMotorbike ? 'Xe máy' : 'Ô tô';
            const plate = VietnameseData.generateLicensePlate(isMotorbike);
            const brand = RandomHelper.item(isMotorbike ? VietnameseData.MOTORBIKE_BRANDS : VietnameseData.CAR_BRANDS);
            const img = `/uploads/vehicles/${plate.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.jpg`;
            const regDate = DateHelper.randomBetween(DateHelper.ONE_YEAR_AGO, DateHelper.TODAY);

            this.writer.addBatch('vehicles', 'id, resident_id, apartment_id, vehicle_type, license_plate, brand, status, vehicle_image, registration_date', `(${this.vehicleCounter}, '${ownerId}', ${aptId}, '${type}', '${plate}', '${brand}', 'Đang sử dụng', '${img}', '${DateHelper.formatDateOnly(regDate)}')`);
            
            vehicles.push({ plate, type, brand, regDate });
            this.writer.stats.vehicles++;
            this.vehicleCounter++;
        }

        this.generateAccessLogs(ownerId, vehicles);
        return vehicles;
    }

    generateAccessLogs(ownerId, vehicles) {
        vehicles.forEach(vehicle => {
            const numLogs = RandomHelper.int(15, 45);
            
            for (let d = 0; d < numLogs; d++) {
                const logDate = DateHelper.randomBetween(
                    DateHelper.addDays(DateHelper.TODAY, -30),
                    DateHelper.TODAY
                );
                
                const outTime = new Date(logDate);
                outTime.setHours(RandomHelper.int(6, 9), RandomHelper.int(0, 59));
                this.writer.addBatch('access_logs', 'plate_number, vehicle_type, direction, gate, status, resident_id, created_at, image_url', `('${vehicle.plate}', '${vehicle.type}', 'Out', 'Cổng ${RandomHelper.item(['A', 'B'])}', 'Normal', '${ownerId}', '${DateHelper.format(outTime)}', '/uploads/access/out_${Date.now()}.jpg')`);
                
                if (RandomHelper.boolean(0.9)) {
                    const inTime = new Date(logDate);
                    inTime.setHours(RandomHelper.int(17, 22), RandomHelper.int(0, 59));
                    this.writer.addBatch('access_logs', 'plate_number, vehicle_type, direction, gate, status, resident_id, created_at, image_url', `('${vehicle.plate}', '${vehicle.type}', 'In', 'Cổng ${RandomHelper.item(['A', 'B'])}', 'Normal', '${ownerId}', '${DateHelper.format(inTime)}', '/uploads/access/in_${Date.now()}.jpg')`);
                }
            }
        });
    }

    generateFees(aptId, ownerId, aptCode, area, vehicles) {
        let elecIndex = RandomHelper.int(1000, 5000);
        let waterIndex = RandomHelper.int(500, 2000);

        for (let i = -1; i <= 6; i++) {
            const monthDate = DateHelper.addMonths(DateHelper.TODAY, -i);
            const period = DateHelper.getBillingPeriod(monthDate);
            const feeSuffix = `${(monthDate.getMonth() + 1).toString().padStart(2, '0')}${monthDate.getFullYear()}`;
            const dueDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 10);
            
            const getFeeStatusAndPayment = (amount, monthIndex) => {
                const rand = Math.random();
                let status = 'Đã thanh toán';

                if (monthIndex < 0) {
                    if (rand < 0.4) status = 'Chưa thanh toán';
                    else if (rand < 0.6) status = 'Thanh toán một phần';
                } else if (monthIndex === 0) {
                    if (rand < 0.2) status = 'Chưa thanh toán';
                    else if (rand < 0.5) status = 'Thanh toán một phần';
                } else if (monthIndex === 1) {
                    if (rand < 0.1) status = 'Chưa thanh toán';
                    else if (rand < 0.2) status = 'Thanh toán một phần';
                }

                let paid = 0;
                let remaining = 0;

                if (status === 'Đã thanh toán') {
                    paid = amount;
                    remaining = 0;
                } else if (status === 'Chưa thanh toán') {
                    paid = 0;
                    remaining = amount;
                } else {
                    paid = Math.floor(amount * RandomHelper.int(10, 90) / 100);
                    remaining = amount - paid;
                }
                return { status, paid, remaining };
            };

            const elecUsage = RandomHelper.int(150, 400);
            const waterUsage = RandomHelper.int(15, 45);
            
            this.writer.addBatch('utility_readings', 'apartment_id, service_type, billing_period, old_index, new_index, recorded_date', `(${aptId}, 'Điện', '${period}', ${elecIndex}, ${elecIndex + elecUsage}, '${DateHelper.formatDateOnly(dueDate)}')`);
            this.writer.addBatch('utility_readings', 'apartment_id, service_type, billing_period, old_index, new_index, recorded_date', `(${aptId}, 'Nước', '${period}', ${waterIndex}, ${waterIndex + waterUsage}, '${DateHelper.formatDateOnly(dueDate)}')`);
            
            elecIndex += elecUsage;
            waterIndex += waterUsage;

            // Management Fee
            const pqlId = `PQL-${aptCode}-${feeSuffix}`;
            const pqlAmount = Math.round(area * CONFIG.FEE_PRICES.MANAGEMENT);
            const pqlState = getFeeStatusAndPayment(pqlAmount, i);
            
            this.writer.addBatch('fees', 'id, apartment_id, resident_id, fee_type_id, description, billing_period, due_date, total_amount, amount_paid, amount_remaining, status', `('${pqlId}', ${aptId}, '${ownerId}', 1, 'Phí Quản Lý ${period}', '${period}', '${DateHelper.formatDateOnly(dueDate)}', ${pqlAmount}, ${pqlState.paid}, ${pqlState.remaining}, '${pqlState.status}')`);
            this.writer.addBatch('fee_items', 'fee_id, item_name, unit, quantity, unit_price, amount', `('${pqlId}', 'Phí Quản Lý ${period}', 'm²', ${area}, ${CONFIG.FEE_PRICES.MANAGEMENT}, ${pqlAmount})`);
            this.writer.stats.fees++;

            // Electricity Fee
            const pdId = `PD-${aptCode}-${feeSuffix}`;
            const pdAmount = elecUsage * CONFIG.FEE_PRICES.ELECTRICITY;
            const pdState = getFeeStatusAndPayment(pdAmount, i);
            
            this.writer.addBatch('fees', 'id, apartment_id, resident_id, fee_type_id, description, billing_period, due_date, total_amount, amount_paid, amount_remaining, status', `('${pdId}', ${aptId}, '${ownerId}', 3, 'Tiền Điện ${period}', '${period}', '${DateHelper.formatDateOnly(dueDate)}', ${pdAmount}, ${pdState.paid}, ${pdState.remaining}, '${pdState.status}')`);
            this.writer.addBatch('fee_items', 'fee_id, item_name, unit, quantity, unit_price, amount', `('${pdId}', 'Điện sinh hoạt ${period}', 'kWh', ${elecUsage}, ${CONFIG.FEE_PRICES.ELECTRICITY}, ${pdAmount})`);
            this.writer.stats.fees++;

            // Water Fee
            const pnId = `PN-${aptCode}-${feeSuffix}`;
            const pnAmount = waterUsage * CONFIG.FEE_PRICES.WATER;
            const pnState = getFeeStatusAndPayment(pnAmount, i);
            
            this.writer.addBatch('fees', 'id, apartment_id, resident_id, fee_type_id, description, billing_period, due_date, total_amount, amount_paid, amount_remaining, status', `('${pnId}', ${aptId}, '${ownerId}', 4, 'Tiền Nước ${period}', '${period}', '${DateHelper.formatDateOnly(dueDate)}', ${pnAmount}, ${pnState.paid}, ${pnState.remaining}, '${pnState.status}')`);
            this.writer.addBatch('fee_items', 'fee_id, item_name, unit, quantity, unit_price, amount', `('${pnId}', 'Nước sinh hoạt ${period}', 'm³', ${waterUsage}, ${CONFIG.FEE_PRICES.WATER}, ${pnAmount})`);
            this.writer.stats.fees++;

            // Parking Fee
            const activeVehicles = vehicles.filter(v => v.regDate <= monthDate);
            
            if (activeVehicles.length > 0) {
                const pgxId = `PGX-${aptCode}-${feeSuffix}`;
                let pgxTotal = 0;
                const parkingItems = [];

                activeVehicles.forEach(v => {
                    const price = v.type === 'Ô tô' ? CONFIG.FEE_PRICES.PARKING_CAR : CONFIG.FEE_PRICES.PARKING_MOTORBIKE;
                    pgxTotal += price;
                    parkingItems.push({
                        name: `Phí gửi xe ${v.brand} (${v.plate})`,
                        price: price
                    });
                });

                const pgxState = getFeeStatusAndPayment(pgxTotal, i);

                this.writer.addBatch('fees', 'id, apartment_id, resident_id, fee_type_id, description, billing_period, due_date, total_amount, amount_paid, amount_remaining, status', `('${pgxId}', ${aptId}, '${ownerId}', 2, 'Phí Gửi Xe ${period}', '${period}', '${DateHelper.formatDateOnly(dueDate)}', ${pgxTotal}, ${pgxState.paid}, ${pgxState.remaining}, '${pgxState.status}')`);
                
                parkingItems.forEach(item => {
                    this.writer.addBatch('fee_items', 'fee_id, item_name, unit, quantity, unit_price, amount', `('${pgxId}', '${item.name}', 'Xe', 1, ${item.price}, ${item.price})`);
                });
                this.writer.stats.fees++;
            }

            if (pqlState.paid > 0) {
                const paymentDate = DateHelper.addDays(dueDate, RandomHelper.int(-5, 10));
                this.writer.addBatch('payment_history', 'fee_id, amount, payment_method, payment_date, processed_by', `('${pqlId}', ${pqlState.paid}, '${RandomHelper.item(['Chuyển khoản', 'Tiền mặt', 'Ví điện tử'])}', '${DateHelper.formatDateOnly(paymentDate)}', 'ID0002')`);
            }
        }
    }

    generateSupplementaryData() {
        console.log('📋 Generating supplementary data...');
        
        this.generateNotifications();
        this.generateReports();
        this.generateServiceBookings();
        this.generateVisitors();
        this.generateTemporaryResidence();
        this.generateProfileEditRequests();
        this.generateFundCampaigns();
        this.generateReviews();
        this.generateAssets();
        this.generateAuditLogs();
    }

    generateNotifications() {
        console.log('   - Notifications...');
        
        const templates = [
            { type: 1, title: 'Thông báo cắt điện bảo trì', content: 'Kính gửi Quý cư dân, Tòa nhà sẽ tiến hành cắt điện bảo trì hệ thống điện từ 8h-12h ngày {date}. Vui lòng chuẩn bị và sắp xếp công việc hợp lý.' },
            { type: 1, title: 'Khẩn cấp: Sự cố thang máy', content: 'Thang máy tòa {building} tạm ngưng hoạt động để khắc phục sự cố. Dự kiến hoàn thành trong 2-3 giờ.' },
            { type: 2, title: 'Họp cư dân định kỳ', content: 'Ban quản lý tòa nhà kính mời các chủ hộ tham dự buổi họp cư dân vào {time} ngày {date} tại Hội trường tầng 1.' },
            { type: 2, title: 'Phun thuốc diệt muỗi', content: 'Tòa nhà sẽ tiến hành phun thuốc diệt muỗi vào sáng thứ 7 tuần này. Vui lòng đóng cửa sổ.' },
            { type: 3, title: 'Nhắc nhở đóng phí tháng {month}', content: 'Kính gửi Quý cư dân, hạn đóng phí quản lý tháng {month} là ngày 10. Vui lòng thanh toán đúng hạn để tránh phát sinh lãi suất.' },
            { type: 4, title: 'Khai trương dịch vụ mới', content: 'Chúc mừng khai trương dịch vụ {service} tại tòa nhà. Ưu đãi 20% cho cư dân trong tháng đầu!' }
        ];

        for (let i = 0; i < 300; i++) {
            const tpl = RandomHelper.item(templates);
            const createdAt = DateHelper.randomBetween(DateHelper.SIX_MONTHS_AGO, DateHelper.TODAY);
            const maxSchedule = DateHelper.addDays(DateHelper.TODAY, 7);
            const scheduledAt = DateHelper.randomBetween(createdAt, maxSchedule);

            const id = this.idGen.generateDailyId('TB', scheduledAt);
            const isSent = scheduledAt <= DateHelper.TODAY;
            
            let content = tpl.content
                .replace('{date}', DateHelper.formatDateOnly(scheduledAt))
                .replace('{time}', `${RandomHelper.int(14, 19)}h00`)
                .replace('{month}', scheduledAt.getMonth() + 1)
                .replace('{building}', RandomHelper.item(['A', 'B']))
                .replace('{service}', 'Phòng Gym');
            
            this.writer.addBatch('notifications', 'id, title, content, type_id, target, scheduled_at, is_sent, created_by, created_at', `('${id}', '${tpl.title.replace('{month}', scheduledAt.getMonth() + 1)}', '${content}', ${tpl.type}, 'Tất cả Cư dân', '${DateHelper.format(scheduledAt)}', ${isSent ? 1 : 0}, 'ID0001', '${DateHelper.format(createdAt)}')`);
            
            if (RandomHelper.boolean(0.3)) {
                const fileName = `thongbao_${id}.jpg`;
                this.writer.addBatch('notification_attachments', 'notification_id, file_name, file_path, file_size', `('${id}', '${fileName}', '/uploads/notifications/${id}/${fileName}', ${RandomHelper.int(500, 3000)})`);
            }

            if (isSent) {
                const eligibleResidents = this.activeResidents.filter(r => {
                    return r.moveInDate <= scheduledAt;
                });

                eligibleResidents.forEach(resident => {
                    const isRead = RandomHelper.boolean(0.7);
                    const readAt = isRead 
                        ? DateHelper.format(DateHelper.randomBetween(scheduledAt, DateHelper.TODAY))
                        : 'NULL';

                    this.writer.addBatch('notification_recipients', 'notification_id, recipient_id, is_read, read_at', `('${id}', '${resident.id}', ${isRead ? 1 : 0}, ${isRead ? `'${readAt}'` : 'NULL'})`);
                });
            }
            this.writer.stats.notifications++;
        }
    }

    generateReports() {
        console.log('   - Reports...');
        
        const reportTypes = [
            { title: 'Vỡ ống nước', location: 'Hầm B1', priority: 'Khẩn cấp', desc: 'Phát hiện ống nước bị vỡ gây ngập úng tại hầm để xe.' },
            { title: 'Đèn hành lang hỏng', location: 'Hành lang tầng {floor}', priority: 'Trung bình', desc: 'Đèn hành lang không sáng, cần thay bóng đèn mới.' },
            { title: 'Thang máy rung lắc', location: 'Thang máy {building}1', priority: 'Cao', desc: 'Thang máy có tiếng động lạ và rung lắc khi vận hành.' },
            { title: 'Rác thải bừa bãi', location: 'Khu vực thang bộ', priority: 'Thấp', desc: 'Phát hiện rác thải được bỏ bừa bãi tại khu vực thang bộ.' },
            { title: 'Ồn ào sau 22h', location: 'Căn hộ tầng trên', priority: 'Trung bình', desc: 'Căn hộ tầng trên gây ồn ào sau 22h ảnh hưởng đến sinh hoạt.' },
            { title: 'Cửa ra vào hư hỏng', location: 'Cửa chính tòa {building}', priority: 'Cao', desc: 'Cửa tự động không đóng mở được, cần sửa chữa gấp.' }
        ];

        for (let i = 0; i < 80; i++) {
            const tpl = RandomHelper.item(reportTypes);
            const reporter = RandomHelper.item(this.activeResidents.filter(r => r.isOwner));
            
            const minDate = reporter.moveInDate;
            const date = DateHelper.randomBetween(minDate, DateHelper.TODAY);
            const id = this.idGen.generateDailyId('SC', date);
            
            const status = RandomHelper.weighted([
                { value: 'Mới', weight: 10 },
                { value: 'Đang xử lý', weight: 20 },
                { value: 'Hoàn thành', weight: 60 },
                { value: 'Đã hủy', weight: 10 }
            ]);

            const location = tpl.location
                .replace('{floor}', RandomHelper.int(1, 31))
                .replace('{building}', RandomHelper.item(['A', 'B']));

            let ratingSQL = 'NULL';
            let feedbackSQL = 'NULL';
            let completedAtSQL = 'NULL';

            if (status === 'Hoàn thành') {
                if (RandomHelper.boolean(0.6)) {
                    const rating = RandomHelper.weighted([
                        { value: 5, weight: 40 },
                        { value: 4, weight: 35 },
                        { value: 3, weight: 15 },
                        { value: 2, weight: 7 },
                        { value: 1, weight: 3 }
                    ]);
                    const feedbacks = [
                        'Xử lý nhanh chóng, hiệu quả',
                        'Rất hài lòng với thái độ BQL',
                        'Đã khắc phục xong, cảm ơn',
                        'Cần cải thiện thời gian phản hồi',
                        'Nhân viên nhiệt tình, chuyên nghiệp'
                    ];
                    ratingSQL = rating;
                    feedbackSQL = `'${RandomHelper.item(feedbacks)}'`;
                }
                
                const completedDate = DateHelper.addDays(date, RandomHelper.int(1, 5));
                completedAtSQL = `'${DateHelper.format(completedDate)}'`;
            }

            this.writer.addBatch('reports', 'id, title, description, location, reported_by, status, priority, created_at, rating, feedback, completed_at', `('${id}', '${tpl.title}', '${tpl.desc}', '${location}', '${reporter.id}', '${status}', '${tpl.priority}', '${DateHelper.format(date)}', ${ratingSQL}, ${feedbackSQL}, ${completedAtSQL})`);
            
            if (RandomHelper.boolean(0.6)) {
                const fileName = `suco_${id}.jpg`;
                this.writer.addBatch('report_attachments', 'report_id, file_name, file_path, file_size', `('${id}', '${fileName}', '/uploads/reports/${id}/${fileName}', ${RandomHelper.int(800, 4000)})`);
            }
            this.writer.stats.reports++;
        }
    }

    generateServiceBookings() {
        console.log('   - Service Bookings...');
        
        for (let i = 0; i < 50; i++) {
            const resident = RandomHelper.item(this.activeResidents);
            const serviceTypeId = RandomHelper.int(1, 6);
            const bookingDate = DateHelper.randomBetween(DateHelper.SIX_MONTHS_AGO, DateHelper.addDays(DateHelper.TODAY, 30));
            const status = bookingDate > DateHelper.TODAY ? 'Chờ duyệt' : RandomHelper.weighted([
                { value: 'Đã duyệt', weight: 70 },
                { value: 'Hoàn thành', weight: 20 },
                { value: 'Đã hủy', weight: 10 }
            ]);
            const quantity = RandomHelper.int(1, 4);
            const basePrice = [500000, 30000, 200000, 8500000, 3500000, 120000][serviceTypeId - 1];
            const totalAmount = basePrice * quantity;

            this.writer.addBatch('service_bookings', 'resident_id, service_type_id, booking_date, quantity, total_amount, status', `('${resident.id}', ${serviceTypeId}, '${DateHelper.format(bookingDate)}', ${quantity}, ${totalAmount}, '${status}')`);
        }

        for (let i = 1; i <= 6; i++) {
            this.writer.addBatch('service_attachments', 'service_type_id, file_name, file_path', `(${i}, 'service_${i}_banner.jpg', '/uploads/services/${i}/banner.jpg')`);
        }
    }

    generateVisitors() {
        console.log('   - Visitors...');
        
        for (let i = 0; i < 200; i++) {
            const apt = RandomHelper.item(this.activeApartments);
            const checkInTime = DateHelper.randomBetween(DateHelper.SIX_MONTHS_AGO, DateHelper.TODAY);
            const stayDuration = RandomHelper.int(30, 300); // 30 mins to 5 hours
            const checkOutTime = DateHelper.addDays(checkInTime, stayDuration / (24 * 60));
            const visitorName = VietnameseData.generateName();
            const identityCard = RandomHelper.boolean(0.7) ? VietnameseData.generateCCCD() : null;

            this.writer.addBatch('visitors', 'apartment_id, visitor_name, identity_card, check_in_time, check_out_time, security_guard_id', `(${apt.id}, '${visitorName}', ${identityCard ? `'${identityCard}'` : 'NULL'}, '${DateHelper.format(checkInTime)}', '${DateHelper.format(checkOutTime)}', 'ID0003')`);
        }
    }

    generateTemporaryResidence() {
        console.log('   - Temporary Residence...');
        
        // Fix: Standardize columns for temporary_residence
        const trColumns = 'resident_id, type, start_date, end_date, reason, status, approved_by';

        for (let i = 0; i < 25; i++) {
            const resident = RandomHelper.item(this.activeResidents);
            const type = RandomHelper.item(['Tạm vắng', 'Tạm trú']);
            const startDate = DateHelper.randomBetween(DateHelper.ONE_YEAR_AGO, DateHelper.SIX_MONTHS_AGO);
            const endDate = DateHelper.addDays(startDate, RandomHelper.int(7, 60));
            const reasons = type === 'Tạm vắng' 
                ? ['Du lịch gia đình', 'Công tác dài hạn', 'Điều trị y tế', 'Thăm người thân', 'Học tập']
                : ['Người nhà lên thăm', 'Thuê phòng trọ ngắn hạn', 'Bạn bè ở nhờ', 'Ôn thi đại học', 'Thực tập'];
            const reason = RandomHelper.item(reasons);

            this.writer.addBatch('temporary_residence', trColumns, `('${resident.id}', '${type}', '${DateHelper.formatDateOnly(startDate)}', '${DateHelper.formatDateOnly(endDate)}', '${reason}', 'Đã duyệt', 'ID0001')`);
        }

        for (let i = 0; i < 15; i++) {
            const resident = RandomHelper.item(this.activeResidents);
            const type = RandomHelper.item(['Tạm vắng', 'Tạm trú']);
            const startDate = DateHelper.randomBetween(DateHelper.TODAY, DateHelper.addDays(DateHelper.TODAY, 30));
            const endDate = DateHelper.addDays(startDate, RandomHelper.int(7, 45));
            const reasons = type === 'Tạm vắng' 
                ? ['Đi công tác', 'Nghỉ dưỡng', 'Thăm con ở xa']
                : ['Bạn bè tạm trú', 'Người giúp việc ở lại', 'Thợ sửa chữa'];
            const reason = RandomHelper.item(reasons);

            // Pass NULL for approved_by
            this.writer.addBatch('temporary_residence', trColumns, `('${resident.id}', '${type}', '${DateHelper.formatDateOnly(startDate)}', '${DateHelper.formatDateOnly(endDate)}', '${reason}', 'Chờ duyệt', NULL)`);
        }
    }

    generateProfileEditRequests() {
        console.log('   - Profile Edit Requests...');
        
        for (let i = 0; i < 30; i++) {
            const resident = RandomHelper.item(this.activeResidents);
            const date = DateHelper.randomBetween(DateHelper.SIX_MONTHS_AGO, DateHelper.TODAY);
            
            const changeTypes = [
                { field: 'phone', value: VietnameseData.generatePhone(), reason: 'Đổi số điện thoại mới' },
                { field: 'email', value: `${resident.id.toLowerCase()}@newmail.com`, reason: 'Cập nhật email cá nhân' },
                { field: 'occupation', value: RandomHelper.item(VietnameseData.OCCUPATIONS), reason: 'Thay đổi công việc' },
                { field: 'hometown', value: RandomHelper.item(VietnameseData.HOMETOWNS), reason: 'Chỉnh sửa thông tin quê quán' }
            ];
            
            const change = RandomHelper.item(changeTypes);
            const requestedChanges = `{"${change.field}": "${change.value}"}`;
            
            const status = RandomHelper.weighted([
                { value: 'Chờ duyệt', weight: 30 },
                { value: 'Đã duyệt', weight: 60 },
                { value: 'Từ chối', weight: 10 }
            ]);

            this.writer.addBatch('profile_edit_requests', 'resident_id, requested_changes, reason, status, created_at', `('${resident.id}', '${requestedChanges}', '${change.reason}', '${status}', '${DateHelper.format(date)}')`);
        }
    }

    generateFundCampaigns() {
        console.log('   - Fund Campaigns & Donations...');
        
        this.writer.addBatch('fund_campaigns', 'id, title, description, start_date, end_date, target_amount, current_amount, status, created_by', "(1, 'Quỹ Vui Hội Trăng Rằm 2024', 'Tổ chức chương trình Trung thu cho trẻ em trong tòa nhà. Quỹ sẽ được dùng để mua đèn lồng, bánh kẹo và tổ chức các trò chơi vui nhộn.', '2024-08-01', '2024-09-01', 20000000, 25500000, 'Closed', 'ID0002')");
        this.writer.addBatch('fund_campaigns', 'id, title, description, start_date, end_date, target_amount, current_amount, status, created_by', "(2, 'Quỹ Khuyến Học 2025', 'Hỗ trợ học bổng cho con em cư dân có hoàn cảnh khó khăn, học giỏi. Mỗi suất học bổng 5 triệu đồng.', '2025-01-01', '2025-12-31', 50000000, 18750000, 'Active', 'ID0002')");
        this.writer.addBatch('fund_campaigns', 'id, title, description, start_date, end_date, target_amount, current_amount, status, created_by', "(3, 'Quỹ Tết Sum Vầy 2026', 'Tổ chức chương trình Tết cộng đồng, trao quà cho người cao tuổi và trẻ em. Dự kiến tổ chức tại Hội trường tầng 1.', '2026-01-01', '2026-02-01', 100000000, 0, 'Planned', 'ID0002')");

        // Donations Campaign 1
        const campaign1Donors = RandomHelper.items(this.activeResidents.filter(r => r.isOwner), 35);
        campaign1Donors.forEach(donor => {
            const amount = RandomHelper.item([50000, 100000, 200000, 500000, 1000000, 2000000]);
            const method = RandomHelper.weighted([{ value: 'AppPayment', weight: 50 }, { value: 'Transfer', weight: 35 }, { value: 'Cash', weight: 15 }]);
            const isAnonymous = RandomHelper.boolean(0.15);
            this.writer.addBatch('donations', 'campaign_id, resident_id, amount, payment_method, is_anonymous', `(1, '${donor.id}', ${amount}, '${method}', ${isAnonymous ? 1 : 0})`);
        });

        // Donations Campaign 2
        const campaign2Donors = RandomHelper.items(this.activeResidents.filter(r => r.isOwner), 25);
        campaign2Donors.forEach(donor => {
            const amount = RandomHelper.item([100000, 200000, 500000, 1000000]);
            const method = RandomHelper.weighted([{ value: 'AppPayment', weight: 60 }, { value: 'Transfer', weight: 30 }, { value: 'Cash', weight: 10 }]);
            const isAnonymous = RandomHelper.boolean(0.2);
            this.writer.addBatch('donations', 'campaign_id, resident_id, amount, payment_method, is_anonymous', `(2, '${donor.id}', ${amount}, '${method}', ${isAnonymous ? 1 : 0})`);
        });
    }

    generateReviews() {
        console.log('   - Reviews...');
        
        const feedbacks = [
            'Dịch vụ tốt, nhân viên nhiệt tình',
            'Cần cải thiện thái độ phục vụ',
            'Rất hài lòng với chất lượng dịch vụ',
            'Ban quản lý làm việc hiệu quả',
            'Mong BQL xử lý các sự cố nhanh hơn',
            'Môi trường sống tuyệt vời',
            'Cần nâng cấp hệ thống an ninh',
            'Tòa nhà sạch sẽ, tiện nghi hiện đại',
            'Giá phí hợp lý so với mặt bằng chung',
            'Cần thêm nhiều tiện ích cho cư dân'
        ];

        for (let i = 0; i < 150; i++) {
            const resident = RandomHelper.item(this.activeResidents);
            const rating = RandomHelper.weighted([
                { value: 5, weight: 35 },
                { value: 4, weight: 40 },
                { value: 3, weight: 15 },
                { value: 2, weight: 7 },
                { value: 1, weight: 3 }
            ]);
            const feedback = RandomHelper.item(feedbacks);
            const status = RandomHelper.weighted([
                { value: 'Mới', weight: 30 },
                { value: 'Đã xem', weight: 70 }
            ]);

            this.writer.addBatch('reviews', 'resident_id, rating, feedback, status', `('${resident.id}', ${rating}, '${feedback}', '${status}')`);
        }
    }

    generateAssets() {
        console.log('   - Assets & Maintenance...');
        
        const assets = [
            { name: 'Thang máy A1', code: 'TS001', location: 'Tòa A', price: 500000000 },
            { name: 'Thang máy A2', code: 'TS002', location: 'Tòa A', price: 500000000 },
            { name: 'Thang máy B1', code: 'TS003', location: 'Tòa B', price: 500000000 },
            { name: 'Thang máy B2', code: 'TS004', location: 'Tòa B', price: 500000000 },
            { name: 'Máy phát điện Cummins 500KVA', code: 'TS005', location: 'Hầm B3', price: 800000000 },
            { name: 'Hệ thống bơm tăng áp', code: 'TS006', location: 'Hầm B2', price: 150000000 },
            { name: 'Bàn ghế Sofa sảnh A', code: 'TS007', location: 'Sảnh A', price: 50000000 },
            { name: 'Bàn Lễ tân tòa A', code: 'TS008', location: 'Sảnh A', price: 30000000 },
            { name: 'Hệ thống Camera giám sát (50 camera)', code: 'TS009', location: 'Toàn tòa', price: 200000000 },
            { name: 'Hệ thống PCCC tự động', code: 'TS010', location: 'Toàn tòa', price: 1000000000 },
            { name: 'Bình chữa cháy CO2 (100 bình)', code: 'TS011', location: 'Các tầng', price: 50000000 },
            { name: 'Máy lạnh sảnh chính (10 cái)', code: 'TS012', location: 'Sảnh', price: 150000000 }
        ];

        assets.forEach((asset, idx) => {
            const purchaseDate = DateHelper.randomBetween(new Date(2018, 0, 1), new Date(2020, 11, 31));
            const warrantyYears = [3, 5, 10][idx % 3];
            const warrantyExpiry = DateHelper.addMonths(purchaseDate, warrantyYears * 12);
            const status = warrantyExpiry > DateHelper.TODAY && RandomHelper.boolean(0.9) ? 'Đang hoạt động' : RandomHelper.item(['Đang hoạt động', 'Đang bảo trì']);

            this.writer.addBatch('assets', 'id, asset_code, name, location, purchase_date, price, status, warranty_expiry_date, supplier_info', `(${idx + 1}, '${asset.code}', '${asset.name}', '${asset.location}', '${DateHelper.formatDateOnly(purchaseDate)}', ${asset.price}, '${status}', '${DateHelper.formatDateOnly(warrantyExpiry)}', 'Công ty TNHH Thiết bị XYZ - SĐT: 024.3888.9999')`);

            for (let m = 0; m < 6; m++) {
                const scheduleDate = DateHelper.addMonths(DateHelper.TODAY, -m);
                const completedDate = DateHelper.addDays(scheduleDate, RandomHelper.int(0, 3));
                const maintenanceStatus = m === 0 ? RandomHelper.item(['Lên lịch', 'Đang thực hiện']) : 'Hoàn thành';
                const cost = RandomHelper.int(500000, 5000000);

                this.writer.addBatch('maintenance_schedules', 'asset_id, title, description, scheduled_date, completed_date, technician_name, cost, status', `(${idx + 1}, 'Bảo trì định kỳ ${asset.name} T${scheduleDate.getMonth() + 1}/${scheduleDate.getFullYear()}', 'Kiểm tra, bôi trơn, thay thế phụ tùng hư hỏng', '${DateHelper.formatDateOnly(scheduleDate)}', ${maintenanceStatus === 'Hoàn thành' ? `'${DateHelper.formatDateOnly(completedDate)}'` : 'NULL'}, 'Công ty Bảo trì ABC', ${cost}, '${maintenanceStatus}')`);
            }
        });
    }

    generateAuditLogs() {
        console.log('   - Audit Logs...');
        
        const actions = [
            { type: 'UPDATE', entity: 'fees', description: 'Cập nhật trạng thái phí' },
            { type: 'CREATE', entity: 'notifications', description: 'Tạo thông báo mới' },
            { type: 'UPDATE', entity: 'vehicles', description: 'Duyệt đăng ký xe' },
            { type: 'DELETE', entity: 'visitors', description: 'Xóa thông tin khách' },
            { type: 'UPDATE', entity: 'reports', description: 'Xử lý sự cố' },
            { type: 'CREATE', entity: 'residents', description: 'Thêm cư dân mới' },
            { type: 'UPDATE', entity: 'temporary_residence', description: 'Duyệt tạm trú/tạm vắng' }
        ];

        for (let i = 0; i < 200; i++) {
            const action = RandomHelper.item(actions);
            const user = RandomHelper.item(['ID0001', 'ID0002']);
            const time = DateHelper.randomBetween(DateHelper.SIX_MONTHS_AGO, DateHelper.TODAY);
            const entityId = RandomHelper.int(1, 100);

            this.writer.addBatch('audit_logs', 'user_id, action_type, entity_name, entity_id, created_at, ip_address, user_agent', `('${user}', '${action.type}', '${action.entity}', '${entityId}', '${DateHelper.format(time)}', '${RandomHelper.ip()}', '${RandomHelper.item(USER_AGENTS)}')`);
        }
    }
}

// ==================== MAIN EXECUTION ====================
const generator = new BluemoonDataGenerator();
generator.generate();