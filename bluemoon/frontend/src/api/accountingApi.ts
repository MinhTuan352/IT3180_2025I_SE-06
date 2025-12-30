// src/api/accountingApi.ts
// API cho Quản lý Kế toán: Tasks & Recurring Schedules

import axiosClient from './axiosClient';

// ==========================================
// INTERFACES
// ==========================================

export interface AccountingTask {
    id: number;
    title: string;
    description?: string;
    task_type: 'manual' | 'recurring';
    category?: string;
    period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    period_value?: string;
    start_date?: string;
    due_date: string;
    completed_date?: string;
    assigned_to?: number;
    assigned_to_name?: string;
    assigned_by?: number;
    assigned_by_name?: string;
    status: 'pending' | 'in_progress' | 'review' | 'completed' | 'overdue';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    recurring_schedule_id?: number;
    schedule_title?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface RecurringSchedule {
    id: number;
    title: string;
    description?: string;
    category?: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    day_of_week?: number;
    day_of_month?: number;
    month_of_year?: number;
    deadline_offset_days: number;
    default_assignee?: number;
    default_assignee_name?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    is_active: boolean;
    next_run_date?: string;
    last_run_date?: string;
    created_by?: number;
    created_by_name?: string;
    created_at?: string;
    updated_at?: string;
}

export interface TaskFilters {
    status?: string;
    category?: string;
    assigned_to?: number;
    period_value?: string;
    period_type?: string;
    task_type?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
}

export interface TaskStats {
    total: number;
    pending: number;
    in_progress: number;
    review: number;
    completed: number;
    overdue: number;
    about_to_overdue: number;
}

export interface Category {
    value: string;
    label: string;
    icon: string;
}

// ==========================================
// TASK APIs
// ==========================================

const accountingApi = {
    // Lấy danh sách công việc
    getAllTasks: async (filters?: TaskFilters) => {
        const response = await axiosClient.get('/accounting/tasks', { params: filters });
        return response.data;
    },

    // Lấy chi tiết công việc
    getTaskById: async (id: number) => {
        const response = await axiosClient.get(`/accounting/tasks/${id}`);
        return response.data;
    },

    // Tạo công việc mới
    createTask: async (data: Partial<AccountingTask>) => {
        const response = await axiosClient.post('/accounting/tasks', data);
        return response.data;
    },

    // Cập nhật công việc
    updateTask: async (id: number, data: Partial<AccountingTask>) => {
        const response = await axiosClient.put(`/accounting/tasks/${id}`, data);
        return response.data;
    },

    // Cập nhật trạng thái
    updateTaskStatus: async (id: number, status: string) => {
        const response = await axiosClient.patch(`/accounting/tasks/${id}/status`, { status });
        return response.data;
    },

    // Xóa công việc
    deleteTask: async (id: number) => {
        const response = await axiosClient.delete(`/accounting/tasks/${id}`);
        return response.data;
    },

    // Lấy thống kê
    getTaskStats: async (filters?: { period_value?: string; assigned_to?: number }) => {
        const response = await axiosClient.get('/accounting/tasks/stats', { params: filters });
        return response.data;
    },

    // ==========================================
    // SCHEDULE APIs
    // ==========================================

    // Lấy danh sách lịch định kỳ
    getAllSchedules: async (filters?: { is_active?: boolean; frequency?: string; category?: string }) => {
        const response = await axiosClient.get('/accounting/schedules', { params: filters });
        return response.data;
    },

    // Lấy chi tiết lịch định kỳ
    getScheduleById: async (id: number) => {
        const response = await axiosClient.get(`/accounting/schedules/${id}`);
        return response.data;
    },

    // Tạo lịch định kỳ mới
    createSchedule: async (data: Partial<RecurringSchedule>) => {
        const response = await axiosClient.post('/accounting/schedules', data);
        return response.data;
    },

    // Cập nhật lịch định kỳ
    updateSchedule: async (id: number, data: Partial<RecurringSchedule>) => {
        const response = await axiosClient.put(`/accounting/schedules/${id}`, data);
        return response.data;
    },

    // Bật/Tắt lịch định kỳ
    toggleSchedule: async (id: number, isActive: boolean) => {
        const response = await axiosClient.patch(`/accounting/schedules/${id}/toggle`, { is_active: isActive });
        return response.data;
    },

    // Xóa lịch định kỳ
    deleteSchedule: async (id: number) => {
        const response = await axiosClient.delete(`/accounting/schedules/${id}`);
        return response.data;
    },

    // Chạy lịch thủ công (tạo task ngay)
    runSchedulesNow: async () => {
        const response = await axiosClient.post('/accounting/schedules/run-now');
        return response.data;
    },

    // ==========================================
    // UTILITY APIs
    // ==========================================

    // Lấy danh sách danh mục
    getCategories: async () => {
        const response = await axiosClient.get('/accounting/categories');
        return response.data;
    }
};

export default accountingApi;
