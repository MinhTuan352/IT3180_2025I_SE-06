import axiosClient from './axiosClient';

const paymentApi = {
    // Tạo QR Code
    generateQR: (invoiceId: number) => {
        return axiosClient.get(`/payment/generate-qr/${invoiceId}`);
    },

    // Kiểm tra trạng thái thanh toán
    checkStatus: (invoiceId: number) => {
        return axiosClient.get(`/payment/status/${invoiceId}`);
    },

    // Giả lập thanh toán (DEV ONLY)
    simulate: (invoiceId: number) => {
        return axiosClient.post(`/payment/simulate/${invoiceId}`);
    }
};

export default paymentApi;
