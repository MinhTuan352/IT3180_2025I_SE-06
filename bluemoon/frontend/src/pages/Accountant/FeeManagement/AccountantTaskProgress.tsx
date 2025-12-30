import {
    Box, Typography, Paper, Chip, TextField,
    MenuItem,
    Card, CardContent,
    Grid,
    Button // --- RE-ADDED ---
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useState, useEffect, useCallback } from 'react';
import {
    Refresh as RefreshIcon,
    Edit as EditIcon // --- ADDED ---
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import accountingApi, {
    type AccountingTask,
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

export default function AccountantTaskProgress() {
    // ... (rest of the component)
    const { user } = useAuth();

    // ... (rest of state and effects)
    const [tasks, setTasks] = useState<AccountingTask[]>([]);
    const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
    const [taskLoading, setTaskLoading] = useState(false);
    const [taskFilters, setTaskFilters] = useState<TaskFilters>({
        sort_by: 'created_at',
        sort_order: 'DESC'
    });
    const [categories, setCategories] = useState<Category[]>([]);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editNoteValue, setEditNoteValue] = useState('');

    const fetchTasks = useCallback(async () => {
        if (!user) return;
        setTaskLoading(true);
        try {
            // Filter by assigned_to = current user ID
            const filters: TaskFilters = {
                ...taskFilters,
                // assigned_to: typeof user.id === 'string' ? parseInt(user.id) : user.id
            };
            const response = await accountingApi.getAllTasks(filters);
            if (response.success) {
                setTasks(response.data);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setTaskLoading(false);
        }
    }, [taskFilters, user]);

    const fetchTaskStats = useCallback(async () => {
        if (!user) return;
        try {
            // Pass assigned_to filter
            // const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
            const response = await accountingApi.getTaskStats({}); // Removed filter to match table
            if (response.success) {
                setTaskStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, [user]);

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

    const handleStartEditNote = (task: AccountingTask) => {
        setEditingId(task.id);
        setEditNoteValue(task.notes || '');
    };

    const handleSaveNote = async () => {
        if (editingId === null) return;

        const originalTasks = [...tasks];
        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === editingId ? { ...t, notes: editNoteValue } : t
        ));

        try {
            await accountingApi.updateTask(editingId, { notes: editNoteValue });
            setEditingId(null);
        } catch (error) {
            console.error('Error updating note:', error);
            // Revert
            setTasks(originalTasks);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditNoteValue('');
    };

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        fetchTasks();
        fetchTaskStats();
    }, [fetchTasks, fetchTaskStats]);

    const handleFilterChange = (field: keyof TaskFilters, value: string) => {
        setTaskFilters(prev => ({ ...prev, [field]: value || undefined }));
    };

    const handleStatusChange = async (task: AccountingTask, newStatus: string) => {
        // Fast optimistic update
        const originalTasks = [...tasks];
        const updatedTasks = tasks.map(t =>
            t.id === task.id ? { ...t, status: newStatus as any } : t
        );
        setTasks(updatedTasks);

        try {
            await accountingApi.updateTaskStatus(task.id, newStatus);
            // Re-fetch stats to keep them in sync
            fetchTaskStats();
        } catch (error) {
            console.error('Error updating status:', error);
            // Revert on failure
            setTasks(originalTasks);
            alert('Cập nhật trạng thái thất bại');
        }
    };

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'Mã', width: 70 },
        {
            field: 'title',
            headerName: 'Tiêu đề & Tiến độ', // Updated Header
            flex: 1,
            minWidth: 300,
            renderCell: (params: GridRenderCellParams) => {
                const isEditing = editingId === params.row.id;

                return (
                    <Box sx={{ py: 1, width: '100%' }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                            {params.row.title}
                        </Typography>

                        {isEditing ? (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={editNoteValue}
                                    onChange={(e) => setEditNoteValue(e.target.value)}
                                    placeholder="Cập nhật tiến độ..."
                                    variant="outlined"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveNote();
                                        if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                    sx={{
                                        '& .MuiInputBase-root': { fontSize: '0.8rem', bgcolor: 'white' }
                                    }}
                                />
                                <Button
                                    size="small"
                                    variant="contained"
                                    sx={{ minWidth: 60, p: 0.5 }}
                                    onClick={handleSaveNote}
                                >
                                    Lưu
                                </Button>
                                <Button
                                    size="small"
                                    color="inherit"
                                    sx={{ minWidth: 30, p: 0.5 }}
                                    onClick={handleCancelEdit}
                                >
                                    ✕
                                </Button>
                            </Box>
                        ) : (
                            <Box
                                onClick={() => handleStartEditNote(params.row)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    '&:hover .edit-icon': { opacity: 1 },
                                    minHeight: 24
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        fontStyle: params.row.notes ? 'normal' : 'italic',
                                        color: params.row.notes ? 'text.secondary' : 'text.disabled'
                                    }}
                                >
                                    {params.row.notes || 'Chạm để thêm ghi chú tiến độ...'}
                                </Typography>
                                <EditIcon
                                    className="edit-icon"
                                    sx={{
                                        fontSize: 14,
                                        ml: 1,
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        color: 'primary.main'
                                    }}
                                />
                            </Box>
                        )}
                    </Box>
                );
            }
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
            width: 150,
            renderCell: (params: GridRenderCellParams) => {
                // Allow direct status change in the table
                return (
                    <TextField
                        select
                        size="small"
                        value={params.value}
                        onChange={(e) => handleStatusChange(params.row, e.target.value)}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{
                            '& .MuiSelect-select': {
                                py: 0,
                                px: 1,
                                borderRadius: 1,
                                bgcolor: () => { // FIXED: Removed unused 'theme'
                                    const config = STATUS_CONFIG[params.value];
                                    switch (config?.color) {
                                        case 'success': return '#e8f5e9';
                                        case 'warning': return '#fff8e1';
                                        case 'info': return '#e3f2fd';
                                        case 'error': return '#ffebee';
                                        default: return '#f5f5f5';
                                    }
                                }
                            }
                        }}
                    >
                        {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                            <MenuItem key={key} value={key}>
                                {label}
                            </MenuItem>
                        ))}
                    </TextField>
                );
            }
        },
        // ... rest of columns

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
        }
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                Tiến độ công việc
            </Typography>

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

            <Paper sx={{ width: '100%', borderRadius: 3, p: 2 }}>
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
                </Box>

                <Box sx={{ height: 600 }}>
                    <DataGrid
                        rows={tasks}
                        columns={columns}
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
            </Paper>
        </Box>
    );
}
