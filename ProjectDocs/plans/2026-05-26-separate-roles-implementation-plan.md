# Tách biệt Trang Giáo Viên và Sinh Viên Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Loại bỏ trang trung gian chọn vai trò (`index.html`), phân tách hoàn toàn đường dẫn truy cập của Giáo viên (`/teacher`) và Sinh viên (`/student`), tự động chuyển hướng trang chủ `/` sang trang sinh viên `/student` để điểm danh nhanh chóng.

**Architecture:** Sử dụng cơ chế định tuyến (routing) của Express.js backend để trả về trực tiếp các file HTML tĩnh không đuôi `.html` và thực hiện redirect trang chủ. Cập nhật frontend để dùng đường dẫn sạch.

**Tech Stack:** Node.js, Express.js, JavaScript, HTML5

---

### Task 1: Backup và dọn dẹp file `frontend/index.html`

Mặc định, Express static middleware (`express.static`) sẽ ưu tiên trả về file `index.html` nếu nó tồn tại ở root của frontend khi người dùng truy cập `/`. Để định tuyến `/` hoạt động chính xác và thực hiện redirect sang `/student`, ta cần đổi tên file `index.html`.

**Files:**
- Modify: `d:\Project\qrattend\frontend\index.html` (Đổi tên / Di chuyển)

**Step 1: Thực hiện đổi tên file `index.html` thành `index.html.backup`**

Chúng ta sẽ chạy lệnh rename trên Windows:
`Rename-Item -Path "d:\Project\qrattend\frontend\index.html" -NewName "index.html.backup"`

**Step 2: Xác minh file đã được đổi tên**

Kiểm tra sự tồn tại của file `index.html.backup` và sự vắng mặt của `index.html` trong thư mục `frontend`.

---

### Task 2: Cấu hình định tuyến trực tiếp trên Backend

Cấu hình các routes mới trên Express server để định tuyến người dùng đến đúng trang HTML mà không cần sử dụng phần mở rộng `.html` trong URL.

**Files:**
- Modify: `d:\Project\qrattend\backend\index.js`

**Step 1: Bổ sung các routes định tuyến**

Thêm các route sau vào file `backend/index.js` (trước dòng `app.listen` ở cuối file):

```javascript
// Thêm các route định tuyến trực tiếp đến trang giáo viên và sinh viên
app.get('/teacher', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/teacher.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/student.html'));
});

// Chuyển hướng trang chủ sang trang sinh viên
app.get('/', (req, res) => {
  res.redirect('/student');
});
```

**Step 2: Xác minh cú pháp file `backend/index.js`**

Chạy lệnh kiểm tra cú pháp của Node.js:
`node --check d:\Project\qrattend\backend\index.js`
Expected: Không có lỗi cú pháp nào.

---

### Task 3: Cập nhật hàm tạo mã QR trên Frontend

Giáo viên tạo mã QR sẽ hướng sinh viên đến đường dẫn sạch `/student` thay vì `/student.html`.

**Files:**
- Modify: `d:\Project\qrattend\frontend\teacher.js:8`

**Step 1: Thay thế đường dẫn tạo mã QR**

Tìm dòng 8 trong `frontend/teacher.js`:
```javascript
const attendanceUrl = `${window.location.origin}/student.html?session=${encodeURIComponent(sessionId)}`;
```
Thay thế bằng:
```javascript
const attendanceUrl = `${window.location.origin}/student?session=${encodeURIComponent(sessionId)}`;
```

---

### Task 4: Chạy thử nghiệm và Xác minh hệ thống

Khởi chạy server backend và kiểm tra các đường dẫn định tuyến hoạt động chính xác.

**Step 1: Khởi chạy server**

Chạy lệnh: `node d:\Project\qrattend\backend\index.js`
Expected: Server chạy trên cổng 3000 và kết nối thành công tới MongoDB Atlas.

**Step 2: Thử nghiệm chuyển hướng trang chủ**

Truy cập `http://localhost:3000/` bằng công cụ kiểm tra hoặc trình duyệt.
Expected: Trình duyệt nhận phản hồi Redirect 302 và được đưa đến `http://localhost:3000/student`.

**Step 3: Thử nghiệm trang Giáo viên**

Truy cập `http://localhost:3000/teacher`.
Expected: Tải thành công giao diện Giáo viên. Thử tạo mã QR và kiểm tra liên kết được tạo ra có dạng `http://localhost:3000/student?session=...`.
