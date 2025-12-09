# Hướng dẫn Sử dụng Hệ thống Quản lý Chung cư BlueMoon

Tài liệu này cung cấp hướng dẫn chi tiết từng bước cho mọi chức năng trong hệ thống, bao gồm ý nghĩa của các trường dữ liệu và quy trình xử lý.

---

## MỤC LỤC

1. [Quy trình Đăng nhập & Bảo mật](#1-quy-trình-đăng-nhập--bảo-mật)
2. [Module Ban Quản Trị (BOD)](#2-module-ban-quản-trị-bod)
    - [Quản lý Cư dân](#21-quản-lý-cư-dân)
    - [Hệ thống Kiểm soát Ra vào (An ninh)](#22-hệ-thống-kiểm-soát-ra-vào-an-ninh)
    - [Báo cáo & Thống kê](#23-báo-cáo--thống-kê)
3. [Module Kế toán (Accountant)](#3-module-kế-toán-accountant)
    - [Thiết lập Loại phí & Thanh toán](#31-thiết-lập-dữ-liệu-nền)
    - [Quy trình Tạo & Quản lý Hóa đơn](#32-quy-trình-tạo--quản-lý-hóa-đơn)
4. [Module Cư dân (Resident)](#4-module-cư-dân-resident)
    - [Gửi phản ánh sự cố](#41-gửi-phản-ánh-sự-cố)
    - [Thanh toán Hóa đơn](#42-thanh-toán-hóa-đơn)
5. [Công cụ Mô phỏng (Dành cho Kiểm thử)](#5-công-cụ-mô-phỏng-simulation)

---

## 1. Quy trình Đăng nhập & Bảo mật

### 1.1. Đăng nhập
1. Truy cập địa chỉ website.
2. Nhập **Tên đăng nhập** (Username) và **Mật khẩu** (Password).
    - *Lưu ý*: Hệ thống phân quyền tự động dựa trên tài khoản của bạn (Admin, Accountant, hoặc Resident).
3. Nhấn nút **"Đăng nhập"**.
4. Nếu sai thông tin: Hệ thống sẽ báo lỗi "Tên đăng nhập hoặc mật khẩu không đúng".

### 1.2. Đăng xuất
- Nhấn vào Avatar/Tên người dùng ở góc phải màn hình Dashboard.
- Chọn **"Đăng xuất"**. Hệ thống xóa phiên làm việc và trở về trang đăng nhập.

---

## 2. Module Ban Quản Trị (BOD)

### 2.1. Quản lý Cư dân
Truy cập: Menu bên trái -> **Quản lý Cư dân**.

#### A. Thêm mới Cư dân (`ResidentCreate`)
1. Nhấn nút **"Thêm cư dân"** tại màn hình danh sách.
2. Điền thông tin vào phiếu "Tạo hồ sơ Cư dân":
    - **Thông tin Bắt buộc (*)**:
        - `Họ và tên`: Nhập đầy đủ họ tên.
        - `Căn hộ`: Chọn mã căn hộ từ danh sách sổ xuống (Ví dụ: A-101, B-205).
        - `CCCD`: Nhập số Căn cước công dân (Dùng để định danh duy nhất).
    - **Thông tin Bổ sung**:
        - `Ngày sinh`: Chọn ngày/tháng/năm.
        - `Giới tính`: Nam / Nữ / Khác.
        - `Quê quán`, `Nghề nghiệp`.
        - `Số điện thoại` & `Email`: Thông tin liên lạc quan trọng để nhận thông báo phí.
    - **Thông tin Cư trú**:
        - `Quyền hạn`: Chọn "Chủ hộ" (Đứng tên căn hộ) hoặc "Thành viên".
        - `Tình trạng`: "Đang sinh sống" hoặc "Đã chuyển đi".
3. Nhấn **"Thêm cư dân"** để lưu. ID cư dân (Ví dụ: R0005) sẽ được hệ thống tự động sinh ra.

#### B. Tra cứu thông tin
- **Danh sách Cư dân**: Sử dụng ô tìm kiếm để lọc theo Tên hoặc Mã căn hộ.
- **Tra cứu Căn hộ (`ResidentApartmentLookup`)**: Nhập mã căn hộ để xem danh sách tất cả thành viên, tổng số người, và diện tích căn hộ.

### 2.2. Hệ thống Kiểm soát Ra vào (An ninh)
Truy cập: Menu bên trái -> **Kiểm soát Ra vào**.

#### Màn hình Giám sát Trực tiếp (`AccessControl`)
Đây là màn hình Real-time dành cho bảo vệ hoặc bộ phận an ninh.
- **Live Feed (Cột trái)**:
    - Hiển thị hình ảnh và thông tin xe vừa đi qua barrier gần nhất.
    - **Trạng thái An ninh**:
        - `Bình thường` (Xanh): Xe đã đăng ký, được phép qua.
        - `Cảnh báo` (Cam): Xe lạ cần kiểm tra.
        - `BÁO ĐỘNG` (Đỏ & Nhấp nháy): Xe nằm trong danh sách đen hoặc phát hiện xâm nhập trái phép.
    - Nút **Tạm dừng/Tiếp tục**: Dùng để dừng cập nhật màn hình khi cần xem kỹ thông tin một xe vừa qua.
- **Nhật ký Hoạt động (Cột phải)**:
    - Bảng danh sách lịch sử 50 lượt ra vào gần nhất.
    - Các cột: Thời gian, Cổng, Hướng (Vào/Ra), Biển số, Loại xe, Chủ xe.

### 2.3. Báo cáo & Thống kê
- **Báo cáo Ra vào (`AccessReport`)**: Xem tổng hợp lưu lượng xe theo ngày/tuần.
- **Lịch sử Đăng nhập (`LoginManagement`)**: Kiểm tra xem ai đã đăng nhập vào hệ thống vào thời gian nào (audit log).

---

## 3. Module Kế toán (Accountant)

### 3.1. Thiết lập Dữ liệu nền
Trước khi tạo hóa đơn, cần thiết lập các thông số.

#### A. Thiết lập Loại phí (`FeeSetupList`)
Truy cập: **Thiết lập** -> **Các loại phí**.
1. Nhấn **"Thêm loại phí"**.
2. Nhập `Tên phí` (Ví dụ: Phí Quản Lý, Phí Gửi Xe Ô tô).
3. Nhập `Mã phí` (Viết tắt, không dấu. Ví dụ: PQL, OTO).
4. Nhập `Đơn giá` (VNĐ) và `Đơn vị tính` (Tháng, Số điện, Khối nước).
5. Nhấn Lưu.
    *   *Lưu ý*: Chỉ được xóa loại phí chưa từng xuất hiện trong bất kỳ hóa đơn nào.

#### B. Thiết lập Thanh toán
- Cấu hình số tài khoản ngân hàng và mã QR nhận tiền của Ban quản lý để in lên hóa đơn.

### 3.2. Quy trình Tạo & Quản lý Hóa đơn

#### A. Tạo Hóa đơn Lẻ (`AccountantFeeInvoiceCreate`)
Dùng cho các khoản thu phát sinh hoặc thu riêng từng hộ.
1. Chọn **Q.Lý Phí Chung cư** -> **Tạo hóa đơn**.
2. **Thông tin Chung**:
    - `Chọn Cư dân`: Tìm theo Tên hoặc Căn hộ.
    - `Ngày HĐ`: Mặc định là ngày hiện tại.
    - `Hình thức TT`: Chuyển khoản / Tiền mặt.
3. **Chi tiết Hóa đơn** (Bảng kê):
    - Nhấn **"Thêm dòng"**.
    - Nhập `Tên hàng hóa/dịch vụ`, `ĐVT`, `Số lượng`.
    - `Đơn giá`: Nhập giá tiền.
    - `Thành tiền`: Tự động tính (Số lượng x Đơn giá).
4. Kiểm tra tổng tiền và số tiền bằng chữ.
5. Nhấn **"Tạo Hóa đơn"**.

#### B. Import Chỉ số Điện/Nước (`AccountantMeasureImport`)
- Dùng để nhập nhanh chỉ số điện nước cuối tháng cho toàn bộ tòa nhà.
- Hỗ trợ nhập tay hoặc Upload file Excel theo mẫu quy định.

#### C. Quản lý Hóa đơn (`AccountantFeeList`)
- Xem trạng thái: `Chưa thanh toán` (Màu vàng), `Đã thanh toán` (Màu xanh), `Đã hủy` (Màu đỏ).
- **Thao tác**:
    - **Xác nhận thanh toán**: Với các hóa đơn chuyển khoản, Kế toán kiểm tra ngân hàng rồi bấm nút xác nhận trên hệ thống để đổi trạng thái sang "Đã thanh toán".
    - **Nhắc nợ**: Gửi email/thông báo tự động cho các hộ chậm nộp.

---

## 4. Module Cư dân (Resident)

### 4.1. Gửi phản ánh sự cố
Truy cập: **Phản ánh & Kiến nghị** -> **Gửi phản ánh mới**.
1. **Tiêu đề**: Tóm tắt ngắn gọn (VD: Vòi nước hành lang hỏng).
2. **Vị trí**: Ghi rõ nơi xảy ra (VD: Trước cửa căn hộ B-502).
3. **Mức độ ưu tiên**:
    - `Thấp/Trung bình`: Vấn đề vệ sinh, mỹ quan.
    - `Cao/Khẩn cấp`: Vấn đề an toàn, cháy nổ, vỡ đường ống nước.
4. **Mô tả chi tiết**: Ghi rõ tình trạng hiện tại.
5. **Đính kèm ảnh**: Chọn tối đa 3 ảnh minh họa (Định dạng JPG, PNG).
6. Nhấn **"Gửi Báo Cáo"**. Theo dõi tiến độ xử lý tại menu **Lịch sử phản ánh**.

### 4.2. Thanh toán Hóa đơn
Truy cập: **Phí & Hóa đơn**.
1. Xem danh sách các khoản phí trong tháng.
2. Chọn hóa đơn cần thanh toán.
3. Nhấn **"Thanh toán"**:
    - Quét mã QR hiển thị trên màn hình bằng ứng dụng ngân hàng.
    - Hoặc chuyển khoản theo nội dung cú pháp hiển thị.
4. Sau khi chuyển khoản, hệ thống sẽ cập nhật trạng thái sau khi Kế toán xác nhận.

---

## 5. Công cụ Mô phỏng (Simulation)

Dành cho kiểm thử hệ thống Barrier mà không cần thiết bị thật.

Truy cập: `/simulator` hoặc công cụ nội bộ.

1. **Giao diện**: Danh sách các xe đăng ký trong hệ thống.
2. **Thao tác**:
    - Tìm xe muốn giả lập.
    - Nhấn nút **"Vào"**: Giả lập xe đi từ ngoài đường vào chung cư.
    - Nhấn nút **"Ra"**: Giả lập xe từ chung cư đi ra.
3. **Phản hồi**:
    - Thông báo Snackbar góc phải hiện lên xác nhận.
    - Quay lại màn hình **Admin > Kiểm soát Ra vào** để thấy dữ liệu vừa giả lập xuất hiện ngay lập tức (Test tính năng Real-time).
