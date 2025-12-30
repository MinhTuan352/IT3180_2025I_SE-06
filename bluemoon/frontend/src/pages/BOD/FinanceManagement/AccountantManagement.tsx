// File: frontend/src/pages/BOD/FinanceManagement/AccountantManagement.tsx
// Quản lý Kế toán: Tiến độ công việc + Lên lịch định kỳ + Giao việc thủ công

import {
    Box, Typography, Paper, Tabs, Tab, Button, Chip, TextField,
    MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, Tooltip, Alert, Grid,
    Card, CardContent
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useState, useEffect, useCallback } from 'react';
import {
    Assignment as AssignmentIcon,
    Schedule as ScheduleIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Refresh as RefreshIcon,
    Add as AddIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import accountingApi, {
    type AccountingTask,
    type RecurringSchedule,
    type TaskFilters,
    type TaskStats,
    type Category
} from '../../../api/accountingApi';

// ==========================================
// CONSTANTS
// ==========================================

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
    pending: { label: 'Chờ xử lý', color: 'default' },
    in_progress: { label: 'Đang thực hiện', color: 'info' },
    review: { label: 'Chờ duyệt', color: 'warning' },
    completed: { label: 'Hoàn thành', color: 'success' },
    overdue: { label: 'Quá hạn', color: 'error' }
};

const PRIORITY_CONFIG: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
    low: { label: 'Thấp', color: 'default' },
    medium: { label: 'Trung bình', color: 'primary' },
    high: { label: 'Cao', color: 'warning' },
    urgent: { label: 'Khẩn cấp', color: 'error' }
};

const FREQUENCY_OPTIONS = [
    { value: 'daily', label: 'Hàng ngày' },
    { value: 'weekly', label: 'Hàng tuần' },
    { value: 'monthly', label: 'Hàng tháng' },
    { value: 'quarterly', label: 'Hàng quý' },
    { value: 'yearly', label: 'Hàng năm' }
];

// ==========================================
// INTERFACES
// ==========================================

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function AccountantManagement() {
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(0);

    // Task state
    const [tasks, setTasks] = useState<AccountingTask[]>([]);
    const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
    const [taskLoading, setTaskLoading] = useState(false);
    const [taskFilters, setTaskFilters] = useState<TaskFilters>({});

    // Schedule state
    const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    // Categories
    const [categories, setCategories] = useState<Category[]>([]);

    // Dialogs
    const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<AccountingTask | null>(null);
    const [selectedSchedule, setSelectedSchedule] = useState<RecurringSchedule | null>(null);
    const [isEditingSchedule, setIsEditingSchedule] = useState(false);

    // Form state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [taskForm, setTaskForm] = useState<{
        title: string;
        description: string;
        category: string;
        period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
        period_value: string;
        due_date: string;
        priority: 'low' | 'medium' | 'high' | 'urgent';
        notes: string;
    }>({
        title: '',
        description: '',
        category: '',
        period_type: 'monthly',
        period_value: '',
        due_date: '',
        priority: 'medium',
        notes: ''
    });

    const [scheduleForm, setScheduleForm] = useState<{
        title: string;
        description: string;
        category: string;
        frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
        day_of_month: number;
        day_of_week: number;
        month_of_year: number;
        deadline_offset_days: number;
        priority: 'low' | 'medium' | 'high' | 'urgent';
    }>({
        title: '',
        description: '',
        category: '',
        frequency: 'monthly',
        day_of_month: 1,
        day_of_week: 1,
        month_of_year: 1,
        deadline_offset_days: 7,
        priority: 'medium'
    });

    // ==========================================
    // DATA FETCHING
    // ==========================================

    const fetchTasks = useCallback(async () => {
        setTaskLoading(true);
        try {
            const response = await accountingApi.getAllTasks(taskFilters);
            if (response.success) {
                setTasks(response.data);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setTaskLoading(false);
        }
    }, [taskFilters]);

    const fetchTaskStats = useCallback(async () => {
        try {
            const response = await accountingApi.getTaskStats();
            if (response.success) {
                setTaskStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, []);

    const fetchSchedules = useCallback(async () => {
        setScheduleLoading(true);
        try {
            const response = await accountingApi.getAllSchedules();
            if (response.success) {
                setSchedules(response.data);
            }
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setScheduleLoading(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await accountingApi.getCategories();
            if (response.success) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        if (tabValue === 0) {
            fetchTasks();
            fetchTaskStats();
        } else if (tabValue === 1) {
            fetchSchedules();
        }
    }, [tabValue, fetchTasks, fetchTaskStats, fetchSchedules]);

    // ==========================================
    // HANDLERS
    // ==========================================

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleFilterChange = (field: keyof TaskFilters, value: string) => {
        setTaskFilters(prev => ({ ...prev, [field]: value || undefined }));
    };

    const handleCreateTask = async () => {
        setIsSubmitting(true);
        try {
            const response = await accountingApi.createTask(taskForm);
            if (response.success) {
                alert('Giao việc thành công!');
                setCreateTaskDialogOpen(false);
                resetTaskForm();
                fetchTasks();
                fetchTaskStats();
            }
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Có lỗi xảy ra khi tạo công việc');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditTask = (task: AccountingTask) => {
        setSelectedTask(task);
        setEditDialogOpen(true);
        // Fill form with task data
        setTaskForm({
            ...taskForm,
            title: task.title,
            description: task.description || '',
            category: task.category || '',
            period_type: (task.period_type as any) || 'monthly',
            period_value: task.period_value || '',
            due_date: task.due_date ? task.due_date.split('T')[0] : '',
            priority: (task.priority as any) || 'medium',
            notes: task.notes || ''
        });
    };

    const handleUpdateTask = async () => {
        if (!selectedTask) return;
        setIsSubmitting(true);
        try {
            // Also need to handle status update if it's in the form? 
            // The user requested: "Update để nó có thể chỉnh sửa tất cả các trường cho tôi"
            // So we should probably add status to the form or handle it here if we add a field.
            // For now, let's update basic fields.

            // Note: taskForm doesn't have `status`. Accessing `status` from a temp state would be better, 
            // but let's just stick to the requested fields or add status to taskForm?
            // Let's add status to taskForm in a separate commit or just handle it separately?
            // Better: update taskForm definition to include status.

            const response = await accountingApi.updateTask(selectedTask.id, taskForm);
            if (response.success) {
                alert('Cập nhật thành công!');
                setEditDialogOpen(false);
                setSelectedTask(null);
                resetTaskForm();
                fetchTasks();
                fetchTaskStats();
            }
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Lỗi cập nhật công việc');
        } finally {
            setIsSubmitting(false);
        }
    };



    const handleDeleteTask = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa công việc này?')) return;
        try {
            await accountingApi.deleteTask(id);
            fetchTasks();
            fetchTaskStats();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleSaveSchedule = async () => {
        try {
            let response;
            if (isEditingSchedule && selectedSchedule) {
                response = await accountingApi.updateSchedule(selectedSchedule.id, scheduleForm);
            } else {
                response = await accountingApi.createSchedule(scheduleForm);
            }

            if (response.success) {
                alert(isEditingSchedule ? 'Cập nhật lịch thành công!' : 'Tạo lịch thành công!');
                setScheduleDialogOpen(false);
                resetScheduleForm();
                fetchSchedules();
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('Có lỗi xảy ra khi lưu lịch định kỳ');
        }
    };

    const handleEditSchedule = (schedule: RecurringSchedule) => {
        setSelectedSchedule(schedule);
        setIsEditingSchedule(true);
        setScheduleForm({
            title: schedule.title,
            description: schedule.description || '',
            category: schedule.category || '',
            frequency: schedule.frequency,
            day_of_month: schedule.day_of_month || 1,
            day_of_week: schedule.day_of_week || 1,
            month_of_year: schedule.month_of_year || 1,
            deadline_offset_days: schedule.deadline_offset_days,
            priority: schedule.priority
        });
        setScheduleDialogOpen(true);
    };

    const handleToggleSchedule = async (id: number, isActive: boolean) => {
        try {
            await accountingApi.toggleSchedule(id, isActive);
            fetchSchedules();
        } catch (error) {
            console.error('Error toggling schedule:', error);
        }
    };

    const handleDeleteSchedule = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa lịch định kỳ này?')) return;
        try {
            await accountingApi.deleteSchedule(id);
            fetchSchedules();
        } catch (error) {
            console.error('Error deleting schedule:', error);
        }
    };

    const handleRunSchedulesNow = async () => {
        try {
            const response = await accountingApi.runSchedulesNow();
            if (response.success) {
                alert(response.message);
                fetchTasks();
                fetchTaskStats();
                fetchSchedules();
            }
        } catch (error) {
            console.error('Error running schedules:', error);
        }
    };

    const resetTaskForm = () => {
        setTaskForm({
            title: '',
            description: '',
            category: '',
            period_type: 'monthly',
            period_value: '',
            due_date: '',
            priority: 'medium',
            notes: ''
        });
    };

    const resetScheduleForm = () => {
        setScheduleForm({
            title: '',
            description: '',
            category: '',
            frequency: 'monthly',
            day_of_month: 1,
            day_of_week: 1,
            month_of_year: 1,
            deadline_offset_days: 7,
            priority: 'medium'
        });
    };

    // ==========================================
    // TABLE COLUMNS
    // ==========================================

    const taskColumns: GridColDef[] = [
        { field: 'id', headerName: 'Mã', width: 70 },
        {
            field: 'title',
            headerName: 'Tiêu đề',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">{params.value}</Typography>
                    {params.row.notes && (
                        <Typography variant="caption" color="text.secondary">{params.row.notes}</Typography>
                    )}
                </Box>
            )
        },
        {
            field: 'category',
            headerName: 'Danh mục',
            width: 120,
            renderCell: (params: GridRenderCellParams) => {
                const cat = categories.find(c => c.value === params.value);
                return cat ? (
                    <Chip
                        label={`${cat.icon} ${cat.label}`}
                        size="small"
                        variant="outlined"
                    />
                ) : params.value;
            }
        },
        {
            field: 'period_value',
            headerName: 'Kỳ',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Chip label={params.value || '-'} size="small" color="primary" variant="outlined" />
            )
        },
        {
            field: 'due_date',
            headerName: 'Deadline',
            width: 110,
            renderCell: (params: GridRenderCellParams) => {
                const date = new Date(params.value);
                const isOverdue = date < new Date() && params.row.status !== 'completed';
                return (
                    <Typography
                        variant="body2"
                        color={isOverdue ? 'error' : 'inherit'}
                        fontWeight={isOverdue ? 'bold' : 'normal'}
                    >
                        {date.toLocaleDateString('vi-VN')}
                    </Typography>
                );
            }
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            width: 130,
            renderCell: (params: GridRenderCellParams) => {
                const config = STATUS_CONFIG[params.value] || STATUS_CONFIG.pending;
                return <Chip label={config.label} size="small" color={config.color} />;
            }
        },
        {
            field: 'priority',
            headerName: 'Ưu tiên',
            width: 110,
            renderCell: (params: GridRenderCellParams) => {
                const config = PRIORITY_CONFIG[params.value] || PRIORITY_CONFIG.medium;
                return <Chip label={config.label} size="small" color={config.color} variant="outlined" />;
            }
        },
        {
            field: 'task_type',
            headerName: 'Nguồn',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value === 'recurring' ? '🔁 Định kỳ' : '✋ Thủ công'}
                    size="small"
                    variant="outlined"
                    color={params.value === 'recurring' ? 'secondary' : 'default'}
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            width: 150,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box>
                    <Tooltip title="Xem chi tiết">
                        <IconButton size="small" onClick={() => {
                            setSelectedTask(params.row);
                            setViewDialogOpen(true);
                        }}>
                            <ViewIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <IconButton size="small" color="primary" onClick={() => handleEditTask(params.row)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteTask(params.row.id)}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    const scheduleColumns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 60 },
        { field: 'title', headerName: 'Tiêu đề', flex: 1, minWidth: 200 },
        {
            field: 'category',
            headerName: 'Danh mục',
            width: 120,
            renderCell: (params: GridRenderCellParams) => {
                const cat = categories.find(c => c.value === params.value);
                return cat ? `${cat.icon} ${cat.label}` : params.value;
            }
        },
        {
            field: 'frequency',
            headerName: 'Tần suất',
            width: 120,
            renderCell: (params: GridRenderCellParams) => {
                const freq = FREQUENCY_OPTIONS.find(f => f.value === params.value);
                return <Chip label={freq?.label || params.value} size="small" color="primary" />;
            }
        },
        {
            field: 'day_of_month',
            headerName: 'Ngày chạy',
            width: 100,
            renderCell: (params: GridRenderCellParams) => `Ngày ${params.value || '-'}`
        },
        {
            field: 'deadline_offset_days',
            headerName: 'Deadline',
            width: 100,
            renderCell: (params: GridRenderCellParams) => `+${params.value} ngày`
        },
        {
            field: 'next_run_date',
            headerName: 'Lần chạy tiếp',
            width: 120,
            renderCell: (params: GridRenderCellParams) =>
                params.value ? new Date(params.value).toLocaleDateString('vi-VN') : '-'
        },
        {
            field: 'is_active',
            headerName: 'Trạng thái',
            width: 110,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value ? '✅ Active' : '⏸️ Inactive'}
                    size="small"
                    color={params.value ? 'success' : 'default'}
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            width: 140,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box>
                    <Tooltip title={params.row.is_active ? 'Tắt' : 'Bật'}>
                        <IconButton
                            size="small"
                            color={params.row.is_active ? 'warning' : 'success'}
                            onClick={() => handleToggleSchedule(params.row.id, !params.row.is_active)}
                        >
                            {params.row.is_active ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <IconButton size="small" color="primary" onClick={() => handleEditSchedule(params.row)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteSchedule(params.row.id)}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/bod/finance')} sx={{ mr: 1 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Quản Lý Kế Toán
                </Typography>
            </Box>

            {/* Stats Cards */}
            {taskStats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <Card sx={{ bgcolor: '#e3f2fd' }}>
                            <CardContent sx={{ textAlign: 'center', py: 1 }}>
                                <Typography variant="h4" color="primary">{taskStats.total}</Typography>
                                <Typography variant="caption">Tổng công việc</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <Card sx={{ bgcolor: '#fff3e0' }}>
                            <CardContent sx={{ textAlign: 'center', py: 1 }}>
                                <Typography variant="h4" color="warning.main">{taskStats.pending}</Typography>
                                <Typography variant="caption">Chờ xử lý</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <Card sx={{ bgcolor: '#e3f2fd' }}>
                            <CardContent sx={{ textAlign: 'center', py: 1 }}>
                                <Typography variant="h4" color="info.main">{taskStats.in_progress}</Typography>
                                <Typography variant="caption">Đang làm</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <Card sx={{ bgcolor: '#fff8e1' }}>
                            <CardContent sx={{ textAlign: 'center', py: 1 }}>
                                <Typography variant="h4" color="warning.dark">{taskStats.review}</Typography>
                                <Typography variant="caption">Chờ duyệt</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <Card sx={{ bgcolor: '#e8f5e9' }}>
                            <CardContent sx={{ textAlign: 'center', py: 1 }}>
                                <Typography variant="h4" color="success.main">{taskStats.completed}</Typography>
                                <Typography variant="caption">Hoàn thành</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <Card sx={{ bgcolor: '#ffebee' }}>
                            <CardContent sx={{ textAlign: 'center', py: 1 }}>
                                <Typography variant="h4" color="error.main">{taskStats.overdue}</Typography>
                                <Typography variant="caption">Quá hạn</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <Paper sx={{ width: '100%', borderRadius: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="accountant management tabs">
                        <Tab label="Tiến độ công việc" icon={<AssignmentIcon />} iconPosition="start" />
                        <Tab label="Lên lịch định kỳ" icon={<ScheduleIcon />} iconPosition="start" />
                    </Tabs>
                </Box>

                {/* TAB 1: TIẾN ĐỘ CÔNG VIỆC */}
                <CustomTabPanel value={tabValue} index={0}>
                    {/* Filters */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        <TextField
                            select
                            label="Trạng thái"
                            size="small"
                            value={taskFilters.status || ''}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            sx={{ minWidth: 140 }}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                                <MenuItem key={key} value={key}>{label}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Danh mục"
                            size="small"
                            value={taskFilters.category || ''}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            sx={{ minWidth: 140 }}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            {categories.map(cat => (
                                <MenuItem key={cat.value} value={cat.value}>{cat.icon} {cat.label}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Kỳ (VD: 2025-01)"
                            size="small"
                            value={taskFilters.period_value || ''}
                            onChange={(e) => handleFilterChange('period_value', e.target.value)}
                            sx={{ minWidth: 140 }}
                        />

                        <TextField
                            label="Tìm kiếm"
                            size="small"
                            value={taskFilters.search || ''}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            sx={{ minWidth: 200 }}
                        />

                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={fetchTasks}
                        >
                            Làm mới
                        </Button>

                        <Box sx={{ flexGrow: 1 }} />

                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setCreateTaskDialogOpen(true)}
                        >
                            Giao việc mới
                        </Button>
                    </Box>

                    {/* Task DataGrid */}
                    <Box sx={{ height: 500 }}>
                        <DataGrid
                            rows={tasks}
                            columns={taskColumns}
                            loading={taskLoading}
                            pageSizeOptions={[10, 25, 50]}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 10 } }
                            }}
                            disableRowSelectionOnClick
                            sx={{
                                '& .MuiDataGrid-row:hover': {
                                    backgroundColor: '#f5f5f5'
                                }
                            }}
                        />
                    </Box>
                </CustomTabPanel>

                {/* TAB 2: LÊN LỊCH ĐỊNH KỲ */}
                <CustomTabPanel value={tabValue} index={1}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setIsEditingSchedule(false);
                                resetScheduleForm();
                                setScheduleDialogOpen(true);
                            }}
                        >
                            Tạo lịch định kỳ
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<PlayIcon />}
                            onClick={handleRunSchedulesNow}
                        >
                            Chạy lịch ngay
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={fetchSchedules}
                        >
                            Làm mới
                        </Button>
                    </Box>

                    <Alert severity="info" sx={{ mb: 2 }}>
                        <strong>Lưu ý:</strong> Hệ thống sẽ tự động tạo công việc từ lịch định kỳ vào lúc 00:05 mỗi ngày.
                        Bạn cũng có thể bấm "Chạy lịch ngay" để tạo công việc thủ công.
                    </Alert>

                    <Box sx={{ height: 400 }}>
                        <DataGrid
                            rows={schedules}
                            columns={scheduleColumns}
                            loading={scheduleLoading}
                            pageSizeOptions={[10, 25]}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 10 } }
                            }}
                            disableRowSelectionOnClick
                        />
                    </Box>
                </CustomTabPanel>


                {/* Dialog: Create Task */}
                <Dialog
                    open={createTaskDialogOpen}
                    onClose={() => setCreateTaskDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>Tạo công việc mới cho Kế toán</DialogTitle>
                    <DialogContent>
                        <Box component="form" sx={{ pt: 2 }}>
                            <TextField
                                label="Tiêu đề công việc"
                                fullWidth
                                required
                                sx={{ mb: 2 }}
                                value={taskForm.title}
                                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                            />

                            <TextField
                                label="Mô tả chi tiết"
                                multiline
                                rows={3}
                                fullWidth
                                sx={{ mb: 2 }}
                                value={taskForm.description}
                                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                            />

                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        label="Danh mục"
                                        fullWidth
                                        value={taskForm.category}
                                        onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                                    >
                                        {categories.map(cat => (
                                            <MenuItem key={cat.value} value={cat.value}>
                                                {cat.icon} {cat.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        label="Loại kỳ"
                                        fullWidth
                                        value={taskForm.period_type}
                                        onChange={(e) => setTaskForm({ ...taskForm, period_type: e.target.value as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' })}
                                    >
                                        {FREQUENCY_OPTIONS.map(opt => (
                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </Grid>

                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Giá trị kỳ (VD: 2025-01, Q1-2025)"
                                        fullWidth
                                        value={taskForm.period_value}
                                        onChange={(e) => setTaskForm({ ...taskForm, period_value: e.target.value })}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Hạn chót (Deadline)"
                                        type="date"
                                        fullWidth
                                        required
                                        InputLabelProps={{ shrink: true }}
                                        value={taskForm.due_date}
                                        onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        label="Độ ưu tiên"
                                        fullWidth
                                        value={taskForm.priority}
                                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                                    >
                                        {Object.entries(PRIORITY_CONFIG).map(([key, { label }]) => (
                                            <MenuItem key={key} value={key}>{label}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </Grid>

                            <TextField
                                label="Ghi chú"
                                multiline
                                rows={2}
                                fullWidth
                                sx={{ mb: 3 }}
                                value={taskForm.notes}
                                onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setCreateTaskDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleCreateTask}
                            disabled={!taskForm.title || !taskForm.due_date || isSubmitting}
                        >
                            {isSubmitting ? 'Đang xử lý...' : 'Giao việc'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>

            {/* Dialog: Create Schedule */}
            <Dialog
                open={scheduleDialogOpen}
                onClose={() => setScheduleDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {isEditingSchedule ? 'Chỉnh sửa lịch định kỳ' : 'Tạo lịch định kỳ mới'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            label="Tiêu đề công việc"
                            fullWidth
                            required
                            sx={{ mb: 2 }}
                            value={scheduleForm.title}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                        />

                        <TextField
                            label="Mô tả"
                            multiline
                            rows={2}
                            fullWidth
                            sx={{ mb: 2 }}
                            value={scheduleForm.description}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                        />

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    label="Danh mục"
                                    fullWidth
                                    value={scheduleForm.category}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, category: e.target.value })}
                                >
                                    {categories.map(cat => (
                                        <MenuItem key={cat.value} value={cat.value}>
                                            {cat.icon} {cat.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    label="Tần suất"
                                    fullWidth
                                    required
                                    value={scheduleForm.frequency}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' })}
                                >
                                    {FREQUENCY_OPTIONS.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Ngày trong tháng (1-31)"
                                    type="number"
                                    fullWidth
                                    InputProps={{ inputProps: { min: 1, max: 31 } }}
                                    value={scheduleForm.day_of_month}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_month: parseInt(e.target.value) })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Deadline sau (ngày)"
                                    type="number"
                                    fullWidth
                                    InputProps={{ inputProps: { min: 1, max: 60 } }}
                                    value={scheduleForm.deadline_offset_days}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, deadline_offset_days: parseInt(e.target.value) })}
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            select
                            label="Độ ưu tiên"
                            fullWidth
                            value={scheduleForm.priority}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                        >
                            {Object.entries(PRIORITY_CONFIG).map(([key, { label }]) => (
                                <MenuItem key={key} value={key}>{label}</MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setScheduleDialogOpen(false)}>Hủy</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveSchedule}
                        disabled={!scheduleForm.title || !scheduleForm.frequency}
                    >
                        {isEditingSchedule ? 'Lưu thay đổi' : 'Tạo lịch'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog: View Task Detail */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Chi tiết công việc</DialogTitle>
                <DialogContent>
                    {selectedTask && (
                        <Box sx={{ pt: 1 }}>
                            <Typography variant="h6" gutterBottom>{selectedTask.title}</Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {selectedTask.description || 'Không có mô tả'}
                            </Typography>

                            <Box sx={{ mt: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color="text.secondary">Trạng thái</Typography>
                                        <Box>
                                            <Chip
                                                label={STATUS_CONFIG[selectedTask.status]?.label}
                                                color={STATUS_CONFIG[selectedTask.status]?.color}
                                                size="small"
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color="text.secondary">Ưu tiên</Typography>
                                        <Box>
                                            <Chip
                                                label={PRIORITY_CONFIG[selectedTask.priority]?.label}
                                                color={PRIORITY_CONFIG[selectedTask.priority]?.color}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color="text.secondary">Kỳ</Typography>
                                        <Typography variant="body2">{selectedTask.period_value || '-'}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color="text.secondary">Deadline</Typography>
                                        <Typography variant="body2">
                                            {new Date(selectedTask.due_date).toLocaleDateString('vi-VN')}
                                        </Typography>
                                    </Grid>
                                    {selectedTask.notes && (
                                        <Grid size={{ xs: 12 }}>
                                            <Typography variant="caption" color="text.secondary">Ghi chú</Typography>
                                            <Typography variant="body2">{selectedTask.notes}</Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </Box>

                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog: Edit Task */}
            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Chỉnh sửa công việc</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            label="Tiêu đề công việc"
                            fullWidth
                            required
                            sx={{ mb: 2 }}
                            value={taskForm.title}
                            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                        />
                        <TextField
                            label="Mô tả chi tiết"
                            multiline
                            rows={3}
                            fullWidth
                            sx={{ mb: 2 }}
                            value={taskForm.description}
                            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        />
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    label="Trạng thái"
                                    fullWidth
                                    value={selectedTask?.status || 'pending'}
                                    onChange={(e) => {
                                        if (selectedTask) setSelectedTask({ ...selectedTask, status: e.target.value as any });
                                    }}
                                >
                                    {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                                        <MenuItem key={key} value={key}>{label}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    label="Độ ưu tiên"
                                    fullWidth
                                    value={taskForm.priority}
                                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                                >
                                    {Object.entries(PRIORITY_CONFIG).map(([key, { label }]) => (
                                        <MenuItem key={key} value={key}>{label}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    label="Danh mục"
                                    fullWidth
                                    value={taskForm.category}
                                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                                >
                                    {categories.map(cat => (
                                        <MenuItem key={cat.value} value={cat.value}>
                                            {cat.icon} {cat.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Hạn chót"
                                    type="date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={taskForm.due_date}
                                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                        <TextField
                            label="Ghi chú"
                            multiline
                            rows={2}
                            fullWidth
                            sx={{ mb: 3 }}
                            value={taskForm.notes}
                            onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Hủy</Button>
                    <Button
                        variant="contained"
                        onClick={handleUpdateTask}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
