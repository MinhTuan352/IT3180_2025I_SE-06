// src/api/axiosClient.ts
import axios from 'axios';
import { API_BASE_URL } from '../config';


const axiosClient = axios.create({
  // URL này trỏ đến proxy bạn đã cài trong vite.config.ts
  baseURL: API_BASE_URL,
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