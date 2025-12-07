// src/api/incidentApi.ts
import axiosClient from './axiosClient';

// Types basing on backend model
export interface Incident {
    id: string;
    title: string;
    description: string;
    location: string;
    priority: 'Thấp' | 'Trung bình' | 'Cao' | 'Khẩn cấp';
    status: 'Mới' | 'Đang xử lý' | 'Hoàn thành' | 'Đã hủy';
    reported_by: string; // ID of resident
    assigned_to?: string; // ID of admin/staff
    created_at: string;
    updated_at: string;
    resident_name?: string; // If backend joins
    images?: string[]; // Array of URLs/paths
    admin_response?: string;
    feedback?: string;
    rating?: number;
}

export interface IncidentFilters {
    status?: string;
    keyword?: string;
}

const incidentApi = {
    getAll: (params?: IncidentFilters) => {
        return axiosClient.get('/incidents', { params });
    },

    getDetail: (id: string) => {
        return axiosClient.get(`/incidents/${id}`);
    },

    create: (data: FormData) => {
        // data contains title, description, location, images
        return axiosClient.post('/incidents', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
    },

    // Update for BOD/Admin (status, response, assign)
    update: (id: string, data: any) => {
        return axiosClient.put(`/incidents/${id}`, data);
    },
};

export default incidentApi;
