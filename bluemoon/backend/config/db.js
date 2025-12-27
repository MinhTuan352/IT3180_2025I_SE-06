// File: backend/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Cấu hình SSL cho TiDB (Render)
// Nếu đang chạy local (XAMPP) thì không cần SSL
const sslConfig = process.env.DB_HOST === 'localhost'
    ? null
    : {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    };

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306, // Thêm port vào (TiDB dùng 4000)
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    ssl: sslConfig, // <--- QUAN TRỌNG: Thêm dòng này
    // Fix timezone: Trả DATE/DATETIME dạng string để tránh bị shift timezone
    dateStrings: ['DATE', 'DATETIME']
});

// Kiểm tra kết nối ngay khi khởi động
pool.getConnection()
    .then(connection => {
        console.log("✅ MySQL Database Connected Successfully!");
        connection.release();
    })
    .catch(error => {
        console.error("❌ MySQL Connection Failed:", error.message);
    });

module.exports = pool;