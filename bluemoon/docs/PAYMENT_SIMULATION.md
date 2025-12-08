# Hướng dẫn Giả lập Thanh toán (Payment Simulation)

Tài liệu này hướng dẫn cách test hệ thống thanh toán tự động trong môi trường development.

## Tổng quan Flow Thanh toán

```
Cư dân mở trang thanh toán
        ↓
Hiển thị QR code MBBank
        ↓
Frontend polling mỗi 5 giây (GET /api/payment/status/:invoiceId)
        ↓
[Trong thực tế] Cư dân quét QR, chuyển tiền → Ngân hàng gọi webhook
[Trong dev/test] Gọi API simulate để giả lập thanh toán
        ↓
Hệ thống cập nhật trạng thái hóa đơn → "Đã thanh toán"
        ↓
Frontend detect thay đổi → Hiển thị "Thanh toán thành công!"
```

## Cách Giả lập Thanh toán (Chỉ dùng trong DEV/TEST)

### Bước 1: Mở trang thanh toán

Đăng nhập với tài khoản cư dân, vào **Công nợ** → chọn hóa đơn → **Thanh toán**

Ghi nhớ **mã hóa đơn** (ví dụ: `HD0002`)

### Bước 2: Gọi API Simulate

Mở **PowerShell** hoặc **Terminal** và chạy lệnh:

```powershell
curl -X POST "http://localhost:3000/api/payment/simulate/HD0002"
```

> ⚠️ Thay `HD0002` bằng mã hóa đơn thực tế bạn muốn test

### Bước 3: Xem kết quả

- Nếu thành công, API sẽ trả về:
  ```json
  {
    "success": true,
    "message": "Đã giả lập thanh toán thành công!",
    "data": { ... }
  }
  ```

- Frontend sẽ tự động cập nhật sau tối đa 5 giây (polling interval)
- Trang sẽ hiển thị **"Thanh toán thành công!"** với icon ✓ màu xanh

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/payment/generate-qr/:invoiceId` | Tạo thông tin QR (cần auth) |
| `GET` | `/api/payment/status/:invoiceId` | Kiểm tra trạng thái thanh toán (cần auth) |
| `POST` | `/api/payment/webhook` | Webhook nhận callback từ ngân hàng (không auth) |
| `POST` | `/api/payment/simulate/:invoiceId` | **Giả lập thanh toán** (không auth, chỉ dùng để test) |

## Lưu ý

1. **API simulate không yêu cầu authentication** để dễ dàng test từ command line
2. Trong **production**, nên xóa hoặc bảo vệ endpoint `/simulate` 
3. Webhook `/webhook` được thiết kế để nhận callback từ ngân hàng/payment gateway thực tế

## Ví dụ gọi Webhook thủ công

Nếu muốn test webhook với nội dung tùy chỉnh:

```powershell
curl -X POST "http://localhost:3000/api/payment/webhook" -H "Content-Type: application/json" -d "{\"transferContent\": \"HD0002\", \"amount\": 500000, \"transactionId\": \"TEST123\"}"
```

---

*Cập nhật lần cuối: 08/12/2024*
