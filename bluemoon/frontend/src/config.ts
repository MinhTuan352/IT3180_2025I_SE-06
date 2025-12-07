// frontend/src/config.ts

// Vite cung cấp biến import.meta.env.MODE để biết đang chạy dev hay prod
const isDev = import.meta.env.MODE === 'development';

// Nếu đang chạy dev thì dùng localhost:4000
// Nếu đã build (production) thì dùng link Backend Render của bạn
export const API_BASE_URL = isDev 
  ? 'http://localhost:4000/api' 
  : 'https://it3180-2025i-se-06.onrender.com/api';