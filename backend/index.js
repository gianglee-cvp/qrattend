const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const path = require('path');

app.use(cors());
// Tăng giới hạn dung lượng để nhận ảnh Base64 từ điện thoại (10MB)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Cho phép server chạy luôn thư mục frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Cấu hình không đợi hàng đợi Mongoose khi mất mạng
mongoose.set('bufferCommands', false);

// Kết nối Cloud MongoDB Atlas (Thay thế cho 127.0.0.1)
const MONGO_URI = "mongodb+srv://truonggiangcvp_db_user:4GaD9RYSCJZQo3VP@cluster0.mrbnlwa.mongodb.net/qr_attendance?retryWrites=true&w=majority&appName=Cluster0";

let isMongoConnected = false;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 4000 // Tách nhanh sau 4s nếu không kết nối được
}).then(() => {
  console.log('✅ Connected to Cloud MongoDB Atlas!');
  isMongoConnected = true;
}).catch(err => {
  console.log('❌ Cloud MongoDB Connection Error:', err.message);
  console.log('⚠️ Cảnh báo: Không thể kết nối tới Cloud MongoDB (có thể do IP của bạn chưa được whitelist).');
  console.log('🔄 Tự động chuyển sang chế độ dự phòng: Sử dụng cơ sở dữ liệu tệp cục bộ (local_db.json) để chạy thử nghiệm mượt mà!');
  isMongoConnected = false;
});

const Student = mongoose.model('Student', {
  studentId: String,
  name: String,
  class: String
});

const Attendance = mongoose.model('Attendance', {
  studentId: String,
  name: String,
  sessionId: String,
  image: String, // Lưu ảnh dạng Base64
  timestamp: Date
});

// CƠ SỞ DỮ LIỆU DỰ PHÒNG (LOCAL JSON DATABASE)
const fs = require('fs');
const dbFilePath = path.join(__dirname, 'local_db.json');

// Khởi tạo file CSDL dự phòng nếu chưa có
if (!fs.existsSync(dbFilePath)) {
  const initialData = {
    students: [
      { studentId: "20235317", name: "Lê Trường Giang", class: "CNTT-01" },
      { studentId: "20230001", name: "Nguyễn Văn A", class: "CNTT-01" },
      { studentId: "20230002", name: "Trần Thị B", class: "CNTT-02" }
    ],
    attendances: []
  };
  fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2), 'utf8');
}

function readLocalDb() {
  try {
    const data = fs.readFileSync(dbFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { students: [], attendances: [] };
  }
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Lỗi ghi file local_db.json:', err);
  }
}

// API: Điểm danh
app.post('/api/attendance', async (req, res) => {
  const { studentId, name, sessionId, image } = req.body;

  if (isMongoConnected) {
    try {
      const exists = await Attendance.findOne({ studentId, sessionId });
      if (exists) return res.status(409).json({ message: 'Đã điểm danh buổi này!' });
      const attendance = new Attendance({ studentId, name, sessionId, image, timestamp: new Date() });
      await attendance.save();
      return res.json({ message: 'Điểm danh thành công!' });
    } catch (err) {
      console.log('⚠️ MongoDB Error, falling back to local database:', err.message);
    }
  }

  // Chế độ dự phòng (Local File DB)
  const db = readLocalDb();
  const exists = db.attendances.find(a => a.studentId === studentId && a.sessionId === sessionId);
  if (exists) return res.status(409).json({ message: 'Đã điểm danh buổi này!' });

  const newAttendance = {
    studentId,
    name,
    sessionId,
    image,
    timestamp: new Date().toISOString()
  };
  db.attendances.push(newAttendance);
  writeLocalDb(db);
  res.json({ message: 'Điểm danh thành công! (Chế độ dự phòng local_db.json)' });
});

// API: Thống kê
app.get('/api/statistics/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  if (isMongoConnected) {
    try {
      const count = await Attendance.countDocuments({ sessionId });
      const list = await Attendance.find({ sessionId }).sort({ timestamp: -1 });
      return res.json({ sessionId, count, list });
    } catch (err) {
      console.log('⚠️ MongoDB Error, falling back to local database:', err.message);
    }
  }

  // Chế độ dự phòng (Local File DB)
  const db = readLocalDb();
  const list = db.attendances
    .filter(a => a.sessionId === sessionId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  res.json({
    sessionId,
    count: list.length,
    list
  });
});

// API: Xác thực sinh viên
app.post('/api/auth', async (req, res) => {
  const { studentId } = req.body;

  if (isMongoConnected) {
    try {
      const student = await Student.findOne({ studentId });
      if (student) return res.json({ student });
    } catch (err) {
      console.log('⚠️ MongoDB Error, falling back to local database:', err.message);
    }
  }

  // Chế độ dự phòng (Local File DB)
  const db = readLocalDb();
  const student = db.students.find(s => s.studentId === studentId);
  if (!student) return res.status(404).json({ message: 'Không tìm thấy sinh viên!' });
  res.json({ student });
});

app.listen(3000, () => {
  console.log('Backend running on port 3000');
});
