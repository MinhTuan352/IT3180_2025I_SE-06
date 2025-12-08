// File: frontend/src/api/dashboardApi.ts

import axiosClient from './axiosClient';

// BOD Dashboard Types
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

// Accountant Dashboard Types
export interface AccountantStats {
    totalInvoices: number;
    paidInvoices: number;
    unpaidInvoices: number;
    overdueInvoices: number;
    totalRevenue: number;
    totalDebt: number;
    collectionRate: number;
}

export interface MonthlyRevenueData {
    month: string;
    total_invoices: number;
    paid_invoices: number;
    total_amount: number;
    collected: number;
    remaining: number;
}

export interface FeeTypeStat {
    fee_type: string;
    count: number;
    total: number;
    paid: number;
    remaining: number;
}

export interface TopDebtor {
    apartment_code: string;
    invoice_count: number;
    total_debt: number;
}

export interface OverdueInvoice {
    id: number;
    apartment_code: string;
    fee_type: string;
    total_amount: number;
    amount_remaining: number;
    due_date: string;
    days_overdue: number;
}

export interface Prediction {
    nextMonth: number;
    trend: 'up' | 'down' | 'stable';
}

export interface AccountantDashboardData {
    stats: AccountantStats;
    charts: {
        monthlyRevenue: MonthlyRevenueData[];
        feeTypeStats: FeeTypeStat[];
        topDebtors: TopDebtor[];
    };
    overdueInvoices: OverdueInvoice[];
    prediction: Prediction;
}

// API Functions
export const dashboardApi = {
    getBODStats: async (): Promise<BODDashboardData> => {
        const response = await axiosClient.get('/dashboard/bod');
        return response.data.data;
    },

    getAccountantStats: async (): Promise<AccountantDashboardData> => {
        const response = await axiosClient.get('/dashboard/accountant');
        return response.data.data;
    }
};

export default dashboardApi;
