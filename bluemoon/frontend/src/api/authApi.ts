// src/api/authApi.ts
import { type User } from '../contexts/AuthContext'; // Import User type từ AuthContext
import { type LoginFormInputs } from '../schemas/auth.schema';
import axiosClient from './axiosClient';

// Định nghĩa kiểu dữ liệu trả về từ API
export interface LoginResponse {
  token: string;
  user: User; // Backend trả về thông tin user (gồm id, username, role)
}

export const authApi = {
  // Chúng ta chỉ cần gửi username/password
  // Backend sẽ tự kiểm tra và trả về role
  login: async (data: LoginFormInputs): Promise<LoginResponse> => {
    // Sửa '/auth/login' cho đúng với endpoint backend của bạn
    const response = await axiosClient.post('/auth/login', data); 
    return response.data;
  },
};