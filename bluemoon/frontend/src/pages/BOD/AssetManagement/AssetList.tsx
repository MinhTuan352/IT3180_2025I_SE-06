// src/pages/BOD/AssetManagement/AssetList.tsx
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// Icons
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
//import BuildIcon from '@mui/icons-material/Build';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { useWindowWidth } from '../../../hooks/useWindowWidth';
import { useLayout } from '../../../contexts/LayoutContext';
import assetApi, { type Asset } from '../../../api/assetApi';

const SIDEBAR_WIDTH_OPEN = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const PAGE_PADDING = 48;

export default function AssetList() {
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();
  const { isSidebarCollapsed } = useLayout();
  const dynamicPaperWidth = windowWidth - (isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN) - PAGE_PADDING;

  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [openDialog, setOpenDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<Asset>({
    asset_code: '',
    name: '',
    description: '',
    location: '',
    status: 'Hoạt động',
    next_maintenance: null
  });

  // Fetch Data
  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await assetApi.getAll();
      if (response.data && response.data.success) {
        setAssets(response.data.data);
      }
    } catch (err: any) {
      console.error('Lỗi tải danh sách tài sản:', err);
      setError('Không thể tải dữ liệu tài sản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // --- HANDLERS ---
  const handleOpenAdd = () => {
    setIsEdit(false);
    setCurrentAsset({
      asset_code: '',
      name: '',
      description: '',
      location: '',
      status: 'Hoạt động',
      next_maintenance: null
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setIsEdit(true);
    setCurrentAsset(asset);
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc muốn xóa tài sản này?")) {
      try {
        if (!id) return;
        await assetApi.delete(id);
        toast.success("Đã xóa tài sản!");
        fetchAssets();
      } catch (err) {
        toast.error("Lỗi khi xóa tài sản!");
      }
    }
  };

  const handleSave = async () => {
    try {
      if (isEdit && currentAsset.id) {
        await assetApi.update(currentAsset.id, currentAsset);
        toast.success("Cập nhật tài sản thành công!");
      } else {
        await assetApi.create(currentAsset);
        toast.success("Thêm tài sản thành công!");
      }
      setOpenDialog(false);
      fetchAssets();
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra!");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentAsset(prev => ({ ...prev, [name]: value }));
  };

  // --- EXPORT REPORT ---
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(assets);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachTaiSan');
    XLSX.writeFile(wb, 'BaoCaoTaiSan.xlsx');
  };

  // Format Date
  const formatDate = (isoString: string | null | undefined) => {
    if (!isoString) return '---';
    return new Date(isoString).toLocaleDateString('vi-VN');
  };

  const columns: GridColDef[] = [
    { field: 'asset_code', headerName: 'Mã TS', width: 90 },
    { field: 'name', headerName: 'Tên Tài sản', flex: 1, minWidth: 200 },
    { field: 'description', headerName: 'Mô tả / Loại', width: 150 },
    { field: 'location', headerName: 'Vị trí', width: 120 },
    {
      field: 'status', headerName: 'Trạng thái', width: 140,
      renderCell: (params) => {
        let color: "success" | "warning" | "error" | "default" = "default";
        if (params.value === 'Đang hoạt động' || params.value === 'Hoạt động') color = 'success';
        if (params.value === 'Đang bảo trì') color = 'warning';
        if (params.value === 'Hỏng') color = 'error';
        return <Chip label={params.value} color={color} size="small" />;
      }
    },
    {
      field: 'next_maintenance', headerName: 'Lịch bảo trì tới', width: 150,
      valueFormatter: (value) => formatDate(value as string),
      renderCell: (params) => {
        if (!params.value) return '---';
        const date = new Date(params.value as string);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isOverdue = date < today;
        return (
          <Typography
            variant="body2"
            color={isOverdue ? 'error.main' : 'text.primary'}
            fontWeight={isOverdue ? 'bold' : 'normal'}
          >
            {formatDate(params.value as string)} {isOverdue && '(Quá hạn)'}
          </Typography>
        );
      }
    },
    {
      field: 'actions', headerName: 'Hành động', width: 150, sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Chỉnh sửa">
            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(params.row)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chi tiết">
            <IconButton size="small" onClick={() => navigate(`/bod/asset/detail/${params.row.id}`)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>QUẢN LÝ TÀI SẢN & THIẾT BỊ</Typography>
        <Box>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExport} sx={{ mr: 1, bgcolor: 'white' }}>
            Xuất Báo cáo
          </Button>
          <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenAdd}>
            Thêm Tài sản
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600, width: dynamicPaperWidth, borderRadius: 3, overflow: 'auto' }}>
        <DataGrid
          loading={loading}
          rows={assets}
          columns={columns}
          getRowId={(row) => row.id || Math.random()}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25]}
          disableRowSelectionOnClick
          sx={{ border: 0 }}
        />
      </Paper>

      {/* MODAL THÊM / SỬA TÀI SẢN */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? 'Cập nhật Tài sản' : 'Thêm mới Tài sản'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Mã Tài sản"
                name="asset_code"
                fullWidth
                value={currentAsset.asset_code}
                onChange={handleChange}
                className="mt-2"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Tên Tài sản"
                name="name"
                fullWidth
                value={currentAsset.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Vị trí"
                name="location"
                fullWidth
                value={currentAsset.location}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Trạng thái"
                name="status"
                fullWidth
                value={currentAsset.status}
                onChange={handleChange}
              >
                <MenuItem value="Hoạt động">Hoạt động</MenuItem>
                <MenuItem value="Đang bảo trì">Đang bảo trì</MenuItem>
                <MenuItem value="Hỏng">Hỏng</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Mô tả / Ghi chú"
                name="description"
                fullWidth
                multiline
                rows={3}
                value={currentAsset.description}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>{isEdit ? 'Lưu thay đổi' : 'Thêm mới'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}