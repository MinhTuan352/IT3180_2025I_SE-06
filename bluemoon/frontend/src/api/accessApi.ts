// File: frontend/src/api/accessApi.ts

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Types
export interface AccessLog {
    id: number;
    plate_number: string;
    vehicle_type: 'Ô tô' | 'Xe máy';
    direction: 'In' | 'Out';
    gate: string;
    status: 'Normal' | 'Warning' | 'Alert';
    resident_id: string | null;
    resident_name: string | null;
    apartment_code: string | null;
    note: string | null;
    image_url: string | null;
    created_at: string;
}

export interface AccessStats {
    totalToday: number;
    warningCount: number;
}

export interface SimulatorVehicle {
    id: string | number;
    license_plate: string;
    vehicle_type: string;
    brand: string;
    model: string;
    owner_name: string;
    apartment_code: string;
    isSimulated?: boolean;
    isBlacklist?: boolean;
}

// API Functions

/**
 * Lấy danh sách lịch sử ra vào
 */
export const getAccessLogs = async (page = 1, limit = 50): Promise<{ data: AccessLog[]; pagination: { page: number; limit: number; total: number } }> => {
    const response = await axios.get(`${API_BASE}/access/logs`, {
        params: { page, limit }
    });
    return response.data;
};

/**
 * Lấy bản ghi mới nhất (cho polling)
 */
export const getLatestAccess = async (lastId = 0): Promise<{ data: AccessLog[]; hasNew: boolean }> => {
    const response = await axios.get(`${API_BASE}/access/latest`, {
        params: { lastId }
    });
    return response.data;
};

/**
 * Lấy thống kê ra vào hôm nay
 */
export const getAccessStats = async (): Promise<AccessStats> => {
    const response = await axios.get(`${API_BASE}/access/stats`);
    return response.data.data;
};

/**
 * Mô phỏng xe ra vào (từ barrier)
 */
export const simulateAccess = async (data: { plate_number: string; direction: 'In' | 'Out'; gate?: string }): Promise<{ data: AccessLog }> => {
    const response = await axios.post(`${API_BASE}/access/simulate`, data);
    return response.data;
};

/**
 * Lấy danh sách xe cho simulator
 */
export const getSimulatorVehicles = async (): Promise<SimulatorVehicle[]> => {
    const response = await axios.get(`${API_BASE}/access/simulator-vehicles`);
    return response.data.data;
};

// Report Types
export interface ReportStats {
    total: number;
    normalCount: number;
    warningCount: number;
    alertCount: number;
    inCount: number;
    outCount: number;
}

export interface DailyStats {
    date: string;
    total: number;
    normal: number;
    abnormal: number;
}

export interface ReportData {
    stats: ReportStats;
    anomalies: AccessLog[];
    dailyStats: DailyStats[];
    period: { startDate: string; endDate: string };
}

/**
 * Lấy dữ liệu báo cáo phân tích
 */
export const getReportData = async (startDate: string, endDate: string): Promise<ReportData> => {
    const response = await axios.get(`${API_BASE}/access/report`, {
        params: { startDate, endDate }
    });
    return response.data.data;
};

/**
 * Xuất báo cáo PDF - mở trong tab mới
 */
export const exportReportPDF = (startDate: string, endDate: string): void => {
    const url = `${API_BASE}/access/export-pdf?startDate=${startDate}&endDate=${endDate}`;
    window.open(url, '_blank');
};
