// src/api/donationApi.ts
import axiosClient from './axiosClient';

export interface FundCampaign {
    id: number;
    title: string;
    description: string;
    image_path?: string;
    start_date: string;
    end_date: string;
    target_amount: number;
    current_amount: number;
    status: 'Active' | 'Closed' | 'Planned';
    created_by: string;
    created_at: string;
}

export interface Donation {
    id: number;
    campaign_id: number;
    resident_id: string;
    full_name: string;
    apartment_code: string;
    amount: number;
    payment_method: string;
    note?: string;
    is_anonymous: boolean;
    transaction_date: string;
}

export interface FundStatistics {
    overview: {
        total_campaigns: number;
        active_campaigns: number;
        closed_campaigns: number;
        total_raised: number;
        total_target: number;
    };
    topCampaigns: Array<{
        id: number;
        title: string;
        current_amount: number;
        target_amount: number;
        progress_percent: number;
    }>;
    topDonors: Array<{
        resident_id: string;
        full_name: string;
        apartment_code: string;
        total_donated: number;
        donation_count: number;
    }>;
    monthlyStats: Array<{
        month: string;
        total_amount: number;
        donation_count: number;
    }>;
}

const donationApi = {
    // Campaigns
    getCampaigns: () => {
        return axiosClient.get<{ success: boolean; data: FundCampaign[] }>('/donations/campaigns');
    },

    getCampaignDetail: (id: number) => {
        return axiosClient.get<{ success: boolean; data: FundCampaign }>(`/donations/campaigns/${id}`);
    },

    createCampaign: (data: FormData) => {
        return axiosClient.post<{ success: boolean; data: FundCampaign }>('/donations/campaigns', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    updateCampaign: (id: number, data: FormData) => {
        return axiosClient.put<{ success: boolean }>(`/donations/campaigns/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    closeCampaign: (id: number) => {
        return axiosClient.put<{ success: boolean }>(`/donations/campaigns/${id}/close`);
    },

    // Donations/Contributions
    getStatement: (campaignId: number) => {
        return axiosClient.get<{ success: boolean; data: Donation[] }>(`/donations/campaigns/${campaignId}/statement`);
    },

    recordOffline: (data: { campaign_id: number; resident_id: string; amount: number; note?: string; is_anonymous?: boolean }) => {
        return axiosClient.post<{ success: boolean }>('/donations/record-offline', data);
    },

    // Resident: Donate to campaign
    donate: (data: { campaign_id: number; amount: number; payment_method: string; note?: string; is_anonymous?: boolean }) => {
        return axiosClient.post<{ success: boolean; data: Donation }>('/donations/donate', data);
    },

    // [New] Initiate Donation (Get QR)
    initiateDonation: (data: { campaign_id: number; amount: number; note?: string; is_anonymous?: boolean }) => {
        return axiosClient.post<{
            success: boolean;
            data: {
                tempId: string;
                qrUrl: string;
                bankName: string;
                accountNo: string;
                accountName: string;
                amount: number;
                transferContent: string;
            }
        }>('/donations/initiate', data);
    },

    // [New] Check Donation Status
    checkStatus: (tempId: string) => {
        return axiosClient.get<{
            success: boolean;
            isPaid: boolean;
            status: string;
            realDonationId?: number
        }>(`/donations/status/${tempId}`);
    },

    // [New] Simulate Payment (Dev)
    simulatePayment: (tempId: string) => {
        return axiosClient.post<{ success: boolean; data: Donation }>(`/donations/simulate/${tempId}`);
    },

    // Resident: Get my donation history
    getMyHistory: () => {
        return axiosClient.get<{ success: boolean; data: Donation[] }>('/donations/me/history');
    },

    // Statistics
    getStatistics: () => {
        return axiosClient.get<{ success: boolean; data: FundStatistics }>('/donations/statistics');
    }
};

export default donationApi;
