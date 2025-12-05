// backend/app.js

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import Database (chỉ để kiểm tra kết nối lúc khởi động)
require('./config/db'); 

// Khởi tạo App
const app = express();
const PORT = process.env.PORT || 3000;

// =======================
// 1. MIDDLEWARE
// =======================

// Cho phép Frontend gọi API (CORS)
app.use(cors());

// Cho phép đọc dữ liệu JSON từ body request
app.use(express.json());

// Cho phép đọc dữ liệu form (x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// Cấu hình thư mục Static để truy cập file upload (ảnh báo cáo, thông báo)
// Ví dụ: http://localhost:3000/uploads/notifications/abc.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =======================
// 2. ROUTES (Định tuyến)
// =======================
// Chúng ta sẽ tạo các file này ở các bước sau. 
// Hiện tại mình comment lại để app.js không bị lỗi khi chưa có file.

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/residents', require('./routes/residentRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/incidents', require('./routes/incidentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Route kiểm tra server sống hay chết
app.get('/', (req, res) => {
    res.send('🚀 BlueMoon Backend API is running!');
});

// Middleware xử lý lỗi tập trung (Global Error Handler)
// Giúp app không bị crash khi có lỗi bất ngờ
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Đã có lỗi xảy ra ở phía Server!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// =======================
// 3. START SERVER
// =======================

// [MỚI] Khởi động các tác vụ nền (Cron Jobs)
require('./jobs/invoiceNotifier').start();

app.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(`Server is running on port: ${PORT}`);
    console.log(`Link: http://localhost:${PORT}`);
    console.log(`==========================================`);
});