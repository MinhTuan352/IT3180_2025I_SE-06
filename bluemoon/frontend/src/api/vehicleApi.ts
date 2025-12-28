// src/api/vehicleApi.ts
import axiosClient from './axiosClient';

// Interface cho Vehicle
export interface Vehicle {
    id: number;
    resident_id: string;
    apartment_id: number;
    apartment_code?: string;
    building?: string;
    owner_name?: string;
    vehicle_type: 'Ô tô' | 'Xe máy';
    license_plate: string;
    brand?: string;
    model?: string;
    status: string;
    registration_date?: string;
    vehicle_image?: string;
    registration_cert?: string;
    created_at?: string;
}

interface VehicleListResponse {
    success: boolean;
    count?: number;
    data: Vehicle[];
}

interface VehicleFilters {
    status?: string;
    apartment_id?: number;
    keyword?: string;
    vehicle_type?: string;
}

export const vehicleApi = {
    // Cư dân xem danh sách xe của chính mình
    getMyVehicles: async (): Promise<Vehicle[]> => {
        const response = await axiosClient.get<VehicleListResponse>('/vehicles/me');
        return (response.data as any).data || [];
    },

    // BOD/CQCN xem danh sách xe của một cư dân cụ thể
    getVehiclesByResidentId: async (residentId: string): Promise<Vehicle[]> => {
        const response = await axiosClient.get<VehicleListResponse>(`/vehicles/resident/${residentId}`);
        return (response.data as any).data || [];
    },

    // Cư dân đăng ký xe mới
    registerVehicle: async (data: FormData): Promise<Vehicle> => {
        const response = await axiosClient.post('/vehicles/register', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return (response.data as any).data;
    },

    // ==========================================
    // BOD API Functions
    // ==========================================

    // BOD lấy danh sách tất cả xe (với filter)
    getAllVehicles: async (filters?: VehicleFilters): Promise<Vehicle[]> => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.apartment_id) params.append('apartment_id', String(filters.apartment_id));
        if (filters?.keyword) params.append('keyword', filters.keyword);

        const response = await axiosClient.get<VehicleListResponse>(`/vehicles?${params.toString()}`);
        return (response.data as any).data || [];
    },

    // BOD lấy số lượng xe chờ duyệt
    getPendingCount: async (): Promise<number> => {
        const response = await axiosClient.get<VehicleListResponse>('/vehicles?status=Chờ duyệt');
        return (response.data as any).count || (response.data as any).data?.length || 0;
    },

    // BOD duyệt/từ chối xe
    updateVehicleStatus: async (id: number, status: string): Promise<void> => {
        await axiosClient.put(`/vehicles/${id}/status`, { status });
    },

    // BOD thêm xe mới (với status = 'Đang sử dụng')
    createVehicle: async (data: FormData): Promise<Vehicle> => {
        const response = await axiosClient.post('/vehicles', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return (response.data as any).data;
    },

    // BOD xóa xe
    deleteVehicle: async (id: number): Promise<void> => {
        await axiosClient.delete(`/vehicles/${id}`);
    },

    // BOD import xe từ Excel
    importVehicles: async (file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosClient.post('/vehicles/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // BOD export xe ra Excel
    exportVehicles: async (filters?: VehicleFilters): Promise<Blob> => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.keyword) params.append('keyword', filters.keyword);

        const response = await axiosClient.get(`/vehicles/export?${params.toString()}`, {
            responseType: 'blob'
        });
        return response.data as Blob;
    },
};

