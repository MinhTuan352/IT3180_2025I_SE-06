// File: frontend/src/api/buildingApi.ts

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Types
export interface BuildingInfo {
    name: string;
    investor: string;
    location: string;
    scale: string;
    apartments: string;
    description: string;
    totalArea: string;
    startDate: string;
    finishDate: string;
    totalInvestment: string;
}

export interface Regulation {
    id?: number;
    title: string;
    content: string[];
}

// API Functions

/**
 * Lấy thông tin tòa nhà
 */
export const getBuildingInfo = async (): Promise<BuildingInfo> => {
    const response = await axios.get(`${API_URL}/api/building/info`);
    return response.data.data;
};

/**
 * Cập nhật thông tin tòa nhà (BOD only)
 */
export const updateBuildingInfo = async (data: BuildingInfo): Promise<void> => {
    const token = localStorage.getItem('accessToken');
    await axios.put(`${API_URL}/api/building/info`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

/**
 * Lấy danh sách quy định
 */
export const getRegulations = async (): Promise<Regulation[]> => {
    const response = await axios.get(`${API_URL}/api/building/regulations`);
    return response.data.data;
};

/**
 * Thêm quy định mới (BOD only)
 */
export const createRegulation = async (data: { title: string; content: string[] }): Promise<Regulation> => {
    const token = localStorage.getItem('accessToken');
    const response = await axios.post(`${API_URL}/api/building/regulations`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

/**
 * Cập nhật quy định (BOD only)
 */
export const updateRegulation = async (id: number, data: { title: string; content: string[] }): Promise<void> => {
    const token = localStorage.getItem('accessToken');
    await axios.put(`${API_URL}/api/building/regulations/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

/**
 * Xóa quy định (BOD only)
 */
export const deleteRegulation = async (id: number): Promise<void> => {
    const token = localStorage.getItem('accessToken');
    await axios.delete(`${API_URL}/api/building/regulations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
