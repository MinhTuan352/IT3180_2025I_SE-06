// src/api/authApi.ts
import { type User } from '../contexts/AuthContext';
import { type LoginFormInputs } from '../schemas/auth.schema';
import axiosClient from './axiosClient';

// 1. Định nghĩa cấu trúc JSON mà Backend trả về (Giống cái bạn vừa gửi)
interface BackendResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;  // Backend gọi là accessToken
    refreshToken: string;
  };
}

// 2. Định nghĩa cấu trúc GỌN mà Frontend muốn dùng
export interface LoginResponse {
  token: string; // Frontend gọi ngắn là token
  user: User;
}

export const authApi = {
  login: async (data: LoginFormInputs): Promise<LoginResponse> => {
    // Gọi API
    const response = await axiosClient.post<BackendResponse>('/auth/login', data);
    
    // response.data chính là cục JSON: { success: true, data: {...} }
    const backendData = response.data;

    // 3. Bóc tách dữ liệu (Mapping)
    return {
      user: backendData.data.user,           // Lấy user từ trong 'data'
      token: backendData.data.accessToken,   // Đổi tên accessToken -> token
    };
  },
};