// src/api/adminApi.ts
import axiosClient from './axiosClient';

// 1. Định nghĩa kiểu dữ liệu trả về từ API (Dựa trên cấu trúc DB join tables)
export interface AdminData {
  id: string;           // Từ bảng admins
  user_id: string;      // Từ bảng admins
  full_name: string;    // Từ bảng admins
  email: string;        // Từ bảng admins/users
  phone: string;        // Từ bảng admins/users
  username: string;     // Từ bảng users
  role_code: 'bod' | 'accountance'; // Từ bảng roles (để map màu sắc)
  is_active: boolean;   // Từ bảng users
}

// 2. Định nghĩa response chuẩn (nếu backend trả về dạng { success: true, data: [...] })
interface AdminListResponse {
  success: boolean;
  data: AdminData[];
  total?: number; // Cho phân trang sau này
}

export interface UserData {
  id: string;           // users.id
  username: string;     // users.username
  email: string;        // users.email
  phone: string;        // users.phone
  is_active: boolean;   // users.is_active
  
  // Thông tin từ bảng admins (có thể null nếu chưa cập nhật profile)
  full_name?: string;   
  
  // Thông tin Role (Backend thường populate bảng roles)
  role?: {
    role_code: 'bod' | 'accountance' | 'resident';
    role_name: string;
  };
  // Hoặc nếu backend trả về role_id phẳng
  role_id?: number; 
}

// Response chuẩn (giả định)
interface UserListResponse {
  success: boolean;
  data: UserData[]; 
}

const normalizeUser = (u: any): UserData => {
  let roleId = u.role_id;
  let roleCode = u.role_code;
  let roleName = u.role_name;

  // 1. Nếu backend trả về lồng nhau trong object "role"
  if (u.role) {
    if (!roleCode) roleCode = u.role.role_code;
    if (!roleName) roleName = u.role.role_name;
    if (!roleId) roleId = u.role.id;
  }

  // 2. Nếu chỉ có role_id, tự suy ra role_code (Fallback dựa trên init.sql)
  if (!roleCode && roleId) {
    if (roleId == 1) roleCode = 'bod';
    else if (roleId == 2) roleCode = 'accountance';
    else if (roleId == 3) roleCode = 'resident';
  }

  // 3. Nếu chỉ có role_code, tự suy ra role_id
  if (!roleId && roleCode) {
    const code = roleCode.toLowerCase();
    if (code === 'bod') roleId = 1;
    else if (code === 'accountance') roleId = 2;
    else if (code === 'resident') roleId = 3;
  }

  return {
    id: u.id,
    username: u.username,
    email: u.email,
    phone: u.phone,
    is_active: u.is_active,
    full_name: u.full_name,
    role: roleCode ? { role_code: roleCode as 'bod' | 'accountance' | 'resident', role_name: roleName || '' } : undefined,
    role_id: roleId
  };
};

export const adminApi = {
  // Lấy danh sách tất cả user
  getAllUsers: async (): Promise<UserData[]> => {
    const url = '/users';
    try {
      const response = await axiosClient.get<UserListResponse>(url);
      const rawData = (response.data as any).data || [];
      
      // LOG DEBUG: In ra các Key của object đầu tiên để kiểm tra chính tả
      if (rawData.length > 0) {
        console.log("👉 [DEBUG KEYS] Các trường của user đầu tiên:", Object.keys(rawData[0]));
      }

      // Chuẩn hóa từng user
      return rawData.map(normalizeUser);
    } catch (error) {
      console.error("Lỗi API Users:", error);
      throw error;
    }
  },

  // Hàm helper để lọc chỉ lấy Admin (BOD & Kế toán)
  getAdminsOnly: async (): Promise<UserData[]> => {
    const allUsers = await adminApi.getAllUsers();
    // LOG DEBUG: Xem trước khi lọc
    console.log("2. Tất cả Users:", allUsers);
    // LOG 2: In chi tiết từng user để kiểm tra trường role_id
    console.log(`👉 [DEBUG] Tổng số users nhận được: ${allUsers.length}`);
    if (allUsers.length > 0) {
      console.log("👉 [DEBUG] Cấu trúc User đầu tiên:", allUsers[0]);
      console.log("👉 [DEBUG] Kiểm tra các trường quan trọng của User đầu tiên:", {
        id: allUsers[0].id,
        role_id: allUsers[0].role_id,
        role: allUsers[0].role
      });
    }
    // Lọc theo role_code (bod hoặc accountance)
    // --- SỬA LẠI: Lọc theo role_id (1=BOD, 2=Kế Toán) ---
    const filtered = allUsers.filter(u => {
      // Ép kiểu sang số cho chắc chắn
      const rId = Number(u.role_id);
      const isMatch = rId === 1 || rId === 2;
      
      // Log nếu tìm thấy admin để debug
      if (isMatch) {
        console.log(`✅ [FILTER] Tìm thấy Admin: ${u.username} (role_id: ${rId})`);
      }
      return isMatch;
    });

    console.log(`👉 [DEBUG] Kết quả sau khi lọc: ${filtered.length} admins`);
    return filtered;
  },
    // Lấy danh sách admin
  getAll: async (): Promise<AdminData[]> => {
    const url = '/admins';
    // Giả sử backend trả về data trực tiếp hoặc trong field data
    const response = await axiosClient.get<AdminListResponse>(url);
    return response.data.data || []; 
  },

  // Lấy chi tiết (Dùng cho trang Profile sau này)
  getById: async (id: string): Promise<AdminData> => {
    const url = `/admins/${id}`;
    const response = await axiosClient.get(url);
    return response.data;
  },

  // (Các hàm create, update, delete sẽ thêm sau)
};