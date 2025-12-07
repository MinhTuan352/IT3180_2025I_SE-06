// src/pages/BOD/ReportManagement/ReportList.tsx
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';

// Icons
import VisibilityIcon from '@mui/icons-material/Visibility';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

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
        alert("Đã cập nhật thành công!");
        fetchReports(); // reload
      } catch (err) {
        alert("Lỗi khi cập nhật");
      }
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Mả SC', width: 90 },
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
        <Grid sx={{
          xs: 12,
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            DANH SÁCH SỰ CỐ
          </Typography>
        </Grid>

        <Grid sx={{ xs: 12 }}>
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
    </>
  );
}