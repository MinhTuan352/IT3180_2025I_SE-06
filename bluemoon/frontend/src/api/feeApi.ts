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
    apartment_code?: string;
    building?: string;
    resident_name?: string;
    fee_name?: string;
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
        return axiosClient.get('/fees/' + id);
    },

    create: (data: any) => {
        return axiosClient.post('/fees', data);
    },

    pay: (id: string, data: { amount_paid: number, payment_method: string }) => {
        return axiosClient.post('/fees/' + id + '/pay', data);
    },

    getTypes: () => {
        return axiosClient.get('/fees/types');
    },

    createType: (data: any) => {
        return axiosClient.post('/fees/types', data);
    },

    updateType: (id: string, data: any) => {
        return axiosClient.put('/fees/types/' + id, data);
    },

    deleteType: (id: string) => {
        return axiosClient.delete('/fees/types/' + id);
    },

    // Import water meter readings and create invoices
    importWater: (data: { billingPeriod: string, readings: any[] }) => {
        return axiosClient.post('/fees/import-water', data);
    },

    triggerScan: () => {
        return axiosClient.post('/fees/trigger-scan');
    },

    // [MỚI] Batch preview - Xem trước hóa đơn sẽ tạo
    batchPreview: (billingPeriod: string) => {
        return axiosClient.get('/fees/batch-preview', {
            params: { billing_period: billingPeriod }
        });
    },

    // [MỚI] Batch create - Tạo hóa đơn hàng loạt
    batchCreate: (data: { billing_period: string; invoices: any[] }) => {
        return axiosClient.post('/fees/batch-create', data);
    },

    // [MỚI] Gửi nhắc nợ cho 1 hóa đơn
    sendReminder: (id: string) => {
        return axiosClient.post(`/fees/${id}/remind`);
    },

    // [MỚI] Gửi nhắc nợ hàng loạt
    sendBatchReminder: (data: { invoice_ids?: string[]; filter?: string }) => {
        return axiosClient.post('/fees/batch-remind', data);
    }
};

export default feeApi;
