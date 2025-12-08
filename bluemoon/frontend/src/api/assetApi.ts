import axiosClient from './axiosClient';

export interface Asset {
    id: number;
    asset_code: string;
    name: string;
    description?: string;
    location?: string;
    purchase_date?: string;
    price?: number;
    status: 'Hoạt động' | 'Đang bảo trì' | 'Hỏng';
    created_at?: string;
    updated_at?: string;
    last_maintenance?: string;
    next_maintenance?: string;
    // For UI display (mapped from status)
    type?: string;
    image?: string;
}

export interface AssetFilters {
    status?: string;
    keyword?: string;
}

const assetApi = {
    // Get all assets for resident (read-only)
    getAll: (params?: AssetFilters) => {
        return axiosClient.get('/assets/resident', { params });
    },

    // Get asset detail by ID
    getDetail: (id: number) => {
        return axiosClient.get(`/assets/${id}`);
    }
};

export default assetApi;
