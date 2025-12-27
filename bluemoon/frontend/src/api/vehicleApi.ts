// src/api/vehicleApi.ts
import axiosClient from './axiosClient';

// Interface cho Vehicle
export interface Vehicle {
    id: number;
    resident_id: string;
    apartment_id: number;
    apartment_code?: string;
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
    data: Vehicle[];
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
};
