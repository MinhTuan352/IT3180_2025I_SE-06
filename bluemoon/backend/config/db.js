// File: backend/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Sử dụng connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // BỔ SUNG QUAN TRỌNG:
    charset: 'utf8mb4' // Đảm bảo không lỗi font Tiếng Việt
});

// BỔ SUNG: Kiểm tra kết nối ngay khi khởi động server
pool.getConnection()
    .then(connection => {
        console.log("✅ MySQL Database Connected Successfully!");
        connection.release(); // Trả kết nối về pool ngay
    })
    .catch(error => {
        console.error("❌ MySQL Connection Failed:", error.message);
        console.error("   Kiểm tra lại file .env hoặc MySQL Service.");
    });

module.exports = pool;