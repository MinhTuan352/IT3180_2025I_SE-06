// src/pages/BOD/AssetManagement/AssetList.tsx
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  //Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';

// Icons
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BuildIcon from '@mui/icons-material/Build'; // Icon bảo trì

import { useWindowWidth } from '../../../hooks/useWindowWidth';
import { useLayout } from '../../../contexts/LayoutContext';

const SIDEBAR_WIDTH_OPEN = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const PAGE_PADDING = 48;

// --- MOCK DATA ---
const mockAssets = [
  { id: 'TS001', name: 'Thang máy A1', type: 'Thang máy', location: 'Tòa A', status: 'Hoạt động', next_maintenance: '2025-12-20', last_maintenance: '2025-11-20' },
  { id: 'TS002', name: 'Thang máy A2', type: 'Thang máy', location: 'Tòa A', status: 'Đang bảo trì', next_maintenance: '2025-12-05', last_maintenance: '2025-10-20' },
  { id: 'TS003', name: 'Máy phát điện dự phòng', type: 'Điện', location: 'Hầm B1', status: 'Hoạt động', next_maintenance: '2026-01-15', last_maintenance: '2025-06-15' },
  { id: 'TS004', name: 'Máy bơm PCCC', type: 'PCCC', location: 'Hầm B2', status: 'Hỏng', next_maintenance: '2025-12-01', last_maintenance: '2025-01-10' },
  { id: 'TS005', name: 'Ghế đá công viên', type: 'Tiện ích', location: 'Sân chung', status: 'Hoạt động', next_maintenance: null, last_maintenance: null },
];

export default function AssetList() {
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();
  const { isSidebarCollapsed } = useLayout();
  const dynamicPaperWidth = windowWidth - (isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_OPEN) - PAGE_PADDING;

  // --- EXPORT REPORT ---
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(mockAssets);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachTaiSan');
    XLSX.writeFile(wb, 'BaoCaoTaiSan.xlsx');
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Mã TS', width: 90 },
    { field: 'name', headerName: 'Tên Tài sản', flex: 1, minWidth: 200 },
    { field: 'type', headerName: 'Loại', width: 120 },
    { field: 'location', headerName: 'Vị trí', width: 120 },
    { 
      field: 'status', headerName: 'Trạng thái', width: 140,
      renderCell: (params) => {
        let color: "success" | "warning" | "error" | "default" = "default";
        if (params.value === 'Hoạt động') color = 'success';
        if (params.value === 'Đang bảo trì') color = 'warning';
        if (params.value === 'Hỏng') color = 'error';
        return <Chip label={params.value} color={color} size="small" />;
      }
    },
    { 
      field: 'next_maintenance', headerName: 'Lịch bảo trì tới', width: 150,
      renderCell: (params) => {
        if (!params.value) return '---';
        const date = new Date(params.value);
        const today = new Date();
        const isOverdue = date < today;
        return (
          <Typography 
            variant="body2" 
            color={isOverdue ? 'error.main' : 'text.primary'} 
            fontWeight={isOverdue ? 'bold' : 'normal'}
          >
            {params.value} {isOverdue && '(Quá hạn)'}
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

      <Paper sx={{ height: 600, width: dynamicPaperWidth, borderRadius: 3 }}>
        <DataGrid
          rows={mockAssets}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25]}
          disableRowSelectionOnClick
          sx={{ border: 0 }}
        />
      </Paper>
    </Box>
  );
}