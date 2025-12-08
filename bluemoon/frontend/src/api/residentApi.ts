// src/api/residentApi.ts
import axiosClient from './axiosClient';

// 1. Định nghĩa kiểu dữ liệu Cư dân (Khớp với init.sql & Response API)
export interface Resident {
  id: string;               // R0001
  full_name: string;        // Trần Văn Hộ
  apartment_code?: string;  // A-101 (Được join từ bảng apartments)
  apartment_id: number;     // 1
  role: 'owner' | 'member'; // Chủ hộ / Thành viên
  phone: string;
  email: string;
  status: string;           // Đang sinh sống, Đã chuyển đi...

  // Các trường chi tiết khác (dùng cho trang Detail/Edit)
  dob?: string;
  gender?: string;
  cccd?: string;
  hometown?: string;
  occupation?: string;
  user_id?: string | null;  // ID tài khoản User liên kết (nếu có)
}

// Response chuẩn cho danh sách
interface ResidentListResponse {
  success: boolean;
  data: Resident[];
  total?: number;
}

export const residentApi = {
  // Lấy danh sách cư dân (có thể thêm params tìm kiếm sau này)
  getAll: async (params?: any): Promise<Resident[]> => {
    const url = '/residents';
    try {
      const response = await axiosClient.get<ResidentListResponse>(url, { params });
      // Trả về mảng data. Nếu backend trả về { data: [...] } thì lấy .data
      // Tùy chỉnh dòng này dựa trên thực tế backend của bạn trả về
      return (response.data as any).data || (response.data as any) || [];
    } catch (error) {
      console.error("Lỗi fetch Residents:", error);
      throw error;
    }
  },

  // Lấy chi tiết 1 cư dân
  getById: async (id: string): Promise<Resident> => {
    const url = `/residents/${id}`;
    const response = await axiosClient.get(url);
    return response.data; // Hoặc response.data.data
  },

  // Tạo cư dân mới
  create: async (data: Partial<Resident>): Promise<Resident> => {
    const url = '/residents';
    const response = await axiosClient.post(url, data);
    return response.data;
  },

  // Cập nhật cư dân
  update: async (id: string, data: Partial<Resident>): Promise<Resident> => {
    const url = `/residents/${id}`;
    const response = await axiosClient.put(url, data);
    return response.data;
  },

  // Xóa cư dân (nếu cần)
  delete: async (id: string): Promise<void> => {
    const url = `/residents/${id}`;
    await axiosClient.delete(url);
  },

  // ========================================================
  // [MỚI] API CHO CƯ DÂN XEM/CẬP NHẬT PROFILE CỦA CHÍNH MÌNH
  // ========================================================

  // Cư dân lấy thông tin cá nhân của chính mình
  getMyProfile: async (): Promise<Resident> => {
    const url = '/residents/me';
    const response = await axiosClient.get(url);
    // Trả về data từ response { success: true, data: {...} }
    return (response.data as any).data || response.data;
  },

  // Cư dân cập nhật thông tin cá nhân
  updateMyProfile: async (data: Partial<Resident>): Promise<{ success: boolean; message: string }> => {
    const url = '/residents/me';
    const response = await axiosClient.put(url, data);
    return response.data;
  }
};