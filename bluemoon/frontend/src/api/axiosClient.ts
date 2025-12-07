// src/api/axiosClient.ts
import axios from 'axios';
import { API_BASE_URL } from '../config'; // <--- [QUAN TRỌNG] Import từ file config bước 1

const axiosClient = axios.create({
  // Thay thế chuỗi cứng '/api' bằng biến môi trường động
  baseURL: API_BASE_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm Interceptor cho request
axiosClient.interceptors.request.use(
  (config) => {
    // [LƯU Ý]: Kiểm tra xem lúc Login bạn lưu là 'token' hay 'access_token'
    // Để chắc chắn, bạn nên thống nhất 1 tên. Ở đây tôi giữ nguyên 'token' theo code của bạn.
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho response
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    if (response && response.status === 401) {
      // Chỉ logout nếu đang không ở trang login để tránh lặp vô tận
      if (window.location.pathname !== '/signin') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.replace('/signin');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;