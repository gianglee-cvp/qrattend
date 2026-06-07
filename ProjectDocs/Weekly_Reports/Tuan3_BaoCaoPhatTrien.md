# Báo Cáo Định Hướng Phát Triển - Tuần 3
**Dự án:** Hệ Thống Điểm Danh QR Attendance
**Mục tiêu Tuần 3:** Hoàn thiện Dashboard Quản Lý, Xuất Dữ Liệu và Triển Khai (Deployment).

## 1. Tình trạng hiện tại (Sau Tuần 2)
Hệ thống đã có khả năng chống gian lận cực cao. Dữ liệu điểm danh của sinh viên được thu thập và lưu trữ đầy đủ trong MongoDB. Hiện tại cần một công cụ thống kê trực quan cho giáo viên, quản lý và triển khai hệ thống cho sinh viên dùng thực tế.

## 2. Các công việc cần thực hiện trong Tuần 3

### 2.1. Admin & Teacher Dashboard
- Xây dựng giao diện Dashboard cho giáo viên với các tính năng:
  - Xem danh sách tổng hợp sinh viên đi học theo từng Session.
  - Xem ảnh Selfie của các trường hợp nghi ngờ (cờ báo hiệu có thể do gian lận).
  - Thống kê tỷ lệ chuyên cần (Chart.js / Recharts).

### 2.2. Tính năng Export / Import Dữ liệu
- Tích hợp thư viện để xuất danh sách điểm danh dưới dạng **Excel (.xlsx)** hoặc **CSV** phục vụ việc cập nhật vào hệ thống điểm danh chung của trường.
- Hỗ trợ giáo viên upload danh sách lớp (Excel/CSV) để chuẩn hóa MSSV.

### 2.3. Triển khai Hệ thống (Deployment)
- Chuyển cấu hình `IP Local` bằng biến môi trường (Environment Variables).
- Triển khai **Backend** lên nền tảng như **Render** hoặc **Railway**.
- Triển khai **Frontend** lên **Vercel** hoặc **Netlify**.
- Cấu hình HTTPS, sửa đổi chính sách CORS trong Express để cho phép Frontend Server gọi API một cách bảo mật.

## 3. Kết quả kỳ vọng cuối Tuần 3
- Hệ thống sẵn sàng với môi trường Production, có thể sử dụng ngay mà không cần chạy server cục bộ.
- Giáo viên có công cụ toàn diện để thống kê, rà soát và đánh giá quá trình tham gia lớp học của sinh viên một cách trực quan, đầy đủ.
