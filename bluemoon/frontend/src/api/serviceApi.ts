import axiosClient from './axiosClient';

export interface ServiceType {
    id: number;
    name: string;
    base_price: number;
    unit: string;
    description: string;
    location: string;
    contact_phone: string;
    image_url?: string;
    status: 'Đang hoạt động' | 'Bảo trì' | 'Ngừng hoạt động';
}

export interface ServiceBooking {
    id: number;
    resident_id: string;
    service_type_id: number;
    booking_date: string;
    quantity: number;
    total_amount: number;
    note?: string;
    status: 'Chờ duyệt' | 'Đã duyệt' | 'Đã hủy' | 'Hoàn thành';
    service_name?: string; // Joined from backend
}

const serviceApi = {
    // Lấy tất cả dịch vụ (Admin/BOD)
    getAll: () => {
        return axiosClient.get('/services');
    },

    // Lấy dịch vụ đang hoạt động (Resident)
    getActive: () => {
        return axiosClient.get('/services/public');
    },

    // Lấy chi tiết dịch vụ
    getById: (id: number) => {
        return axiosClient.get(`/services/detail/${id}`);
    },

    // Tạo dịch vụ mới (FormData để upload ảnh)
    create: (data: FormData) => {
        return axiosClient.post('/services', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Cập nhật dịch vụ
    update: (id: number, data: any) => {
        return axiosClient.put(`/services/${id}`, data);
    },

    // Xóa dịch vụ
    delete: (id: number) => {
        return axiosClient.delete(`/services/${id}`);
    },

    // --- BOOKING ---

    // Tạo booking mới
    createBooking: (data: { service_type_id: number; booking_date: string; quantity: number; note?: string }) => {
        return axiosClient.post('/services/bookings', data);
    },

    // Cư dân xem booking của mình
    getMyBookings: () => {
        return axiosClient.get('/services/my-bookings');
    },

    // Admin xem tất cả booking
    getAllBookings: () => {
        return axiosClient.get('/services/bookings');
    },

    // Admin cập nhật trạng thái booking
    updateBookingStatus: (id: number, status: string) => {
        return axiosClient.put(`/services/bookings/${id}/status`, { status });
    }
};

export default serviceApi;
