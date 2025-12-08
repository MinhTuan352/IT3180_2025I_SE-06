// src/api/authApi.ts
import { type User } from '../contexts/AuthContext';
import { type LoginFormInputs } from '../schemas/auth.schema';
import axiosClient from './axiosClient';

// Định nghĩa cấu trúc GỌN mà Frontend muốn dùng
export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: async (data: LoginFormInputs): Promise<LoginResponse> => {
    // Gọi API
    const response = await axiosClient.post('/auth/login', data);

    // Backend trả về: { success, message, data: { user, accessToken, refreshToken } }
    // Dữ liệu NESTED trong "data", và token có tên là "accessToken"
    const backendData = response.data;

    // Bóc tách dữ liệu - LẤY TỪ NESTED "data" object
    return {
      user: backendData.data.user,
      token: backendData.data.accessToken,
    };
  },

  getLoginHistory: async () => {
    // GET /api/auth/history
    return axiosClient.get('/auth/history');
  },

  // [MỚI] Đổi mật khẩu
  changePassword: async (data: { oldPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.post('/auth/change-password', data);
    return response.data;
  },

  // [MỚI] Quên mật khẩu - Gửi yêu cầu reset
  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.post('/auth/forgot-password', { email });
    return response.data;
  },
};
