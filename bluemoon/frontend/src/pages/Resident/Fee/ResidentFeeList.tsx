// src/pages/Resident/Fee/ResidentFeeList.tsx
import { Box, Typography, Paper, Chip, IconButton, Tooltip, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PaymentIcon from '@mui/icons-material/Payment';
import { format, parseISO } from 'date-fns';
import { useState, useEffect } from 'react';
import feeApi, { type Fee } from '../../../api/feeApi';
import sidebarApi from '../../../api/sidebarApi'; // --- THÊM MỚI: Để đánh dấu đã xem ---

// Định nghĩa lại kiểu Status cho cư dân
type FeeStatusResident = 'Chưa thanh toán' | 'Đã thanh toán' | 'Quá hạn' | 'Thanh toán một phần' | 'Đã hủy';

export default function ResidentFeeList() {
    const navigate = useNavigate();

    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [invoices, setInvoices] = useState<Fee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- USE EFFECT (Gọi API thật) ---
    useEffect(() => {
        fetchInvoices();

        // --- THÊM MỚI: Đánh dấu đã xem trang Công nợ (để badge = 0) ---
        sidebarApi.markFeesViewed().catch(err => {
            console.log('Failed to mark fees as viewed:', err);
        });
    }, []);

    const fetchInvoices = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await feeApi.getAll();
            // Backend trả về { success: true, count: X, data: [...] }
            const data = (response.data as any).data || response.data || [];
            setInvoices(data);
        } catch (err: any) {
            console.error('Error fetching invoices:', err);
            setError(err.response?.data?.message || 'Không thể tải danh sách công nợ. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    const columns: GridColDef<Fee>[] = [
        { field: 'id', headerName: 'Mã HĐ', width: 140 },
        { field: 'fee_name', headerName: 'Loại phí', width: 140 },
        { field: 'description', headerName: 'Nội dung', flex: 1, minWidth: 220 },
        {
            field: 'due_date',
            headerName: 'Hạn TT',
            width: 120,
            type: 'date',
            valueGetter: (value) => value ? parseISO(value) : null,
            renderCell: (params: GridRenderCellParams<any, Date | null>) => (
                params.value ? format(params.value, 'dd/MM/yyyy') : ''
            )
        },
        {
            field: 'total_amount',
            headerName: 'Tổng tiền',
            width: 130,
            type: 'number',
            valueFormatter: (value: number | null) => (value != null ? value.toLocaleString('vi-VN') + ' đ' : '0 đ')
        },
        {
            field: 'amount_remaining',
            headerName: 'Còn nợ',
            width: 130,
            type: 'number',
            renderCell: (params: GridRenderCellParams<any, number | null | undefined>) => {
                const value = params.value ?? 0;
                return (
                    <Typography color={value > 0 ? 'error' : 'inherit'} fontWeight={value > 0 ? 'bold' : 'normal'}>
                        {value.toLocaleString('vi-VN')} đ
                    </Typography>
                );
            }
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            width: 160,
            renderCell: (params: GridRenderCellParams<any, FeeStatusResident>) => {
                const status = params.value;
                let color: "success" | "warning" | "error" | "info" = "success";
                if (status === 'Chưa thanh toán') color = 'warning';
                if (status === 'Quá hạn') color = 'error';
                if (status === 'Thanh toán một phần') color = 'info';
                if (!status || status === 'Đã hủy') return null;
                return <Chip label={status} color={color} size="small" />;
            }
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            width: 120,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params: GridRenderCellParams<any, any, Fee>) => {
                const status = params.row.status as FeeStatusResident | 'Đã hủy' | undefined;
                const needsPayment = status === 'Chưa thanh toán' || status === 'Quá hạn' || status === 'Thanh toán một phần';
                return (
                    <Box>
                        <Tooltip title="Xem chi tiết">
                            <IconButton size="small" onClick={() => navigate(`/resident/fee/invoice_info/${params.row.id}`)}>
                                <VisibilityIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={needsPayment ? "Thanh toán" : "Đã thanh toán"}>
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={() => navigate(`/resident/fee/payment/${params.row.id}`)}
                                    disabled={!needsPayment}
                                    color={needsPayment ? "primary" : "default"}
                                >
                                    <PaymentIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                );
            }
        }
    ];

    return (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                Công nợ & Phí Dịch vụ
            </Typography>

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {!isLoading && !error && invoices && invoices.length > 0 && (
                <Box sx={{ height: '65vh', width: '100%' }}>
                    <DataGrid
                        rows={invoices}
                        columns={columns}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 10 } },
                            sorting: {
                                sortModel: [{ field: 'due_date', sort: 'asc' }],
                            },
                        }}
                        pageSizeOptions={[10, 20, 50]}
                        disableRowSelectionOnClick
                        getRowId={(row) => row.id}
                        sx={{ border: 0 }}
                    />
                </Box>
            )}

            {!isLoading && !error && (!invoices || invoices.length === 0) && (
                <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
                    Bạn không có công nợ nào cần thanh toán.
                </Typography>
            )}
        </Paper>
    );
}