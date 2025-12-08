// File: frontend/src/api/dashboardApi.ts

import axiosClient from './axiosClient';

export interface BODStats {
    totalApartments: number;
    totalResidents: number;
    pendingServiceRequests: number;
    pendingIncidents: number;
    paymentRate: number;
    totalCollected: number;
    totalRemaining: number;
    paidInvoices: number;
    unpaidInvoices: number;
}

export interface MonthlyRevenue {
    month: string;
    total_invoices: number;
    paid_invoices: number;
    total_collected: number;
}

export interface RecentIncident {
    id: number;
    title: string;
    status: string;
    priority: string;
    created_at: string;
    apartment_code: string;
}

export interface RecentService {
    id: number;
    service_name: string;
    status: string;
    created_at: string;
    apartment_code: string;
}

export interface BODDashboardData {
    stats: BODStats;
    charts: {
        monthlyRevenue: MonthlyRevenue[];
    };
    recentIncidents: RecentIncident[];
    recentServices: RecentService[];
}

export const dashboardApi = {
    getBODStats: async (): Promise<BODDashboardData> => {
        const response = await axiosClient.get('/dashboard/bod');
        return response.data.data;
    }
};

export default dashboardApi;
