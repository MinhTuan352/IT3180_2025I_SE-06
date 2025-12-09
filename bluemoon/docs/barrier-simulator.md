# Hướng dẫn Mô phỏng Hệ thống Ra Vào (Barrier Simulator)

## Mục đích
Trang mô phỏng barrier cho phép dev/tester giả lập xe ra vào mà không cần thiết bị phần cứng thật.

---

## Truy cập trang mô phỏng

**URL ẩn (không hiển thị trong menu):**
```
http://localhost:5173/barrier-sim-8x7k2m
```

> ⚠️ **Lưu ý:** Link này không cần đăng nhập. Không chia sẻ cho khách hàng!

---

## Cách sử dụng

### 1. Mở 2 tab trình duyệt

| Tab | URL | Mục đích |
|-----|-----|----------|
| Tab 1 | `/barrier-sim-8x7k2m` | Mô phỏng xe ra vào |
| Tab 2 | `/bod/access-control` | Xem kết quả (cần đăng nhập BOD) |

### 2. Trên trang Barrier Simulator

- **Danh sách xe xanh**: Xe đã đăng ký trong hệ thống → hiển thị "Normal"
- **Xe màu vàng (51G-99999)**: Xe lạ → hiển thị "Warning"  
- **Xe màu đỏ (BLACKLIST-001)**: Xe blacklist → hiển thị "Alert"

### 3. Click nút hành động

- **Vào**: Mô phỏng xe đi vào cổng
- **Ra**: Mô phỏng xe đi ra cổng

### 4. Kiểm tra kết quả

Quay lại tab BOD Access Control → Xe vừa click sẽ xuất hiện sau **3 giây** (polling interval)

---

## Troubleshooting

### Lỗi "Lỗi khi mô phỏng ra vào"

**Nguyên nhân:** Bảng `access_logs` chưa tồn tại trong database

**Cách sửa:** Chạy migration trong XAMPP Shell:
```bash
mysql -u root bluemoon_db < "c:\path\to\bluemoon\database\migrate_access_logs.sql"
```

### Trang trắng hoặc 404

**Nguyên nhân:** Frontend chưa khởi động

**Cách sửa:**
```bash
cd bluemoon/frontend
npm run dev
```

---

## Cấu trúc file liên quan

```
bluemoon/
├── database/
│   ├── init.sql                    # Có bảng access_logs
│   └── migrate_access_logs.sql     # Script tạo bảng riêng
├── backend/
│   ├── controllers/accessController.js
│   └── routes/accessRoutes.js
└── frontend/src/
    ├── api/accessApi.ts
    ├── pages/BOD/AccessControl/AccessControl.tsx
    ├── pages/Simulator/BarrierSimulator.tsx   # Trang ẩn
    └── routes/index.tsx            # Route /barrier-sim-8x7k2m
```

---

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/access/logs` | Danh sách lịch sử |
| GET | `/api/access/latest?lastId=X` | Polling bản ghi mới |
| GET | `/api/access/stats` | Thống kê hôm nay |
| POST | `/api/access/simulate` | Mô phỏng xe ra vào |
| GET | `/api/access/simulator-vehicles` | Danh sách xe cho simulator |
