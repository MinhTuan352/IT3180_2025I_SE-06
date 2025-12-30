// File: backend/scripts/setupDatabase.js

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Cấu hình kết nối Database
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',     // Điền mật khẩu MySQL của bạn nếu có
    multipleStatements: true // Cho phép chạy nhiều câu lệnh
};
const dbName = 'bluemoon_db';

/**
 * Hàm hỗ trợ chạy file SQL
 * Tự động chia nhỏ file thành từng câu lệnh để tránh lỗi quá tải gói tin (Packet too large)
 */
async function runSqlFile(connection, filePath) {
    const fileName = path.basename(filePath);

    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  CẢNH BÁO: Không tìm thấy file '${fileName}' tại đường dẫn:`);
        console.warn(`   ${filePath}`);
        return false;
    }

    console.log(`📂 Đang đọc file: ${fileName}...`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    // Tách file thành mảng các câu lệnh dựa trên dấu chấm phẩy (;)
    // Regex này tách lệnh kết thúc bằng ; và theo sau là xuống dòng
    const statements = sqlContent
        .split(/;\s*[\r\n]+/)
        .filter(stmt => stmt.trim().length > 0); // Loại bỏ dòng trống

    console.log(`⚡ Tìm thấy ${statements.length} câu lệnh. Đang thực thi...`);

    // Chạy tuần tự từng lệnh
    for (let i = 0; i < statements.length; i++) {
        try {
            await connection.query(statements[i]);

            // Log tiến độ mỗi 500 lệnh để người dùng biết không bị treo
            if ((i + 1) % 500 === 0) {
                console.log(`   ⏳ Đã chạy ${i + 1}/${statements.length} lệnh...`);
            }
        } catch (err) {
            // Log lỗi nhưng không dừng, để các lệnh khác vẫn chạy tiếp
            // (Ví dụ: Lỗi drop table không tồn tại thì cứ bỏ qua)
            console.error(`❌ Lỗi tại lệnh số ${i + 1}: ${err.message}`);
        }
    }
    console.log(`✅ Hoàn thành file ${fileName}.\n`);
    return true;
}

async function setupDatabase() {
    let connection;
    try {
        console.log('🔌 Đang kết nối đến MySQL Server...');
        connection = await mysql.createConnection(dbConfig);
        console.log('   -> Kết nối thành công.');

        // 1. Tạo & Chọn Database
        console.log(`🗄️  Thiết lập Database '${dbName}'...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.query(`USE \`${dbName}\`;`);
        console.log('   -> Database đã sẵn sàng.');

        // 2. Chạy init.sql (Cấu trúc bảng)
        // Đường dẫn: backend/scripts/ -> ../../database/init.sql
        const initPath = path.join(__dirname, '..', '..', 'database', 'init.sql');
        console.log('🏗️  BƯỚC 1: Khởi tạo cấu trúc bảng...');
        await runSqlFile(connection, initPath);

        // 3. Chạy bluemoon_full_data.sql (Dữ liệu mẫu)
        const seedPath = path.join(__dirname, '..', '..', 'database', 'bluemoon_full_data.sql');
        console.log('🌱 BƯỚC 2: Nạp dữ liệu mẫu (Seeding)...');
        const hasSeeding = await runSqlFile(connection, seedPath);

        if (!hasSeeding) {
            console.log('💡 Gợi ý: Bạn chưa tạo file dữ liệu mẫu.');
            console.log('   Hãy chạy lệnh: node database/generate_seeding.js');
        }



        console.log('🎉🎉🎉 CÀI ĐẶT DATABASE HOÀN TẤT! 🎉🎉🎉');

    } catch (error) {
        console.error('\n❌ LỖI NGHIÊM TRỌNG:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Đã đóng kết nối.');
        }
    }
}

// Chạy hàm chính
setupDatabase();