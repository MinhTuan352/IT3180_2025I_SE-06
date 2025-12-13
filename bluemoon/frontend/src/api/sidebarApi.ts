// File: frontend/src/api/sidebarApi.ts

import axiosClient from './axiosClient';

export interface SidebarBadgeCounts {
    unreadNotifications: number;
    unpaidFees: number;
    updatedReports: number;
}

export const sidebarApi = {
    /**
     * Lấy số lượng badge cho sidebar (Resident only)
     */
    getBadgeCounts: async (): Promise<SidebarBadgeCounts> => {
        const response = await axiosClient.get('/sidebar/badges');
        return response.data.data;
    },

    /**
     * Đánh dấu đã xem trang Công nợ (để badge = 0)
     */
    markFeesViewed: async (): Promise<void> => {
        await axiosClient.post('/sidebar/mark-fees-viewed');
    }
};

export default sidebarApi;
