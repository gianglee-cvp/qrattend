# QRAttend - Code Map

## Cấu trúc thư mục

```
/
├── backend/          # Chứa logic Node.js/Express và kết nối MongoDB Atlas
│   ├── index.js      # Main server entry (Tích hợp hệ thống dự phòng Local JSON DB + Clean URL Routing)
│   ├── local_db.json # CSDL dạng JSON cục bộ (dành cho chế độ chạy offline / mất kết nối cloud)
│   └── package.json
├── frontend/         # Chứa giao diện người dùng (Vanilla HTML/CSS/JS)
│   ├── index.html    # [DEPRECATED] Trang chọn vai trò cũ - không còn được sử dụng
│   ├── login.html    # Trang chọn cổng đăng nhập (Portal Selector — /login)
│   ├── login_admin.html  # Trang đăng nhập riêng cho Admin (/login/admin)
│   ├── login_admin.js    # Logic xác thực Admin, lưu JWT và redirect /admin
│   ├── login_teacher.html # Trang đăng nhập riêng cho Giảng Viên (/login/teacher)
│   ├── login_teacher.js  # Logic xác thực GV, lưu JWT+teacherId và redirect /teacher
│   ├── login_student.html # Trang đăng nhập riêng cho Sinh Viên (/login/student)
│   ├── login_student.js  # Logic xác thực SV bằng MSSV, redirect /student-portal
│   ├── admin.html    # Cổng quản trị Admin, quản lý SV, GV, Học phần và Lớp học (qua /admin)
│   ├── admin.js      # Logic Admin Dashboard, gọi API quản trị và nạp các modal popup
│   ├── teacher.html  # Trang tạo mã QR, điểm danh thủ công, xem lịch sử của Giáo viên (qua /teacher)
│   ├── teacher.js    # Logic Giảng viên, chọn lớp, tạo phiên điểm danh, manual attendance
│   ├── student.html  # Trang chụp ảnh selfie, chọn tên autocomplete & điểm danh (qua /student)
│   ├── student.js    # Logic Điểm danh, tự động nạp session info, gợi ý tìm kiếm tên
│   ├── student_portal.html # Cổng sinh viên, xem các lớp tham gia & lịch sử điểm danh (qua /student-portal)
│   ├── student_portal.js   # Logic Student Portal, tải lớp học phần và kết quả điểm danh cá nhân
│   ├── config.js     # Chứa cấu hình đường dẫn API (/api)
│   └── style.css     # Style giao diện (Premium Glassmorphism Dark Mode)
├── database/         # Thư mục liên quan CSDL
│   └── qr_attendance_schema.md # Tài liệu thiết kế Schema cơ sở dữ liệu
├── ProjectDocs/      # Thư mục chứa tài liệu AI quản lý (Đồng bộ qua AI)
│   ├── Weekly_Reports/ # Các báo cáo theo tuần
│   ├── progress.md   # Theo dõi tiến độ phát triển
│   ├── claw.md       # Nguyên tắc dự án
│   └── CODEMAP.md    # Sơ đồ mã nguồn
└── README.md         # Hướng dẫn cài đặt & khởi chạy dự án
```

## Sơ đồ URL Routing (Clean URLs)

| URL Path          | Mô tả                                               |
|-------------------|------------------------------------------------------|
| `/`               | Tự động redirect → `/login`                          |
| `/login`          | Serve `login.html` — Trang chọn cổng đăng nhập       |
| `/login/admin`    | Serve `login_admin.html` — Đăng nhập Quản trị viên   |
| `/login/teacher`  | Serve `login_teacher.html` — Đăng nhập Giảng viên    |
| `/login/student`  | Serve `login_student.html` — Đăng nhập Sinh viên     |
| `/admin`          | Serve `admin.html` — Dashboard Quản trị viên         |
| `/teacher`        | Serve `teacher.html` — Dashboard Giáo viên           |
| `/student`        | Serve `student.html` — Trang điểm danh Sinh viên     |
| `/student-portal` | Serve `student_portal.html` — Portal Sinh viên       |
| `/api/debug-db`   | Endpoint gỡ lỗi trạng thái cơ sở dữ liệu (Mongoose readyState) |
| `/api/*`          | Các API endpoint (attendance, statistics, auth)       |

