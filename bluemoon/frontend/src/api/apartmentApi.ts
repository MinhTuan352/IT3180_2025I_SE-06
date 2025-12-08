// src/api/apartmentApi.ts
import axiosClient from './axiosClient';
import type { Resident } from './residentApi';

export interface Apartment {
  id: number;              // ID trong DB là INT (1, 2...)
  apartment_code: string;  // Mã hiển thị (A-101, B-205...)
  building: string;        // Tòa A, B
  floor: number;           // Tầng 1, 2
  area: number;            // Diện tích
  status: 'Đang sinh sống' | 'Trống' | 'Đang sửa chữa';

  // Dữ liệu kèm theo (nếu backend join sẵn hoặc chúng ta map ở frontend)
  residents?: Resident[];
}

export const apartmentApi = {
  // Lấy tất cả căn hộ để vẽ sơ đồ Tòa/Tầng
  getAll: async (): Promise<Apartment[]> => {
    const url = '/apartments';
    const response = await axiosClient.get(url);
    return (response.data as any).data || response.data || [];
  },

  // Lấy chi tiết 1 căn hộ (thường dùng cho trang Detail)
  getById: async (id: string | number): Promise<Apartment> => {
    const url = `/apartments/${id}`;
    const response = await axiosClient.get(url);
    return (response.data as any).data || response.data;
  },

  // Lấy cư dân của 1 căn hộ cụ thể (nếu API getById chưa bao gồm)
  getResidentsByApartment: async (apartmentId: number | string): Promise<Resident[]> => {
    const url = `/residents?apartment_id=${apartmentId}`; // Giả định backend hỗ trợ filter
    const response = await axiosClient.get(url);
    return (response.data as any).data || response.data || [];
  },

  // [MỚI] Cư dân lấy thông tin căn hộ của mình (kèm danh sách thành viên)
  getMyApartment: async (): Promise<any> => {
    const url = '/residents/my-apartment';
    const response = await axiosClient.get(url);
    return (response.data as any).data || response.data;
  }
};