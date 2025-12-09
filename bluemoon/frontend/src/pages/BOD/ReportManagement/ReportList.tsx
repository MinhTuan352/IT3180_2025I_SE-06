// src/pages/BOD/ReportManagement/ReportList.tsx
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// Icons
import VisibilityIcon from '@mui/icons-material/Visibility';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import { useWindowWidth } from '../../../hooks/useWindowWidth';
import { useLayout } from '../../../contexts/LayoutContext';
import incidentApi, { type Incident } from '../../../api/incidentApi';

const SIDEBAR_WIDTH_OPEN = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const PAGE_PADDING = 48;

export default function ReportList() {
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();
  const { isSidebarCollapsed } = useLayout();

  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<Incident[]>([]);

  // Modal State
  const [openDialog, setOpenDialog] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'Trung bình',
    images: [] as File[]
  });
  const [activeError, setActiveError] = useState<string | null>(null);

  const dynamicPaperWidth = windowWidth
    - (isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN)
    - PAGE_PADDING;

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await incidentApi.getAll();
      // Handle response data
      const data = (response as any).data || response;
      if (Array.isArray(data)) {
        setReports(data);
      } else if (data && Array.isArray(data.data)) {
        setReports(data.data);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  }

  const handleQuickComplete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row click if needed
    if (window.confirm("Bạn có chắc muốn đánh dấu sự cố này là Hoàn thành?")) {
      try {
        await incidentApi.update(id, { status: "Hoàn thành" });
        toast.success("Đã cập nhật thành công!");
        fetchReports(); // reload
      } catch (err) {
        toast.error("Lỗi khi cập nhật");
      }
    }
  };

  // --- CREATE INCIDENT LOGIC ---
  const handleOpenAdd = () => {
    setNewIncident({
      title: '',
      description: '',
      location: '',
      priority: 'Trung bình',
      images: []
    });
    setOpenDialog(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewIncident({ ...newIncident, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewIncident({ ...newIncident, images: Array.from(e.target.files) });
    }
  };

  const handleCreate = async () => {
    if (!newIncident.title || !newIncident.description) {
      setActiveError("Vui lòng nhập tiêu đề và mô tả");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', newIncident.title);
      formData.append('description', newIncident.description);
      formData.append('location', newIncident.location);
      formData.append('priority', newIncident.priority);

      if (newIncident.images) {
        newIncident.images.forEach((file) => {
          formData.append('images', file);
        });
      }

      await incidentApi.create(formData);
      toast.success("Tạo sự cố thành công!");
      setOpenDialog(false);
      fetchReports();
    } catch (err: any) {
      console.error(err);
      setActiveError(err.response?.data?.message || "Lỗi khi tạo sự cố");
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Mã SC', width: 90 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 130,
      renderCell: (params) => {
        const status = params.value;
        let color: "error" | "warning" | "success" | "default" = "error";
        if (status === 'Đang xử lý') color = 'warning';
        if (status === 'Hoàn thành') color = 'success';
        if (status === 'Đã hủy') color = 'default';

        return <Chip label={status} color={color} size="small" />;
      }
    },
    { field: 'title', headerName: 'Tiêu đề', flex: 1, minWidth: 250 },
    { field: 'priority', headerName: 'Mức độ', width: 120 },
    { field: 'reported_by', headerName: 'Người báo cáo', width: 180 },
    { field: 'location', headerName: 'Vị trí', width: 180 },
    {
      field: 'created_at',
      headerName: 'Ngày báo cáo',
      width: 160,
      type: 'dateTime',
      valueGetter: (value) => value ? new Date(value) : null,
      valueFormatter: (value: Date) => value ? value.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '',
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 120,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        return (
          <Box>
            <Tooltip title="Xem chi tiết / Xử lý">
              <IconButton size="small" onClick={() => navigate(`/bod/report/list/detail/${params.row.id}`)}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>

            {params.row.status !== 'Hoàn thành' && params.row.status !== 'Đã hủy' && (
              <Tooltip title="Đánh dấu Hoàn thành nhanh">
                <IconButton
                  size="small"
                  onClick={(e) => handleQuickComplete(params.row.id, e)}
                >
                  <TaskAltIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      }
    }
  ];

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }} sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            DANH SÁCH SỰ CỐ
          </Typography>
          <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenAdd}>
            Thêm sự cố
          </Button>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{
            height: '100%',
            width: dynamicPaperWidth >= 0 ? dynamicPaperWidth : '100%',
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <DataGrid
              rows={reports}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.id}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              sx={{
                border: 0,
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                  outline: 'none',
                },
                '&.MuiDataGrid-root': { p: 2 },
                minWidth: '900px',
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* MODAL THÊM SỰ CỐ */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Báo cáo Sự cố mới</DialogTitle>
        <DialogContent dividers>
          {activeError && <Alert severity="error" sx={{ mb: 2 }}>{activeError}</Alert>}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Tiêu đề sự cố"
                name="title"
                fullWidth
                required
                value={newIncident.title}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Vị trí / Khu vực"
                name="location"
                fullWidth
                value={newIncident.location}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                label="Mức độ ưu tiên"
                name="priority"
                fullWidth
                value={newIncident.priority}
                onChange={handleChange}
              >
                <MenuItem value="Thấp">Thấp</MenuItem>
                <MenuItem value="Trung bình">Trung bình</MenuItem>
                <MenuItem value="Cao">Cao</MenuItem>
                <MenuItem value="Khẩn cấp">Khẩn cấp</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Mô tả chi tiết"
                name="description"
                fullWidth
                multiline
                rows={3}
                required
                value={newIncident.description}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
              >
                Tải ảnh lên (Tối đa 3)
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
              {newIncident.images.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Đã chọn {newIncident.images.length} file
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleCreate}>Gửi Báo Cáo</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}