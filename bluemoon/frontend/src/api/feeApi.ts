// src/api/feeApi.ts
import axiosClient from './axiosClient';

export interface FeeItem {
    stt?: number;
    item_name: string;
    unit: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

export interface Fee {
    id: string;
    apartment_id: string;
    resident_id: string;
    fee_type_id: number;
    description: string;
    billing_period: string;
    due_date: string;
    total_amount: number;
    amount_paid: number;
    amount_remaining: number;
    status: 'Chưa thanh toán' | 'Đã thanh toán' | 'Quá hạn' | 'Thanh toán một phần' | 'Đã hủy';
    payment_date?: string;
    payment_method?: string;
    created_by?: string;
    created_at?: string;

    // Joined fields
    apartment_code?: string;
    building?: string;
    resident_name?: string;
    fee_name?: string; // Type name
    items?: FeeItem[];
}

export interface FeeFilters {
    apartment_id?: string;
    status?: string;
    resident_id?: string;
}

const feeApi = {
    getAll: (params?: FeeFilters) => {
        return axiosClient.get('/fees', { params });
    },

    getDetail: (id: string) => {
        return axiosClient.get(`/fees/${id}`);
    },

    create: (data: any) => {
        return axiosClient.post('/fees', data);
    },

    pay: (id: string, data: { amount_paid: number, payment_method: string }) => {
        return axiosClient.post(`/fees/${id}/pay`, data);
    },

    getTypes: () => {
        return axiosClient.get('/fees/types');
    },

    // For manual scan trigger
    triggerScan: () => {
        return axiosClient.post('/fees/trigger-scan');
    }
};

export default feeApi;
