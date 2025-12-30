import axiosClient from './axiosClient';

const auditApi = {
    // Xem nhật ký hệ thống
    getSystemLogs: (params?: any) => {
        return axiosClient.get('/audit', { params });
    }
};

export default auditApi;
