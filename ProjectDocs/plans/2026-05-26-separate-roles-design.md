# Tài liệu Thiết Kế: Tách biệt Trang Giáo Viên và Sinh Viên
**Ngày tạo**: 2026-05-26
**Mục tiêu**: Loại bỏ trang trung gian chọn vai trò (`index.html`), phân tách hoàn toàn đường dẫn truy cập của Giáo viên và Sinh viên thông qua cơ chế định tuyến (routing) của Express backend.

---

## 1. Thiết Kế Định Tuyến (Routing)
Backend Express sẽ xử lý các yêu cầu HTTP GET cho các đường dẫn sạch như sau:

* **`/teacher`**: Phục vụ file `frontend/teacher.html` cho giáo viên.
* **`/student`**: Phục vụ file `frontend/student.html` cho sinh viên.
* **`/` (Trang chủ)**: Tự động chuyển hướng (Redirect 302) sang đường dẫn `/student` của sinh viên để tối ưu hóa trải nghiệm điểm danh nhanh.

## 2. Thay Đổi Mã Nguồn

### A. Backend (`backend/index.js`)
Thêm các route định nghĩa bằng Express:
```javascript
app.get('/teacher', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/teacher.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/student.html'));
});

app.get('/', (req, res) => {
  res.redirect('/student');
});
```

### B. Frontend JavaScript (`frontend/teacher.js`)
Cập nhật URL điểm danh tạo ra từ mã QR:
* Thay thế link cũ (`/student.html?session=...`) bằng link sạch (`/student?session=...`).

### C. Dọn dẹp
* Xóa file `frontend/index.html` hoặc đổi tên thành `frontend/index.html.backup` để tránh xung đột với route `/` của backend do Express phục vụ thư mục tĩnh `frontend` (mặc định Express static sẽ phục vụ `index.html` nếu nó tồn tại). **Lưu ý cực kỳ quan trọng**: Chúng ta phải xóa hoặc đổi tên file `index.html` trong thư mục `frontend` để Express static không tự động trả về nó khi truy cập `/`.

---

## 3. Kế Hoạch Xác Minh (Verification)
1. Khởi chạy backend.
2. Kiểm tra truy cập `http://localhost:3000/teacher` -> Phải tải đúng giao diện Giáo viên.
3. Kiểm tra truy cập `http://localhost:3000/student` -> Phải tải đúng giao diện Sinh viên.
4. Kiểm tra truy cập `http://localhost:3000/` -> Phải tự động chuyển hướng về `/student`.
5. Tạo mã QR trên giao diện giáo viên, kiểm tra xem link QR sinh ra có đúng định dạng `/student?session=...` hay không.
