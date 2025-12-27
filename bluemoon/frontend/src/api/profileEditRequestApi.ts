// src/api/profileEditRequestApi.ts

import axiosClient from './axiosClient';

// Interface cho yêu cầu chỉnh sửa
export interface ProfileEditRequest {
    id: number;
    resident_id: string;
    resident_name?: string;
    apartment_code?: string;
    requested_changes: Record<string, any>;
    reason?: string;
    status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';
    admin_note?: string;
    processed_by?: string;
    processed_by_name?: string;
    processed_at?: string;
    created_at: string;
    updated_at?: string;
}

interface RequestListResponse {
    success: boolean;
    data: ProfileEditRequest[];
    pendingCount?: number;
}

interface RequestDetailResponse {
    success: boolean;
    data: ProfileEditRequest;
}

export const profileEditRequestApi = {
    // Cư dân tạo yêu cầu mới
    createRequest: async (data: { requested_changes: Record<string, any>; reason?: string }): Promise<ProfileEditRequest> => {
        const response = await axiosClient.post('/profile-requests', data);
        return (response.data as any).data;
    },

    // Cư dân xem yêu cầu của mình
    getMyRequests: async (): Promise<ProfileEditRequest[]> => {
        const response = await axiosClient.get<RequestListResponse>('/profile-requests/me');
        return (response.data as any).data || [];
    },

    // BOD xem tất cả yêu cầu (pending + đã xử lý)
    getAllRequests: async (): Promise<{ data: ProfileEditRequest[]; totalCount: number; pendingCount: number }> => {
        const response = await axiosClient.get<any>('/profile-requests/all');
        return {
            data: (response.data as any).data || [],
            totalCount: (response.data as any).totalCount || 0,
            pendingCount: (response.data as any).pendingCount || 0
        };
    },

    // BOD xem yêu cầu của 1 cư dân
    getRequestsByResidentId: async (residentId: string): Promise<{ data: ProfileEditRequest[]; pendingCount: number }> => {
        const response = await axiosClient.get<RequestListResponse>(`/profile-requests/resident/${residentId}`);
        return {
            data: (response.data as any).data || [],
            pendingCount: (response.data as any).pendingCount || 0
        };
    },

    // Lấy chi tiết 1 yêu cầu
    getRequestDetail: async (id: number): Promise<ProfileEditRequest> => {
        const response = await axiosClient.get<RequestDetailResponse>(`/profile-requests/${id}`);
        return (response.data as any).data;
    },

    // BOD cập nhật trạng thái
    updateRequestStatus: async (id: number, status: 'Đã duyệt' | 'Từ chối', admin_note?: string): Promise<void> => {
        await axiosClient.put(`/profile-requests/${id}/status`, { status, admin_note });
    }
};
