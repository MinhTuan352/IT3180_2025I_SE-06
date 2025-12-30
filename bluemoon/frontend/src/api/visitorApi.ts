import axiosClient from './axiosClient';

export interface Visitor {
    id: number;
    resident_id: string; // hoặc Resident object
    resident_name?: string;
    apartment_code?: string;
    visitor_name: string;
    visitor_id_card?: string;
    expected_arrival: string; // ISO Date
    expected_departure?: string; // ISO Date
    check_in_time?: string;
    check_out_time?: string;
    purpose?: string;
    status: 'Đăng ký' | 'Đã vào' | 'Đã ra' | 'Hủy';
}

const visitorApi = {
    // Lấy danh sách khách (cho BOD/Bảo vệ/Lễ tân)
    getAll: (params?: any) => {
        return axiosClient.get('/visitors', { params });
    },

    // Cư dân đăng ký khách (hoặc Lễ tân đăng ký)
    register: (data: {
        visitor_name: string;
        visitor_id_card?: string;
        expected_arrival: string;
        expected_departure?: string;
        purpose?: string;
    }) => {
        return axiosClient.post('/visitors/register', data);
    },

    // Check-in (Bảo vệ/Lễ tân) - Sử dụng route /visitors/check-in nếu backend hỗ trợ POST,
    // hoặc PUT /visitors/:id/check-in nếu update status.
    // Check backend routes: router.post('/check-in', ...)
    checkIn: (data: { visitor_code?: string; id?: number }) => {
        return axiosClient.post('/visitors/check-in', data);
    },

    // Check-out (Bảo vệ/Lễ tân)
    checkOut: (id: number) => {
        return axiosClient.put(`/visitors/${id}/check-out`);
    },

    // Xóa/Hủy (BOD)
    delete: (id: number) => {
        return axiosClient.delete(`/visitors/${id}`);
    }
};

export default visitorApi;
