import axiosClient from './axiosClient';

export interface NotificationAttachment {
    id: number;
    notification_id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    uploaded_at: string;
}

export interface NotificationRecipient {
    id: string;
    full_name: string;
    apartment_id: number;
    apartment_code: string;
    is_read: boolean;
    read_at: string | null;
}

export interface Notification {
    id: string;
    title: string;
    content: string;
    type_id: number;
    type_name?: string; // from join
    target: 'Tất cả Cư dân' | 'Theo tòa nhà' | 'Cá nhân' | 'Theo căn hộ';
    target_value?: string;
    created_by: number;
    created_by_name?: string; // from join
    created_at: string;
    is_sent: boolean;
    scheduled_at?: string | null;
    // attachments
    attachments?: NotificationAttachment[];
    // recipients (for BOD view)
    recipients?: NotificationRecipient[];
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

    create: (data: FormData | Record<string, any>) => {
        // Support both FormData (with files) and plain object (without files)
        if (data instanceof FormData) {
            return axiosClient.post<{ success: boolean; message: string; data: Notification }>('/notifications', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        }
        return axiosClient.post<{ success: boolean; message: string; data: Notification }>('/notifications', data);
    },

    markAsRead: (id: string) => {
        return axiosClient.put<{ success: boolean; message: string }>(`/notifications/${id}/read`);
    },

    markAllAsRead: () => {
        return axiosClient.put<{ success: boolean; message: string }>('/notifications/read-all');
    },
};

export default notificationApi;
