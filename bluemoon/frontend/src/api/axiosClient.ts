// src/api/axiosClient.ts
import axios from 'axios';

const axiosClient = axios.create({
  // 👇 SỬA DÒNG NÀY: Thay '/api' thành đường dẫn đầy đủ
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm Interceptor (middleware) cho request
axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Gắn token vào header Authorization
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm Interceptor cho response
// Để xử lý lỗi 401 (Unauthorized) - tự động logout
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Chỉ xử lý lỗi 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      // Chỉ reload nếu user ĐÃ ĐĂNG NHẬP (có token) 
      // hoặc KHÔNG Ở TRANG signin
      if (localStorage.getItem('token') || window.location.pathname !== '/signin') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.replace('/signin');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;