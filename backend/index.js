const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/qr_attendance', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Student = mongoose.model('Student', {
  studentId: String,
  name: String,
  class: String
});

const Attendance = mongoose.model('Attendance', {
  studentId: String,
  sessionId: String,
  timestamp: Date
});

// API: Điểm danh
app.post('/api/attendance', async (req, res) => {
  const { studentId, sessionId } = req.body;
  // Kiểm tra trùng lặp
  const exists = await Attendance.findOne({ studentId, sessionId });
  if (exists) return res.status(409).json({ message: 'Đã điểm danh!' });
  const attendance = new Attendance({ studentId, sessionId, timestamp: new Date() });
  await attendance.save();
  res.json({ message: 'Điểm danh thành công!' });
});

// API: Thống kê
app.get('/api/statistics/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const count = await Attendance.countDocuments({ sessionId });
  res.json({ sessionId, count });
});

// API: Xác thực sinh viên
app.post('/api/auth', async (req, res) => {
  const { studentId } = req.body;
  const student = await Student.findOne({ studentId });
  if (!student) return res.status(404).json({ message: 'Không tìm thấy sinh viên!' });
  res.json({ student });
});

app.listen(3000, () => {
  console.log('Backend running on port 3000');
});
