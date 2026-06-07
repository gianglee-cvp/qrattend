# Báo Cáo Định Hướng Phát Triển - Tuần 1
**Dự án:** Hệ Thống Điểm Danh QR Attendance
**Mục tiêu Tuần 1:** Hoàn thiện Core Features, nâng cấp trải nghiệm người dùng (UX/UI) và xử lý lỗi cơ bản.

## 1. Tình trạng hiện tại
Hệ thống cơ bản đã hoàn thành luồng tạo mã QR từ phía giáo viên và quét mã, chụp ảnh xác thực từ phía sinh viên. Tuy nhiên, giao diện cần được cải thiện để tương thích hoàn toàn với các thiết bị di động và các trạng thái loading, báo lỗi vẫn chưa thực sự rõ ràng.

## 2. Các công việc cần thực hiện trong Tuần 1

### 2.1. Nâng cấp Giao diện (UI/UX)
- Khắc phục các vấn đề hiển thị trên màn hình nhỏ (Mobile Responsive).
- Thêm các trạng thái **Loading (Spinner)** khi hệ thống đang xử lý upload ảnh hoặc xác thực điểm danh để tránh người dùng bấm nhiều lần.
- Cải thiện hệ thống **Thông báo (Toast/Alert)** để hiển thị phản hồi rõ ràng (ví dụ: "Điểm danh thành công!", "Lỗi kết nối mạng", "Vui lòng nhập MSSV").

### 2.2. Xử lý logic Upload Ảnh (Selfie)
- **Giới hạn dung lượng ảnh**: Validate để tránh việc người dùng upload file quá nặng làm nghẽn quá trình gửi request lên backend.
- **Nén ảnh ở phía Client** (trước khi gửi lên server) giúp tiếp kiệm băng thông và tối ưu tốc độ lưu trữ.
- Hiển thị bản xem trước (preview) rõ nét sau khi chụp/chọn ảnh.

### 2.3. Quản lý danh sách sinh viên & phiên học (Cơ bản)
- Phía Backend: Cập nhật Schema để lưu trữ một cách phân biệt các `Session` (Phiên học) do giáo viên tạo.
- Mỗi lần quét QR, thông tin sẽ được lưu liên kết cứng với `SessionID` tương ứng.

## 3. Kết quả kỳ vọng cuối Tuần 1
- App chạy mượt mà trên nền tảng di động, không bị vỡ layout.
- Sinh viên có thể dễ dàng biết được quá trình xử lý ảnh và nhận phản hồi trực quan.
- Database lưu trữ các Session rõ ràng phục vụ cho các tuần kế tiếp.
