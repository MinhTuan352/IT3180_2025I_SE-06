import axiosClient from './axiosClient';

export interface Review {
    id: number;
    resident_id: string;
    rating: number;
    feedback: string;
    survey_response: any;
    status: 'Mới' | 'Đã xem';
    created_at: string;
    full_name?: string;
    apartment_code?: string;
    building?: string;
}

export interface ReviewStats {
    total: number;
    avg_rating: string; // Decimal returned as string from DB
    new_reviews: number;
}

const reviewApi = {
    // Resident: Submit a review
    create: (data: { rating: number; feedback: string; survey_response?: any }) => {
        return axiosClient.post('/reviews', data);
    },

    // Resident: Get own reviews history
    getMyReviews: () => {
        return axiosClient.get<Review[]>('/reviews/my-reviews');
    },

    // BOD: Get all reviews
    getAll: () => {
        return axiosClient.get<Review[]>('/reviews');
    },

    // BOD: Get stats
    getStats: () => {
        return axiosClient.get<ReviewStats>('/reviews/stats');
    },

    // BOD: Mark as viewed
    markAsViewed: (id: number) => {
        return axiosClient.put(`/reviews/${id}/view`);
    }
};

export default reviewApi;
