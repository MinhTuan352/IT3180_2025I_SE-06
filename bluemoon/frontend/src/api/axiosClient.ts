// src/api/axiosClient.ts
import axios from 'axios';


const axiosClient = axios.create({
  // Sử dụng environment variable cho API URL
  // Development: http://localhost:3000/api
  // Production: https://it3180-2025i-se-06.onrender.com/api
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`,
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
    if (error.response && error.response.status === 401) {
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