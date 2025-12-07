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

    // Backend trả về: { success, message, token, refreshToken, user }
    // Token và user ở ROOT level, không nested trong data
    const backendData = response.data;

    // Bóc tách dữ liệu - LẤY TRỰC TIẾP TỪ ROOT
    return {
      user: backendData.user,
      token: backendData.token,
    };
  },
};