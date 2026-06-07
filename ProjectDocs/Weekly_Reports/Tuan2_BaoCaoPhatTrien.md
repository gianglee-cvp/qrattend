# Báo Cáo Định Hướng Phát Triển - Tuần 2
**Dự án:** Hệ Thống Điểm Danh QR Attendance
**Mục tiêu Tuần 2:** Nâng cấp Bảo mật và Chống Gian Lận (Anti-cheating Features), Đảm bảo tính minh bạch.

## 1. Tình trạng hiện tại (Sau Tuần 1)
Hệ thống đã hoạt động ổn định trên các nền tảng và đã xử lý xong các lỗi cơ bản. Tuy nhiên, rủi ro về việc sinh viên chia sẻ mã QR qua mạng xã hội (Facebook, Zalo) cho bạn bè ở nhà tự điểm danh vẫn còn tồn tại.

## 2. Các công việc cần thực hiện trong Tuần 2

### 2.1. Dynamic QR Code (QR Động)
- Thay đổi logic hiển thị QR cùa giáo viên: Mã QR sẽ không tĩnh mà tự động làm mới (refresh) sau mỗi 5 - 10 giây.
- Back-end sẽ xác thực tính hợp lệ của mã Token đi kèm mã QR, nếu sinh viên quét mã cũ bị chụp ảnh lại, hệ thống sẽ từ chối.

### 2.2. Kiểm tra Vị trí Địa lý (Geolocation)
- Khi sinh viên điểm danh, hệ thống yêu cầu quyền truy cập Vị trí (GPS).
- Xây dựng logic Backend để tính toán khoảng cách (khoảng cách Haversine) giữa vị trí định vị của Giáo Viên/Thiết bị phòng học và tọa độ GPS của người quét.
- Nếu khoảng cách vượt ngưỡng cho phép (Ví dụ: > 50 mét), đánh dấu điểm danh bị nghi ngờ gian lận hoặc từ chối ngay lập tức.

### 2.3. Tích hợp AI cơ bản để kiểm tra khuôn mặt (Liveness/Face Detection)
- Nghiên cứu áp dụng thư viện `face-api.js` ngay trên giao diện sinh viên.
- Đảm bảo bức hình tải lên có chứa khuôn mặt người thật (tránh chụp màn hình hoặc background trống).

## 3. Kết quả kỳ vọng cuối Tuần 2
- Ngăn chặn hoàn toàn tình trạng điểm danh hộ nhờ chụp màn hình mã QR.
- Tăng độ tin cậy của dữ liệu với xác thực nhiều lớp: Device + Location + Selfie.
