import axiosClient from './axiosClient';

export interface NotificationAttachment {
    id: number;
    notification_id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    uploaded_at: string;
}

export interface Notification {
    id: string;
    title: string;
    content: string;
    type_id: number;
    type_name?: string; // from join
    target: 'Tất cả Cư dân' | 'Theo tòa nhà' | 'Cá nhân';
    created_by: number;
    created_by_name?: string; // from join
    created_at: string;
    is_sent: boolean;
    scheduled_at?: string | null;
    // attachments
    attachments?: NotificationAttachment[];
    // for resident view
    is_read?: boolean;
    read_at?: string | null;
    read_status?: { is_read: boolean; read_at: string };
    // for bod view
    recipient_count?: number;
}

export interface NotificationFilters {
    role?: 'bod' | 'resident';
}

const notificationApi = {
    getAll: (filters?: NotificationFilters) => {
        return axiosClient.get<{ success: boolean; data: Notification[]; count: number }>('/notifications', { params: filters });
    },

    getDetail: (id: string) => {
        return axiosClient.get<{ success: boolean; data: Notification }>(`/notifications/${id}`);
    },

    create: (formData: FormData) => {
        return axiosClient.post<{ success: boolean; message: string; data: Notification }>('/notifications', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    markAsRead: (id: string) => {
        return axiosClient.put<{ success: boolean; message: string }>(`/notifications/${id}/read`);
    },
};

export default notificationApi;
