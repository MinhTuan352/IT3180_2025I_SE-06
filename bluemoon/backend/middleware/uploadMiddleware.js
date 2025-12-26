// File: backend/middleware/uploadMiddleware.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình nơi lưu trữ
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Tự động chọn thư mục dựa trên loại file hoặc field name
        const baseUrl = req.baseUrl || '';

        if (baseUrl.includes('/vehicles')) {
            uploadPath = 'public/uploads/vehicles';
        } else if (baseUrl.includes('/incidents')) {
            uploadPath = 'public/uploads/incidents';
        } else if (baseUrl.includes('/services')) {
            uploadPath = 'public/uploads/services';
        } else if (baseUrl.includes('/residents') || baseUrl.includes('/users')) {
            uploadPath = 'public/uploads/avatars';
        } else if (baseUrl.includes('/notifications')) {
            uploadPath = 'public/uploads/notifications';
        }

        // Tạo thư mục nếu chưa tồn tại
        if (!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Đổi tên file: timestamp-tên-gốc (để tránh trùng)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Bộ lọc file (Chỉ chấp nhận ảnh)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, jpeg)!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 10MB
    fileFilter: fileFilter
});

module.exports = upload;