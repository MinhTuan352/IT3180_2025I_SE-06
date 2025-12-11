
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
    // Get all assets (for BOD/Accountant)
    getAll: () => {
        return axiosClient.get('/assets');
    },

    // Get assets for Resident (Read-only)
    getForResident: () => {
        return axiosClient.get('/assets/resident');
    },

    // Get asset detail by ID
    getDetail: (id: number) => {
        return axiosClient.get(`/assets/${id}`);
    },

    // Create new asset
    create: (data: Asset) => {
        return axiosClient.post('/assets', data);
    },

    // Update asset
    update: (id: number, data: Asset) => {
        return axiosClient.put(`/assets/${id}`, data);
    },

    // Delete asset
    delete: (id: number) => {
        return axiosClient.delete(`/assets/${id}`);
    }
};

export default assetApi;
