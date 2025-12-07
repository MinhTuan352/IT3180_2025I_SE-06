// src/api/axiosClient.ts
import axios from 'axios';

const axiosClient = axios.create({
  // URL này trỏ đến proxy bạn đã cài trong vite.config.ts
  baseURL: '/api', 
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

// (Tùy chọn nâng cao) Thêm Interceptor cho response
// Để xử lý lỗi 401 (Unauthorized) - tự động logout
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // THÊM ĐIỀU KIỆN NÀY:
      // Chỉ reload nếu user ĐÃ ĐĂNG NHẬP (có token) 
      // hoặc KHÔNG Ở TRANG signin
      if (localStorage.getItem('token') || window.location.pathname !== '/signin') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.replace('/signin');
      }
    return Promise.reject(error);
  }
);

export default axiosClient;