
import axiosClient from './axiosClient';

export interface Asset {
    id?: number;
    asset_code: string;
    name: string;
    description?: string;
    location?: string;
    status: string;
    next_maintenance?: string | null;
    last_maintenance?: string | null;
    purchase_date?: string;
    price?: number;
    image?: string;
}


const assetApi = {
    // Lấy toàn bộ danh sách tài sản (dành cho BOD/Kế toán)
    getAll: () => {
        return axiosClient.get('/assets');
    },

    // Lấy danh sách tài sản cho Cư dân (Chỉ xem)
    getForResident: () => {
        return axiosClient.get('/assets/resident');
    },

    // Lấy chi tiết tài sản theo ID
    getDetail: (id: number) => {
        return axiosClient.get(`/assets/${id}`);
    },

    // Lấy lịch sử bảo trì của tài sản
    getMaintenanceHistory: (id: number) => {
        return axiosClient.get(`/assets/${id}/maintenance-history`);
    },

    // Tạo tài sản mới
    create: (data: Asset) => {
        return axiosClient.post('/assets', data);
    },

    // Cập nhật thông tin tài sản
    update: (id: number, data: Asset) => {
        return axiosClient.put(`/assets/${id}`, data);
    },

    // Xóa tài sản
    delete: (id: number) => {
        return axiosClient.delete(`/assets/${id}`);
    }
};

export default assetApi;
