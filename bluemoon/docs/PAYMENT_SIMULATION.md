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

## Giả lập Đóng góp Quỹ (Donation)

Tương tự như thanh toán hóa đơn, luồng đóng góp quỹ cũng sử dụng QR code và polling để kiểm tra trạng thái.

### Quy trình:

1.  Cư dân vào trang chi tiết quỹ -> Chọn "Đóng góp ngay".
2.  Nhập số tiền -> Bấm "Tạo mã QR".
3.  Lấy mã giao dịch (Transfer Content) hiển thị trên màn hình (ví dụ: `QG1735598270123`).

### Cách giả lập thanh toán (Command Line):

Chạy lệnh sau trong Terminal/PowerShell:

```powershell
curl -X POST "http://localhost:3000/api/donations/simulate/MA_GIAO_DICH"
```

**Ví dụ:**

```powershell
curl -X POST "http://localhost:3000/api/donations/simulate/QG1735598270123"
```

⚠️ Lưu ý: Hệ thống donation sử dụng bảng `pending_donations` trong DB để lưu trạng thái giao dịch tạm thời (khác với `pendingPayments` map in-memory của phần thanh toán hóa đơn).

---

## ⚠️ Quan trọng: Khi Deploy (Production) thì sao?

Lệnh `curl localhost...` **CHỈ DÙNG** khi bạn đang phát triển (Dev) trên máy cá nhân để test thử tính năng mà không cần chuyển tiền thật.

Khi đưa hệ thống lên mạng (Deploy/Production), quy trình sẽ hoạt động tự động như sau:

1.  **Không dùng lệnh curl nữa**: Bạn hoặc admin không cần gõ lệnh gì cả.
2.  **Webhook từ Ngân hàng**: Khi cư dân chuyển khoản thật, Ngân hàng (hoặc dịch vụ trung gian như Casso/Sepay) sẽ đóng vai trò người gọi API.
    *   Thay vì bạn gõ `curl`, hệ thống của Ngân hàng sẽ tự động gửi một request đến server của bạn (ví dụ: `https://bluemoon-app.com/api/payment/webhook`).
3.  **Endpoint**:
    *   Dev: Dùng `/api/donations/simulate` (để giả lập).
    *   Prod: Dùng `/api/payment/webhook` (để nhận tin báo tiền về thật từ ngân hàng).

**Tóm lại:** Lệnh `curl` chỉ là "đóng vai" ngân hàng để test lúc code thôi nhé!

---

*Cập nhật lần cuối: 01/01/2026*
