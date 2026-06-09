# Hoàn thành tạo Báo cáo Phát triển 3 Tuần

## Tiến độ gần nhất
- Đã phân tích trạng thái từ file `README.md` của dự án QRAttend.
- Đã tạo ra 3 bản báo cáo định hướng lộ trình phát triển cho 3 tuần sắp tới:
  - **Tuần 1:** Nâng cấp UI/UX, xử lý upload ảnh, quản lý session.
  - **Tuần 2:** Các tính năng chống gian lận (Dynamic QR, Geolocation, Face Liveness).
  - **Tuần 3:** Dashboard giáo viên, xuất Excel, Deploy Vercel/Render.
- **Tính năng mới cập nhật:** 
  - Cập nhật Schema MongoDB thêm trường `name`.
  - Frontend: Sinh viên nhập thêm `Họ và tên` khi điểm danh.
  - Frontend: Dashboard giáo viên hiện thị danh sách điểm danh chi tiết (Tên + MSSV + Ảnh chân dung).
  - Frontend: Thêm tính năng nhập tay Mã buổi học (Session ID) cho sinh viên như một giải pháp thay thế khi trình duyệt không hỗ trợ quét QR (do bị chặn trên kết nối HTTP không phải localhost).
  - **Backend (Tối ưu kết nối & DB Fallback):** Thêm cơ chế tự động phát hiện lỗi kết nối Cloud MongoDB Atlas (do giới hạn IP Whitelist/Mất mạng). Tự động chuyển đổi sang chế độ lưu trữ file cục bộ (`local_db.json`) giúp ứng dụng hoạt động không bị gián đoạn, kèm theo dữ liệu mẫu (MSSV: `20235317` - Lê Trường Giang) để dễ dàng thử nghiệm điểm danh ngay lập tức.

## Trạng thái các thư mục ProjectDocs
- `Weekly_Reports/Tuan1_BaoCaoPhatTrien.md`
- `Weekly_Reports/Tuan2_BaoCaoPhatTrien.md`
- `Weekly_Reports/Tuan3_BaoCaoPhatTrien.md`

## Cập nhật mới nhất (26/05/2026)
- **Clean URL Routing — Phân tách trang Giáo viên / Sinh viên:**
  - Thêm Express route `/teacher` → serve `teacher.html`, `/student` → serve `student.html`.
  - Trang chủ `/` tự động redirect sang `/student` (ưu tiên sinh viên truy cập nhanh).
  - Xóa bỏ vai trò của `index.html` (trang chọn vai trò trung gian) — đánh dấu DEPRECATED.
  - Cập nhật `teacher.js`: QR code sinh ra URL sạch `/student?session=...` thay vì `/student.html?session=...`.
  - Xóa nút "Quay lại trang chủ" trên cả `teacher.html` và `student.html`.
  - Static file serving thêm `{ index: false }` để tránh auto-serve `index.html`.

## Cập nhật mới nhất (28/05/2026)
- **Nâng Cấp Giao Diện Premium (Glassmorphism & HSL Colors):**
  - Viết lại toàn bộ `style.css` với phong cách Dark Mode cao cấp, tích hợp Google Fonts `Plus Jakarta Sans`, các hiệu ứng kính mờ (glassmorphism), viền mỏng sáng và bóng đổ tinh tế, mượt mà trên mọi thiết bị di động và máy tính.
- **Tạo trang Đăng Nhập Chung (`login.html` & `login.js`):**
  - Giao diện đăng nhập hiện đại hỗ trợ Tabs vai trò: Sinh Viên (Đăng nhập nhanh bằng MSSV), Giảng Viên và Quản Trị Viên (Đăng nhập bằng tài khoản và mật khẩu).
  - Tích hợp JWT Token lưu vào localStorage sau khi xác thực thành công.
- **Tạo Cổng Quản Trị Admin (`admin.html` & `admin.js`):**
  - Hỗ trợ sidebar menu 4 tab quản lý: Sinh Viên, Giảng Viên, Học Phần và Lớp Học Phần.
  - Sử dụng modal popup tinh tế để thêm mới dữ liệu. Hỗ trợ gán sinh viên vào Lớp học phần trực quan thông qua dropdown sinh viên tự động.
- **Nâng Cấp Dashboard Giáo Viên (`teacher.html` & `teacher.js`):**
  - Hỗ trợ chọn Lớp học phần giảng dạy trực tiếp từ dropdown lấy từ server.
  - Cho phép tạo phiên điểm danh mới. Cập nhật mã QR thông minh: tự động lấy địa chỉ IP LAN tĩnh của máy chủ (ví dụ `192.168.x.x`) thay vì `localhost`, giúp điện thoại sinh viên trong cùng mạng Wi-Fi quét và truy cập trực tiếp thành công.
  - Xem danh sách Lớp học phần và thực hiện **Điểm danh thủ công** (Manual Attendance) cho sinh viên lỗi camera.
  - Xem Lịch sử phiên điểm danh của lớp và xem danh sách sinh viên đã điểm danh chi tiết kèm ảnh chân dung chụp từ điện thoại, click để phóng to.
- **Nâng Cấp Trang Điểm Danh Sinh Viên (`student.html` & `student.js`):**
  - Tự động lấy thông tin lớp/buổi học từ link QR và chèn vào UI lớp học.
  - Thêm chức năng **Tìm kiếm tên/MSSV tự động (Autocomplete)**: sinh viên chỉ cần gõ ký tự để lọc và chọn tên, loại bỏ việc nhập thủ công họ tên dễ sai sót.
  - Chụp ảnh selfie trực tiếp từ camera của điện thoại và nộp lên hệ thống.
- **Tạo Cổng Thông Tin Sinh Viên (`student_portal.html` & `student_portal.js`):**
  - Sinh viên truy cập bằng cách nhập MSSV (qua trang login).
  - Hiển thị danh sách các lớp học phần sinh viên đang tham gia. Nhấp chọn lớp để xem chi tiết lịch sử điểm danh của chính mình trong lớp đó (Ngày, buổi, trạng thái Vắng/Có mặt, hình thức quét QR/Thủ công).

## Cập nhật mới nhất (07/06/2026)
- **Tách Trang Đăng Nhập Riêng Biệt (3 Cổng Độc Lập):**
  - Xóa bỏ trang `login.html` dùng chung với tab chuyển đổi vai trò.
  - Tạo trang **Portal Selector** mới tại `/login` — hiển thị 3 card đẹp (Admin / Giảng Viên / Sinh Viên) để người dùng chọn cổng phù hợp.
  - Tạo 3 trang đăng nhập riêng:
    - `/login/admin` → `login_admin.html` + `login_admin.js` (gradient đỏ/cam, icon shield)
    - `/login/teacher` → `login_teacher.html` + `login_teacher.js` (gradient indigo/tím)
    - `/login/student` → `login_student.html` + `login_student.js` (gradient xanh lá/xanh dương, chỉ cần MSSV)
  - Mỗi trang dashboard (Admin/Teacher/Student Portal) khi token hết hạn hoặc đăng xuất sẽ redirect về đúng cổng đăng nhập tương ứng thay vì trang chung.
  - URL gốc `/` giờ redirect về `/login` (Portal Selector) thay vì `/student`.
- **Quản lý dữ liệu Admin nâng cao (Cập nhật Real DB):**
  - **Xác thực Giảng Viên khi thêm lớp:** Thay đổi ô chọn Giảng viên trong modal tạo lớp học phần thành trường nhập văn bản (Mã Giảng Viên). Backend kiểm tra thực tế xem `teacherId` đã tồn tại trong database (MongoDB hoặc file JSON cục bộ) chưa trước khi tạo lớp mới. Nếu không có, trả về lỗi.
  - **Thêm/Sửa/Xóa Sinh Viên:**
    - Thiết kế modal popup **Sửa Thông Tin Sinh Viên** để cập nhật Họ tên, Email, Lớp sinh hoạt của sinh viên dựa trên MSSV (MSSV bị khóa không cho chỉnh sửa).
    - Thêm nút **Sửa** (Warning - Amber) kế bên nút Xóa trong bảng danh sách sinh viên.
    - Viết API `PUT /api/admin/students/:id` ở backend để xử lý cập nhật thông tin thật vào database (MongoDB hoặc JSON local).
    - Đồng bộ giao diện danh sách sinh viên ngay sau khi thêm, sửa hoặc xóa thành công.
  - **Quản lý Học Phần (Subjects):**
    - Bổ sung nút **Sửa** và **Xóa** vào bảng danh sách Học phần.
    - Cập nhật backend với các API `PUT /api/admin/subjects/:code` và `DELETE /api/admin/subjects/:code`.
    - Thiết kế popup modal 8 (**Sửa Thông Tin Học Phần**) khóa mã môn học và cho phép đổi tên môn.
    - Đồng bộ dữ liệu môn học khi chỉnh sửa để tránh lỗi bất đồng bộ.
  - **Quản lý Sinh Viên trong Lớp Học Phần:**
    - Thay thế nút "Thêm SV" bằng nút **Chi tiết / SV** trực quan trong bảng lớp học phần.
    - Thiết kế **Modal Chi Tiết Lớp Học Phần** hiển thị toàn bộ danh sách sinh viên đang học lớp đó.
    - Cho phép chọn sinh viên chưa tham gia lớp từ dropdown để **Thêm vào lớp** (qua API `POST /api/admin/classes/:id/students`).
    - Cho phép **Xóa khỏi lớp** để hủy gán sinh viên khỏi lớp học phần đó (qua API `DELETE /api/admin/classes/:id/students/:studentId`).
    - Mọi thay đổi về số lượng sinh viên trong lớp học phần đều được đồng bộ thời gian thực lên bảng giao diện chính.
  - **Tự động đồng bộ dữ liệu cục bộ lên MongoDB Atlas (Data Seeding):**
    - Thiết lập hàm `seedMongoDb()` tự động chạy khi kết nối thành công với MongoDB Atlas lần đầu.
    - Hàm sẽ tự động đồng bộ (seeding) toàn bộ dữ liệu mẫu (Sinh viên, Giảng viên, Học phần, Lớp học phần) từ file cục bộ `local_db.json` lên đám mây MongoDB Atlas nếu các Collection trong MongoDB trống, giúp hệ thống sẵn sàng hoạt động ngay lập tức với dữ liệu thực mà không cần nhập thủ công.
  - **Tối ưu hóa kết nối MongoDB trên Vercel Serverless (Khắc phục Cold Start & Treo Fallback):**
    - Sửa đổi Middleware ở backend để tự động phát hiện trạng thái đang kết nối (`readyState === 2`). Middleware sử dụng cơ chế Promise chờ tối đa 4 giây để Mongoose hoàn tất kết nối trước khi cho phép request tiếp tục. Điều này giải quyết triệt để vấn đề đăng nhập chậm / lỗi đăng nhập ở lần đầu truy cập (Cold Start) và ngăn chặn việc các request song song bị đẩy về database cục bộ khi DB Cloud thực tế vẫn hoạt động.
    - Loại bỏ cơ chế `Promise.race` 2 giây quá ngắn ở API đăng nhập để tránh việc ngắt kết nối hợp lệ trong thời gian khởi động Serverless.
    - Thêm endpoint gỡ lỗi đặc biệt `/api/debug-db` hiển thị chi tiết trạng thái readyState của Mongoose và thông báo lỗi kết nối MongoDB Atlas mới nhất để phục vụ công tác giám sát trên môi trường production.
    - Bọc toàn bộ logic endpoint `/api/login` trong khối `try/catch` để tránh treo API khi xảy ra lỗi ngoài ý muốn ở backend, đồng thời giới hạn thời gian truy vấn MongoDB tối đa 3 giây bằng `.maxTimeMS(3000)` và kiểm tra cấu trúc mảng `local_db.json` trước khi truy cập nhằm đảm bảo client luôn nhận được phản hồi và nút đăng nhập được khôi phục trạng thái nhập lại khi thông tin sai.

## Cập nhật mới nhất (09/06/2026)
- **Nâng Cấp Xem Chi Tiết Phiên Điểm Danh Của Giảng Viên:**
  - Sửa đổi giao diện bảng chi tiết phiên điểm danh (`modal-session-detail`) trong `teacher.html` để hiển thị tất cả thành viên trong lớp học phần, thay vì chỉ hiện sinh viên đã điểm danh.
  - Bổ sung cột **Trạng thái** hiển thị rõ ràng "Có mặt" (xanh lá) hoặc "Vắng" (đỏ).
  - Bổ sung cột **Hành động** cho phép giáo viên click trực tiếp vào nút **Điểm danh** để điểm danh thủ công ngay lập tức cho sinh viên đang vắng tại phiên đó mà không cần phải chuyển sang tab khác.
  - Cập nhật logic trong `teacher.js` để gọi song song API thống kê phiên (`GET /api/statistics/:sessionId`) và danh sách sinh viên của lớp (`GET /api/teacher/classes/:classId/students`), sau đó map dữ liệu để hiển thị chính xác.
  - Tích hợp gọi API `/api/attendance/manual` trực tiếp khi click điểm danh thủ công trong popup modal chi tiết phiên và tự động reload dữ liệu chi tiết của phiên đó cùng bảng lịch sử để cập nhật số lượng.



