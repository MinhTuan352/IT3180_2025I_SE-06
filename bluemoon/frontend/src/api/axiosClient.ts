// src/api/axiosClient.ts
import axios from 'axios';


// Logic tự động xác định URL Backend
// Ưu tiên 1: Nếu đang chạy trên web thật (deploy) -> Dùng link Production cứng (để tránh trường hợp build dính biến môi trường localhost)
// Ưu tiên 2: Biến môi trường VITE_API_BASE_URL
// Ưu tiên 3: Localhost
let baseUrl = 'http://localhost:3000';

if (typeof window !== 'undefined' && (window.location.hostname === 'bluemoon-frontend-3xgx.onrender.com' || window.location.hostname.includes('onrender.com'))) {
  console.log('Detected Production Environment: Using Cloud Backend');
  baseUrl = 'https://it3180-2025i-se-06.onrender.com';
} else if (import.meta.env.VITE_API_BASE_URL) {
  baseUrl = import.meta.env.VITE_API_BASE_URL;
}

console.log('Current API_BASE_URL:', baseUrl);

export const API_BASE_URL = baseUrl;

const axiosClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
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