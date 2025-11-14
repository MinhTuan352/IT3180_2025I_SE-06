[ROLE BAN QUẢN TRỊ] 
1. Trang Admin
    1.1. Admin list
    const mockAdmins = [
        { id: 'ID0001', name: 'Nguyễn Văn A', role: 'bod' },
        { id: 'ID0002', name: 'Nguyễn Văn B', role: 'accountance' },
        { id: 'ID0003', name: 'Nguyễn Văn C', role: 'bod' },
        { id: 'ID0004', name: 'Nguyễn Văn D', role: 'accountance' },
        { id: 'ID0005', name: 'Trần Thị E', role: 'bod' },
        { id: 'ID0006', name: 'Lê Văn F', role: 'accountance' },
        { id: 'ID0007', name: 'Phạm Hữu G', role: 'bod' },
        { id: 'ID0008', name: 'Hoàng Minh H', role: 'bod' },
        { id: 'ID0009', name: 'Vũ Thị I', role: 'accountance' },
        { id: 'ID0010', name: 'Đặng Văn K', role: 'bod' },
    ];
    1.2. Admin Profile
    const mockData = {
    'ID0001': {
        fullName: 'Nguyễn Văn A',
        dob: '1990-01-01',
        gender: 'Nam',
        cccd: '012345678901',
        phone: '0900000001',
        email: 'admin.a@bluemoon.com',
        role: 1, // ID của BQT
        username: 'admin.a',
    },
    'ID0002': {
        fullName: 'Nguyễn Văn B',
        dob: '1992-05-10',
        gender: 'Nam',
        cccd: '012345678902',
        phone: '0900000002',
        email: 'ketoan.b@bluemoon.com',
        role: 2, // ID của Kế toán
        username: 'ketoan.b',
    },
    // ... (thêm data cho các ID khác)
    };

2. Trang Cư dân
    2.1. Resident List
    const mockResidents = [
        { id: 'R0001', name: 'Trần Văn Hộ', apartment: 'A-101', role: 'owner' },
        { id: 'R0002', name: 'Nguyễn Thị Thành Viên', apartment: 'A-101', role: 'member' },
        { id: 'R0003', name: 'Lê Gia Đình', apartment: 'B-205', role: 'owner' },
        { id: 'R0004', name: 'Phạm Văn B', apartment: 'C-1503', role: 'owner' },
        { id: 'R0005', name: 'Hoàng Thị C', apartment: 'D-404', role: 'member' },
    ];

    2.2. Resident Profile
    const mockData = {
    'R0001': {
        fullName: 'Trần Văn Hộ',
        apartment: 'A-101',
        role: 'owner', // <-- Chủ hộ
        dob: '1980-01-01',
        gender: 'Nam',
        cccd: '012345678001',
        phone: '0900000001',
        email: 'chuho.a@bluemoon.com',
        status: 'Đang sinh sống',
        hometown: 'Hà Nội', // <-- THÊM MỚI
        occupation: 'Kỹ sư', // <-- THÊM MỚI
        username: 'chuho_a101', // <-- THÊM MỚI
    },
    'R0002': {
        fullName: 'Nguyễn Thị Thành Viên',
        apartment: 'A-101',
        role: 'member', // <-- Thành viên
        dob: '1985-02-02',
        gender: 'Nữ',
        cccd: '012345678002',
        phone: '0900000002',
        email: 'thanhvien.a@bluemoon.com',
        status: 'Đang sinh sống',
        hometown: 'Hải Phòng', // <-- THÊM MỚI
        occupation: 'Giáo viên', // <-- THÊM MỚI
        username: null, // (Không có tài khoản)
    },
    };

3. Trang Công nợ
    const mockFees: GridRowsProp = [
    { 
        id: 'HD0001', 
        apartment_id: 'A-101', 
        resident_name: 'Trần Văn Hộ', 
        fee_type: 'Phí Quản lý', 
        description: 'PQL Tháng 10/2025', 
        billing_period: 'T10/2025',
        due_date: '2025-10-15',
        total_amount: 1200000,
        amount_paid: 1200000,
        amount_remaining: 0,
        status: 'Đã thanh toán',
        payment_date: '2025-10-10',
    },
    { 
        id: 'HD0002', 
        apartment_id: 'A-101', 
        resident_name: 'Trần Văn Hộ', 
        fee_type: 'Phí Gửi xe', 
        description: 'Xe ô tô BKS 29A-12345', 
        billing_period: 'T10/2025',
        due_date: '2025-10-15',
        total_amount: 1000000,
        amount_paid: 0,
        amount_remaining: 1000000,
        status: 'Chưa thanh toán',
        payment_date: null,
    },
    { 
        id: 'HD0003', 
        apartment_id: 'B-205', 
        resident_name: 'Lê Gia Đình', 
        fee_type: 'Phí Quản lý', 
        description: 'PQL Tháng 09/2025', 
        billing_period: 'T09/2025',
        due_date: '2025-09-15',
        total_amount: 1500000,
        amount_paid: 0,
        amount_remaining: 1500000,
        status: 'Quá hạn',
        payment_date: null,
    },
    { 
        id: 'HD0004', 
        apartment_id: 'C-1503', 
        resident_name: 'Phạm Văn B', 
        fee_type: 'Phí Nước', 
        description: 'Tiền nước T09 (25m³)', 
        billing_period: 'T09/2025',
        due_date: '2025-10-05',
        total_amount: 350000,
        amount_paid: 350000,
        amount_remaining: 0,
        status: 'Đã thanh toán',
        payment_date: '2025-10-01',
    },
    { 
        id: 'HD0005', 
        apartment_id: 'D-404', 
        resident_name: 'Hoàng Thị C', 
        fee_type: 'Sửa chữa', 
        description: 'Sửa rò rỉ ống nước', 
        billing_period: 'T10/2025',
        due_date: '2025-10-20',
        total_amount: 800000,
        amount_paid: 400000, // Thanh toán 1 phần
        amount_remaining: 400000,
        status: 'Chưa thanh toán',
        payment_date: null,
    },
    ];

    // --- ĐỊNH NGHĨA CÁC CỘT (COLUMNS) CHO BẢNG ---
    const columns: GridColDef[] = [
    // 1. Mã Công Nợ
    { field: 'id', headerName: 'Mã HĐ', width: 90 },
    // 2. Mã Căn Hộ
    { field: 'apartment_id', headerName: 'Căn hộ', width: 70 },
    // 3. Tên Chủ Hộ
    { field: 'resident_name', headerName: 'Người TT', width: 150 },
    // 4. Loại Phí
    { field: 'fee_type', headerName: 'Loại phí', width: 100 },
    // 5. Nội dung
    { field: 'description', headerName: 'Nội dung', width: 180 },
    // 6. Kỳ TT
    { field: 'billing_period', headerName: 'Kỳ TT', width: 70 },
    // 7. Hạn TT
    { 
        field: 'due_date', 
        headerName: 'Hạn TT', 
        width: 100,
        type: 'date',
        valueGetter: (value) => new Date(value),
    },
    // 8. Tổng Thu
    { 
        field: 'total_amount', 
        headerName: 'Tổng thu', 
        width: 100,
        type: 'number',
        valueFormatter: (value: number) => value.toLocaleString('vi-VN') + ' đ',
    },
    // 9. Đã Thu
    { 
        field: 'amount_paid', 
        headerName: 'Đã thu', 
        width: 100,
        type: 'number',
        valueFormatter: (value: number) => value.toLocaleString('vi-VN') + ' đ',
    },
    // 10. Còn Nợ
    { 
        field: 'amount_remaining', 
        headerName: 'Dư nợ', 
        width: 100,
        type: 'number',
        valueFormatter: (value: number) => value.toLocaleString('vi-VN') + ' đ',
    },
    // 11. Trạng Thái (Render Chip)
    { 
        field: 'status', 
        headerName: 'Trạng thái', 
        width: 130,
        renderCell: (params) => {
        const status = params.value as FeeStatus;
        let color: "success" | "warning" | "error" | "default" = "default";
        if (status === 'Đã thanh toán') color = 'success';
        if (status === 'Chưa thanh toán') color = 'warning';
        if (status === 'Quá hạn') color = 'error';
        return <Chip label={status} color={color} size="small" />;
        }
    },
    // 12. Ngày TT
    { 
        field: 'payment_date', 
        headerName: 'Ngày TT', 
        width: 100,
        type: 'date',
        valueGetter: (value) => (value ? new Date(value) : null),
    },
    // 13. Hành Động (Render Buttons)
    {
        field: 'actions',
        headerName: 'Hành động',
        width: 150,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
        <Box>
            <Tooltip title="Xem chi tiết / In HĐ">
            <IconButton size="small" onClick={() => alert(`Xem HĐ: ${params.row.id}`)}>
                <VisibilityIcon />
            </IconButton>
            </Tooltip>
            <Tooltip title="Xác nhận thanh toán">
            <IconButton 
                size="small" 
                onClick={() => alert(`Thanh toán: ${params.row.id}`)}
                disabled={params.row.status === 'Đã thanh toán'}
            >
                <PaymentIcon />
            </IconButton>
            </Tooltip>
            <Tooltip title="Gửi nhắc nhở">
            <IconButton 
                size="small" 
                onClick={() => alert(`Gửi nhắc nhở: ${params.row.id}`)}
                disabled={params.row.status === 'Đã thanh toán'}
            >
                <NotificationsIcon />
            </IconButton>
            </Tooltip>
            {/* <Tooltip title="Sửa">
            <IconButton size="small"><EditIcon /></IconButton>
            </Tooltip> */}
        </Box>
        )
    }
    ];

4. Trang Thông báo
    4.1. Notification List
    const mockNotifications: GridRowsProp = [
    { 
        id: 'TB001', 
        title: 'Thông báo lịch cắt điện Tòa A', 
        created_by: 'BQL Nguyễn Văn A',
        created_at: '2025-10-28T10:30:00',
        target: 'Tất cả Cư dân',
        recipients_count: 150,
        type: 'Khẩn cấp', // <-- THÊM MỚI
        scheduled_at: null, // <-- THÊM MỚI
    },
    { 
        id: 'TB002', 
        title: 'Thông báo họp tổ dân phố Quý 4', 
        created_by: 'BQL Trần Thị B',
        created_at: '2025-10-27T15:00:00',
        target: 'Tất cả Cư dân',
        recipients_count: 150,
        type: 'Chung', // <-- THÊM MỚI
        scheduled_at: null,
    },
    { 
        id: 'TB003', 
        title: 'Nhắc nhở đóng phí quản lý T10/2025', 
        created_by: 'Kế toán Lê Văn C',
        created_at: '2025-10-25T09:00:00',
        target: 'Cá nhân (Nợ phí)',
        recipients_count: 22,
        type: 'Thu phí', // <-- THÊM MỚI
        scheduled_at: null,
    },
    { 
        id: 'TB004', 
        title: 'Thông báo lịch phun thuốc muỗi (Hẹn giờ)', 
        created_by: 'BQL Nguyễn Văn A',
        created_at: '2025-10-24T11:00:00', // (Thời gian tạo)
        target: 'Tất cả Cư dân',
        recipients_count: 150,
        type: 'Chung',
        scheduled_at: '2025-10-30T09:00:00', // <-- THÊM MỚI (Thời gian sẽ gửi)
    },
    ];

    // --- CẬP NHẬT ĐỊNH NGHĨA CỘT ---
    const columns: GridColDef[] = [
    { field: 'id', headerName: 'Mã TB', width: 90 },
    { field: 'title', headerName: 'Tiêu đề', flex: 1, minWidth: 250 },
    // --- THÊM MỚI: CỘT LOẠI ---
    { 
        field: 'type', 
        headerName: 'Loại', 
        width: 100,
        renderCell: (params) => {
        const type = params.value;
        let color: "error" | "warning" | "primary" = "primary";
        if (type === 'Khẩn cấp') color = 'error';
        if (type === 'Thu phí') color = 'warning';
        return <Chip label={type} color={color} size="small" />;
        }
    },
    { field: 'created_by', headerName: 'Người gửi', width: 150 },
    { 
        field: 'created_at', 
        headerName: 'Ngày tạo', 
        width: 160,
        type: 'dateTime',
        valueGetter: (value) => new Date(value),
        valueFormatter: (value: Date) => value.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }),
    },
    // --- THÊM MỚI: CỘT LỊCH GỬI ---
    { 
        field: 'scheduled_at', 
        headerName: 'Lịch gửi', 
        width: 160,
        type: 'dateTime',
        valueGetter: (value) => (value ? new Date(value) : null),
        renderCell: (params) => {
        if (!params.value) {
            return <Typography variant="body2" sx={{ color: 'text.secondary' }}>Gửi ngay</Typography>;
        }
        return params.value.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
        }
    },
    { field: 'target', headerName: 'Đối tượng', width: 130 },
    { 
        field: 'recipients_count', 
        headerName: 'Số lượng nhận', 
        width: 120,
        type: 'number',
        valueFormatter: (value: number) => `${value} người`,
    },
    {
        field: 'actions',
        headerName: 'Hành động',
        width: 120,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
        const navigate = useNavigate(); // Hook phải được gọi bên trong
        return (
            <Box>
            <Tooltip title="Xem chi tiết">
                {/* CẬP NHẬT: onClick */}
                <IconButton size="small" onClick={() => navigate(`/bod/notification/detail/${params.row.id}`)}>
                <VisibilityIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Sao chép">
                <IconButton size="small" onClick={() => alert(`Copy: ${params.row.id}`)}>
                <ContentCopyIcon />
                </IconButton>
            </Tooltip>
            </Box>
        );
        }
    }
    ];

    4.2. Notification Detail
    const mockNotifications: { [key: string]: any } = {
    'TB001': { 
        id: 'TB001', 
        title: 'Thông báo lịch cắt điện Tòa A', 
        created_by: 'BQL Nguyễn Văn A',
        created_at: '2025-10-28T10:30:00',
        target: 'Tất cả Cư dân',
        type: 'Khẩn cấp',
        scheduled_at: null,
        content: 'Do sự cố đột xuất tại trạm biến áp, Tòa A sẽ tạm ngưng cung cấp điện từ 14:00 đến 15:00 ngày 28/10/2025 để khắc phục. Mong quý cư dân thông cảm.',
        attachments: [
        { name: 'SoDoTramBienAp.jpg', url: '#' },
        ]
    },
    // ... (thêm các thông báo khác nếu cần)
    };

5. Trang Sự cố
    5.1. Report List
    const mockReports: GridRowsProp = [
    { 
        id: 'SC001', 
        title: 'Vỡ ống nước khu vực hầm B2', 
        reported_by: 'Trần Văn Hộ (A-101)',
        location: 'Hầm B2, cột 15',
        created_at: '2025-10-28T09:00:00',
        status: 'Mới',
    },
    { 
        id: 'SC002', 
        title: 'Thang máy sảnh B liên tục báo lỗi', 
        reported_by: 'Lê Gia Đình (B-205)',
        location: 'Thang máy B, Tòa B',
        created_at: '2025-10-27T14:30:00',
        status: 'Đang xử lý',
    },
    { 
        id: 'SC003', 
        title: 'Bóng đèn hành lang tầng 15 Tòa A bị cháy', 
        reported_by: 'Phạm Văn B (C-1503)',
        location: 'Hành lang Tầng 15, Tòa A',
        created_at: '2025-10-27T11:00:00',
        status: 'Hoàn thành',
    },
    { 
        id: 'SC004', 
        title: 'Tiếng ồn lạ từ máy phát điện', 
        reported_by: 'Hoàng Thị C (D-404)',
        location: 'Phòng kỹ thuật, Tầng G',
        created_at: '2025-10-26T22:00:00',
        status: 'Mới',
    },
    ];

    // --- ĐỊNH NGHĨA CỘT (THEO TƯ VẤN) ---
    const columns: GridColDef[] = [
    { field: 'id', headerName: 'Mã SC', width: 90 },
    { 
        field: 'status', 
        headerName: 'Trạng thái', 
        width: 130,
        renderCell: (params) => {
        const status = params.value as ReportStatus;
        let color: "error" | "warning" | "success" | "default" = "error";
        if (status === 'Đang xử lý') color = 'warning';
        if (status === 'Hoàn thành') color = 'success';
        if (status === 'Đã hủy') color = 'default';
        
        return <Chip label={status} color={color} size="small" />;
        }
    },
    { field: 'title', headerName: 'Tiêu đề', flex: 1, minWidth: 250 },
    { field: 'reported_by', headerName: 'Người báo cáo', width: 180 },
    { field: 'location', headerName: 'Vị trí', width: 180 },
    { 
        field: 'created_at', 
        headerName: 'Ngày báo cáo', 
        width: 160,
        type: 'dateTime',
        valueGetter: (value) => new Date(value),
        valueFormatter: (value: Date) => 
        value.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
        field: 'actions',
        headerName: 'Hành động',
        width: 120,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
        const navigate = useNavigate();
        return (
            <Box>
            <Tooltip title="Xem chi tiết / Xử lý">
                <IconButton size="small" onClick={() => navigate(`/bod/report/list/detail/${params.row.id}`)}>
                <VisibilityIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Đánh dấu Hoàn thành nhanh">
                <IconButton 
                size="small" 
                onClick={() => alert(`Hoàn thành: ${params.row.id}`)}
                disabled={params.row.status === 'Hoàn thành'}
                >
                <TaskAltIcon />
                </IconButton>
            </Tooltip>
            </Box>
        );
        }
    }
    ];

    5.2. Report Detail
    const mockReportDetail: { [key: string]: any } = {
    'SC001': { 
        id: 'SC001', 
        title: 'Vỡ ống nước khu vực hầm B2', 
        reported_by: 'Trần Văn Hộ (A-101)',
        location: 'Hầm B2, cột 15',
        created_at: '2025-10-28T09:00:00',
        status: 'Mới',
        description: 'Tôi phát hiện nước chảy thành dòng lớn ở hầm B2, khu vực cột 15. Đang ngập ra khu vực đỗ xe. Yêu cầu BQL xử lý khẩn cấp.',
    },
    'SC002': { 
        id: 'SC002', 
        title: 'Thang máy sảnh B liên tục báo lỗi', 
        reported_by: 'Lê Gia Đình (B-205)',
        location: 'Thang máy B, Tòa B',
        created_at: '2025-10-27T14:30:00',
        status: 'Đang xử lý',
        description: 'Thang máy sảnh B (thang chở hàng) đi từ tầng 1 lên tầng 10 thì bị dừng đột ngột và báo lỗi "DOOR_ERR". Phải đợi 5 phút mới mở cửa được. Yêu cầu BQL kiểm tra gấp.',
    },
    // ... (thêm các sự cố khác)
    };

    type ReportStatus = 'Mới' | 'Đang xử lý' | 'Hoàn thành' | 'Đã hủy';

[ROLE KẾ TOÁN]
1. Trang Công nợ
    1.1. Fee List
    const mockFees: GridRowsProp = [
    { 
        id: 'HD0001', 
        apartment_id: 'A-101', 
        resident_name: 'Trần Văn Hộ', 
        fee_type: 'Phí Quản lý', 
        description: 'PQL Tháng 10/2025', 
        billing_period: 'T10/2025',
        due_date: '2025-10-15',
        total_amount: 1200000,
        amount_paid: 1200000,
        amount_remaining: 0,
        status: 'Đã thanh toán',
        payment_date: '2025-10-10',
    },
    { 
        id: 'HD0002', 
        apartment_id: 'A-101', 
        resident_name: 'Trần Văn Hộ', 
        fee_type: 'Phí Gửi xe', 
        description: 'Xe ô tô BKS 29A-12345', 
        billing_period: 'T10/2025',
        due_date: '2025-10-15',
        total_amount: 1000000,
        amount_paid: 0,
        amount_remaining: 1000000,
        status: 'Chưa thanh toán',
        payment_date: null,
    },
    { 
        id: 'HD0003', 
        apartment_id: 'B-205', 
        resident_name: 'Lê Gia Đình', 
        fee_type: 'Phí Quản lý', 
        description: 'PQL Tháng 09/2025', 
        billing_period: 'T09/2025',
        due_date: '2025-09-15',
        total_amount: 1500000,
        amount_paid: 0,
        amount_remaining: 1500000,
        status: 'Quá hạn',
        payment_date: null,
    },
    { 
        id: 'HD0004', 
        apartment_id: 'C-1503', 
        resident_name: 'Phạm Văn B', 
        fee_type: 'Phí Nước', 
        description: 'Tiền nước T09 (25m³)', 
        billing_period: 'T09/2025',
        due_date: '2025-10-05',
        total_amount: 350000,
        amount_paid: 350000,
        amount_remaining: 0,
        status: 'Đã thanh toán',
        payment_date: '2025-10-01',
    },
    { 
        id: 'HD0005', 
        apartment_id: 'D-404', 
        resident_name: 'Hoàng Thị C', 
        fee_type: 'Sửa chữa', 
        description: 'Sửa rò rỉ ống nước', 
        billing_period: 'T10/2025',
        due_date: '2025-10-20',
        total_amount: 800000,
        amount_paid: 400000, // Thanh toán 1 phần
        amount_remaining: 400000,
        status: 'Chưa thanh toán',
        payment_date: null,
    },
    ];

    1.2. Fee Invoice Create
    const mockResidents = [
    { id: 'R0001', name: 'Trần Văn Hộ', apartment: 'A-101' },
    { id: 'R0002', name: 'Lê Gia Đình', apartment: 'B-205' },
    ];

    // Định nghĩa kiểu cho một dòng trong bảng chi tiết
    interface InvoiceItem {
    id: number; // ID tạm thời để xóa
    name: string;
    dvt: string;
    sl: number;
    don_gia: number;
    thanh_tien: number;
    }

    1.3. Fee Invoice
    const mockInvoiceData: { [key: string]: any } = {
    'HD0001': {
        id: 'HD0001',
        kyhieu: 'BM/23E',
        so: '0001234',
        ngay: '28/10/2025',
        residentName: 'Trần Văn Hộ',
        residentId: 'R0001',
        apartment: 'A-101',
        address: '123 Đường ABC, Q.1, TP.HCM', // Địa chỉ cư dân (nếu có)
        mst: '0301234567', // Mã số thuế cư dân (nếu có)
        paymentMethod: 'Chuyển khoản',
        items: [
        { stt: 1, name: 'Phí Quản lý T10/2025', dvt: 'Tháng', sl: 1, don_gia: 1200000, thanh_tien: 1200000 },
        ],
        total: 1200000,
        totalInWords: 'Một triệu hai trăm nghìn đồng chẵn.',
        status: 'Đã thanh toán', // Trạng thái hóa đơn
    },
    'HD0002': {
        id: 'HD0002',
        kyhieu: 'BM/23E',
        so: '0001235',
        ngay: '28/10/2025',
        residentName: 'Trần Văn Hộ',
        residentId: 'R0001',
        apartment: 'A-101',
        address: '123 Đường ABC, Q.1, TP.HCM',
        mst: '0301234567',
        paymentMethod: 'Chuyển khoản',
        items: [
        { stt: 1, name: 'Phí Gửi xe T10/2025 (Xe 29A-12345)', dvt: 'Tháng', sl: 1, don_gia: 1000000, thanh_tien: 1000000 },
        ],
        total: 1000000,
        totalInWords: 'Một triệu đồng chẵn.',
        status: 'Chưa thanh toán',
    },
    // ... thêm các hóa đơn khác
    };

[ROLE CƯ DÂN]
tương tự như trên