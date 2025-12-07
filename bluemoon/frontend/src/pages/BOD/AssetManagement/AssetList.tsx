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
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import { useState, useEffect } from 'react';

// Icons
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BuildIcon from '@mui/icons-material/Build'; // Icon bảo trì

import { useWindowWidth } from '../../../hooks/useWindowWidth';
import { useLayout } from '../../../contexts/LayoutContext';
import axiosClient from '../../../api/axiosClient';

const SIDEBAR_WIDTH_OPEN = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const PAGE_PADDING = 48;

// Interface cho Asset
interface Asset {
  id: number;
  asset_code: string;
  name: string;
  description: string;
  location: string;
  status: string;
  next_maintenance: string | null;
  last_maintenance: string | null;
}

export default function AssetList() {
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();
  const { isSidebarCollapsed } = useLayout();
  const dynamicPaperWidth = windowWidth - (isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN) - PAGE_PADDING;

  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Data
  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosClient.get('/assets');
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

    fetchAssets();
  }, []);

  // --- EXPORT REPORT ---
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(assets);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachTaiSan');
    XLSX.writeFile(wb, 'BaoCaoTaiSan.xlsx');
  };

  // Format Date
  const formatDate = (isoString: string | null) => {
    if (!isoString) return '---';
    return new Date(isoString).toLocaleDateString('vi-VN'); // Chỉ cần ngày/tháng/năm
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
        // So sánh ngày (bỏ qua giờ)
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
      field: 'actions', headerName: 'Hành động', width: 120, sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Chi tiết / Lịch sử">
            <IconButton size="small" onClick={() => navigate(`/bod/asset/detail/${params.row.id}`)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ghi nhận bảo trì">
            <IconButton size="small" color="primary">
              <BuildIcon />
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
          <Button variant="contained" startIcon={<AddCircleOutlineIcon />}>
            Thêm Tài sản
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600, width: dynamicPaperWidth, borderRadius: 3 }}>
        <DataGrid
          loading={loading}
          rows={assets}
          columns={columns}
          getRowId={(row) => row.id} // Chỉ định rõ ID là trường nào
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25]}
          disableRowSelectionOnClick
          sx={{ border: 0 }}
        />
      </Paper>
    </Box>
  );
}