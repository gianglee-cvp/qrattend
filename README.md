# 🎓 Hệ Thống Điểm Danh QR Attendance (Mobile optimized)

Dự án điểm danh sinh viên bằng mã QR, hỗ trợ chụp ảnh selfie minh chứng và đồng bộ dữ liệu qua Cloud.

---

## 🛠️ Tính năng nổi bật
- **Quét trực tiếp**: Camera điện thoại quét mã QR là mở thẳng trang điểm danh.
- **Chống gian lận**: Yêu cầu chụp ảnh chân dung ngay tại chỗ rồi mới được xác thực.
- **Tiện lợi**: Tự động lưu và điền mã số sinh viên (MSSV) cho lần sau.
- **Cơ sở dữ liệu đám mây**: Sử dụng MongoDB Atlas, cho phép truy cập từ bất cứ đâu.

---

## 🏗️ Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Cấu hình Backend (API Server)
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```
3. Khởi chạy Server:
   ```bash
   node index.js
   ```
   *(Kiểm tra nếu thấy dòng "✅ Connected to Cloud MongoDB Atlas!" là thành công).*

### 2. Cấu hình Frontend (Giao diện)
1. **Lưu ý quan trọng**: Vì backend chạy trên máy tính, bạn phải lấy **địa chỉ IP** của máy (gõ `ipconfig` trong CMD). Ví dụ: `192.168.1.18`.
2. Mở file `frontend/main.js`, cập nhật dòng:
   ```javascript
   const CURRENT_IP = '192.168.1.18'; // Sửa số IP này thành IP máy tính bạn
   ```
3. Chạy Frontend bằng một công cụ nhe **Live Server** (trong VS Code) hoặc `http-server`.
4. Truy cập trên điện thoại qua địa chỉ: `http://192.168.1.18:5500/index.html`.

### 3. Cấu hình Cơ sở dữ liệu (MongoDB)
Hệ thống hiện đã cấu hình sẵn **MongoDB Atlas (Cloud)**. Dữ liệu sẽ được lưu trực tuyến. Nếu muốn xem dữ liệu, hãy sử dụng công cụ **MongoDB Compass**.

---

## 🔄 Quy trình sử dụng
1. **Giáo viên**: 
   - Truy cập web -> Chọn vai trò **Giáo viên**.
   - Nhập mã buổi học (ví dụ: `CNTT01`) -> Nhấn **Tạo mã QR**.
   - Chiếu mã QR lên màn hình cho sinh viên.
2. **Sinh viên**:
   - Dùng camera điện thoại quét mã QR -> Nhấn vào link hiện ra.
   - Tại trang web: **Chụp ảnh chân dung** -> Nhập **MSSV** -> Nhấn **Xác nhận**.

---

## 📦 Công nghệ sử dụng
- **Frontend**: HTML5, Vanilla JS, Bootstrap 5, QRCode.js, Html5-QRCode.
- **Backend**: Node.js, Express.js, Mongoose.
- **Database**: MongoDB Atlas (Cloud).