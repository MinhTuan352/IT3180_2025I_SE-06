import axiosClient from './axiosClient';

// Định nghĩa chuẩn Response từ Backend trả về
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    count?: number;
}

export interface Review {
    id: number;
    resident_id: string;
    rating: number;
    feedback: string;
    survey_response: {
        satisfaction?: string;
        security?: string;
        cleanliness?: string;
    } | any;
    status: 'Mới' | 'Đã xem'; // Khớp với SQL Backend
    created_at: string;
    full_name?: string;
    apartment_code?: string;
    building?: string;
}

export interface ReviewStats {
    total: number;
    avg_rating: string | number;
    new_reviews: number;
}

const reviewApi = {
    // Cư dân gửi đánh giá
    create: (data: { rating: number; feedback: string; survey_response?: any }) => {
        return axiosClient.post<ApiResponse<any>>('/reviews', data);
    },

    // Cư dân lấy lịch sử của mình
    getMyReviews: () => {
        return axiosClient.get<ApiResponse<Review[]>>('/reviews/my-reviews');
    },

    // BOD: Lấy toàn bộ đánh giá
    getAll: () => {
        return axiosClient.get<ApiResponse<Review[]>>('/reviews');
    },

    // BOD: Lấy thống kê
    getStats: () => {
        return axiosClient.get<ApiResponse<ReviewStats>>('/reviews/stats');
    },

    // BOD: Đánh dấu đã xem
    markAsViewed: (id: number) => {
        return axiosClient.put<ApiResponse<any>>(`/reviews/${id}/view`);
    }
};

export default reviewApi;