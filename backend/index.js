const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const JWT_SECRET = 'qrattend_secret_key_2026';

app.use(cors());
// Tăng giới hạn dung lượng để nhận ảnh Base64 từ điện thoại (10MB)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Cho phép phục vụ static files của frontend
app.use(express.static(path.join(__dirname, '../frontend'), { index: false }));

// Cấu hình không đợi hàng đợi Mongoose khi mất mạng
mongoose.set('bufferCommands', false);

// Kết nối Cloud MongoDB Atlas
const MONGO_URI = "mongodb+srv://truonggiangcvp_db_user:4GaD9RYSCJZQo3VP@cluster0.mrbnlwa.mongodb.net/qr_attendance?retryWrites=true&w=majority&appName=Cluster0";

let isMongoConnected = false;
let lastMongoError = null;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 4000
}).then(async () => {
  console.log('✅ Connected to Cloud MongoDB Atlas!');
  isMongoConnected = true;
  lastMongoError = null;
  await seedMongoDb();
}).catch(err => {
  console.log('❌ Cloud MongoDB Connection Error:', err.message);
  console.log('⚠️ Tự động chuyển sang chế độ dự phòng: Sử dụng cơ sở dữ liệu tệp cục bộ (local_db.json)');
  isMongoConnected = false;
  lastMongoError = err.message;
});

// ================= MONGOOSE MODELS =================
const StudentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: String,
  homeClass: String
});
const Student = mongoose.model('Student', StudentSchema);

const TeacherSchema = new mongoose.Schema({
  teacherId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});
const Teacher = mongoose.model('Teacher', TeacherSchema);

const SubjectSchema = new mongoose.Schema({
  subjectCode: { type: String, unique: true, required: true },
  subjectName: { type: String, required: true }
});
const Subject = mongoose.model('Subject', SubjectSchema);

const ClassSchema = new mongoose.Schema({
  classId: { type: String, unique: true, required: true },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  teacherId: { type: String, required: true },
  studentIds: [String]
});
const Class = mongoose.model('Class', ClassSchema);

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true, required: true },
  classId: { type: String, required: true, index: true },
  teacherId: { type: String, required: true },
  label: String,
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});
const Session = mongoose.model('Session', SessionSchema);

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  sessionId: { type: String, required: true, index: true },
  classId: { type: String, required: true, index: true },
  image: String, // Base64 image
  timestamp: { type: Date, default: Date.now },
  isManual: { type: Boolean, default: false }
});
const Attendance = mongoose.model('Attendance', AttendanceSchema);


// ================= LOCAL JSON DB FALLBACK =================
const dbFilePath = path.join(__dirname, 'local_db.json');

function initLocalDb() {
  if (!fs.existsSync(dbFilePath)) {
    const initialData = {
      students: [
        { studentId: "20235317", name: "Lê Trường Giang", email: "giang@gmail.com", homeClass: "CNTT-01" },
        { studentId: "20230001", name: "Nguyễn Văn A", email: "a@gmail.com", homeClass: "CNTT-01" },
        { studentId: "20230002", name: "Trần Thị B", email: "b@gmail.com", homeClass: "CNTT-02" }
      ],
      teachers: [
        { teacherId: "GV01", name: "Nguyễn Văn Thầy", username: "teacher1", password: "123" }
      ],
      subjects: [
        { subjectCode: "CS101", subjectName: "Lập trình C cơ bản" },
        { subjectCode: "CS301", subjectName: "Lập trình Web" }
      ],
      classes: [
        { classId: "CS301_L01", subjectCode: "CS301", subjectName: "Lập trình Web", teacherId: "GV01", studentIds: ["20235317", "20230001"] }
      ],
      sessions: [],
      attendances: []
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2), 'utf8');
  }
}
initLocalDb();

function readLocalDb() {
  try {
    const data = fs.readFileSync(dbFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { students: [], teachers: [], subjects: [], classes: [], sessions: [], attendances: [] };
  }
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Lỗi ghi file local_db.json:', err);
  }
}

async function seedMongoDb() {
  try {
    const db = readLocalDb();

    // 1. Seed Students
    const studentCount = await Student.countDocuments();
    if (studentCount === 0 && db.students && db.students.length > 0) {
      console.log('🌱 MongoDB Atlas: Seeding students...');
      await Student.insertMany(db.students);
    }

    // 2. Seed Teachers
    const teacherCount = await Teacher.countDocuments();
    if (teacherCount === 0 && db.teachers && db.teachers.length > 0) {
      console.log('🌱 MongoDB Atlas: Seeding teachers...');
      await Teacher.insertMany(db.teachers);
    }

    // 3. Seed Subjects
    const subjectCount = await Subject.countDocuments();
    if (subjectCount === 0 && db.subjects && db.subjects.length > 0) {
      console.log('🌱 MongoDB Atlas: Seeding subjects...');
      await Subject.insertMany(db.subjects);
    }

    // 4. Seed Classes
    const classCount = await Class.countDocuments();
    if (classCount === 0 && db.classes && db.classes.length > 0) {
      console.log('🌱 MongoDB Atlas: Seeding classes...');
      await Class.insertMany(db.classes);
    }

    console.log('🌱 MongoDB Atlas seeding check complete.');
  } catch (err) {
    console.error('❌ Error seeding MongoDB Atlas:', err.message);
  }
}

// ================= VERCEL SERVERLESS OPTIMIZATION =================
// Đảm bảo MongoDB luôn kết nối trước khi xử lý API, ngăn lỗi ghi file local_db.json trên Serverless (Read-only filesystem)
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(MONGO_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000
        });
        isMongoConnected = true;
        lastMongoError = null;
      } catch (e) {
        isMongoConnected = false;
        lastMongoError = e.message;
      }
    } else if (mongoose.connection.readyState === 2) {
      await new Promise((resolve) => {
        if (mongoose.connection.readyState !== 2) return resolve();
        const onConnected = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); resolve(); };
        const cleanup = () => {
          mongoose.connection.removeListener('connected', onConnected);
          mongoose.connection.removeListener('error', onError);
        };
        mongoose.connection.once('connected', onConnected);
        mongoose.connection.once('error', onError);
        setTimeout(() => { cleanup(); resolve(); }, 4000);
      });
      isMongoConnected = (mongoose.connection.readyState === 1);
    } else if (mongoose.connection.readyState === 1) {
      isMongoConnected = true;
    } else {
      isMongoConnected = false;
    }
  }
  next();
});

// ================= AUTH MIDDLEWARE =================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token không tồn tại!' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
    req.user = user;
    next();
  });
}


// ================= SYSTEM INFO ROUTES =================
const os = require('os');
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Bỏ qua các loopback và các interface ảo của VMWare/VirtualBox (nếu có thể lọc)
      if (iface.family === 'IPv4' && !iface.internal && !name.toLowerCase().includes('vmware') && !name.toLowerCase().includes('virtual')) {
        return iface.address;
      }
    }
  }
  // Nếu không tìm thấy, thử lại mà không lọc vmware/virtual
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

app.get('/api/server-info', (req, res) => {
  res.json({ ip: getLocalIpAddress(), port: 3000 });
});

app.get('/api/debug-db', (req, res) => {
  res.json({
    readyState: mongoose.connection.readyState,
    readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
    isMongoConnected,
    lastMongoError
  });
});

// ================= AUTH ROUTES =================
app.post('/api/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (role === 'admin') {
      if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, name: 'Quản trị viên', role: 'admin' });
      }
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu admin sai!' });
    }

    if (role === 'teacher') {
      let teacher = null;
      if (isMongoConnected) {
        try {
          teacher = await Teacher.findOne({ username, password }).maxTimeMS(3000);
        } catch (err) {
          console.log('MongoDB error, fallback to local', err.message);
        }
      }
      if (!teacher) {
        const db = readLocalDb();
        if (db && Array.isArray(db.teachers)) {
          teacher = db.teachers.find(t => t.username === username && t.password === password);
        }
      }

      if (teacher) {
        const token = jwt.sign({ teacherId: teacher.teacherId, name: teacher.name, role: 'teacher' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, name: teacher.name, role: 'teacher', teacherId: teacher.teacherId });
      }
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu giảng viên sai!' });
    }

    return res.status(400).json({ message: 'Vai trò đăng nhập không hợp lệ!' });
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    return res.status(500).json({ message: 'Lỗi hệ thống: ' + err.message });
  }
});


// ================= ADMIN API ROUTES =================
// 1. Quản lý Sinh viên
app.get('/api/admin/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  if (isMongoConnected) {
    try {
      const list = await Student.find({});
      return res.json(list);
    } catch (e) {}
  }
  const db = readLocalDb();
  res.json(db.students);
});

app.post('/api/admin/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  const { studentId, name, email, homeClass } = req.body;
  if (!studentId || !name) return res.status(400).json({ message: 'Thiếu thông tin bắt buộc!' });

  if (isMongoConnected) {
    try {
      const exists = await Student.findOne({ studentId });
      if (exists) return res.status(409).json({ message: 'Mã sinh viên đã tồn tại!' });
      const student = new Student({ studentId, name, email, homeClass });
      await student.save();
      return res.json({ message: 'Thêm sinh viên thành công!' });
    } catch (e) {}
  }

  const db = readLocalDb();
  if (db.students.some(s => s.studentId === studentId)) {
    return res.status(409).json({ message: 'Mã sinh viên đã tồn tại!' });
  }
  db.students.push({ studentId, name, email, homeClass });
  writeLocalDb(db);
  res.json({ message: 'Thêm sinh viên thành công (LocalDB)!' });
});

app.delete('/api/admin/students/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  const studentId = req.params.id;

  if (isMongoConnected) {
    try {
      await Student.deleteOne({ studentId });
      return res.json({ message: 'Xóa sinh viên thành công!' });
    } catch (e) {}
  }

  const db = readLocalDb();
  db.students = db.students.filter(s => s.studentId !== studentId);
  writeLocalDb(db);
  res.json({ message: 'Xóa sinh viên thành công (LocalDB)!' });
});

app.put('/api/admin/students/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  const studentId = req.params.id;
  const { name, email, homeClass } = req.body;
  if (!name) return res.status(400).json({ message: 'Tên sinh viên là bắt buộc!' });

  if (isMongoConnected) {
    try {
      const studentObj = await Student.findOne({ studentId });
      if (!studentObj) return res.status(404).json({ message: 'Không tìm thấy sinh viên!' });
      studentObj.name = name;
      studentObj.email = email;
      studentObj.homeClass = homeClass;
      await studentObj.save();
      return res.json({ message: 'Cập nhật thông tin sinh viên thành công!' });
    } catch (e) {
      return res.status(500).json({ message: 'Lỗi cập nhật MongoDB: ' + e.message });
    }
  }

  const db = readLocalDb();
  const index = db.students.findIndex(s => s.studentId === studentId);
  if (index === -1) return res.status(404).json({ message: 'Không tìm thấy sinh viên!' });
  db.students[index].name = name;
  db.students[index].email = email;
  db.students[index].homeClass = homeClass;
  writeLocalDb(db);
  res.json({ message: 'Cập nhật thông tin sinh viên thành công (LocalDB)!' });
});

// 2. Quản lý Giảng viên
app.get('/api/admin/teachers', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  if (isMongoConnected) {
    try {
      const list = await Teacher.find({});
      return res.json(list);
    } catch (e) {}
  }
  const db = readLocalDb();
  res.json(db.teachers);
});

app.post('/api/admin/teachers', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  const { teacherId, name, username, password } = req.body;
  if (!teacherId || !name || !username || !password) return res.status(400).json({ message: 'Thiếu thông tin bắt buộc!' });

  if (isMongoConnected) {
    try {
      const exists = await Teacher.findOne({ $or: [{ teacherId }, { username }] });
      if (exists) return res.status(409).json({ message: 'Mã GV hoặc Tên đăng nhập đã tồn tại!' });
      const teacher = new Teacher({ teacherId, name, username, password });
      await teacher.save();
      return res.json({ message: 'Thêm giảng viên thành công!' });
    } catch (e) {}
  }

  const db = readLocalDb();
  if (db.teachers.some(t => t.teacherId === teacherId || t.username === username)) {
    return res.status(409).json({ message: 'Mã GV hoặc Tên đăng nhập đã tồn tại!' });
  }
  db.teachers.push({ teacherId, name, username, password });
  writeLocalDb(db);
  res.json({ message: 'Thêm giảng viên thành công (LocalDB)!' });
});

app.delete('/api/admin/teachers/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  const teacherId = req.params.id;

  if (isMongoConnected) {
    try {
      await Teacher.deleteOne({ teacherId });
      return res.json({ message: 'Xóa giảng viên thành công!' });
    } catch (e) {}
  }

  const db = readLocalDb();
  db.teachers = db.teachers.filter(t => t.teacherId !== teacherId);
  writeLocalDb(db);
  res.json({ message: 'Xóa giảng viên thành công (LocalDB)!' });
});

// 3. Quản lý Môn học (Học phần)
app.get('/api/admin/subjects', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  if (isMongoConnected) {
    try {
      const list = await Subject.find({});
      return res.json(list);
    } catch (e) {}
  }
  const db = readLocalDb();
  res.json(db.subjects);
});

app.post('/api/admin/subjects', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  const { subjectCode, subjectName } = req.body;
  if (!subjectCode || !subjectName) return res.status(400).json({ message: 'Thiếu thông tin bắt buộc!' });

  if (isMongoConnected) {
    try {
      const exists = await Subject.findOne({ subjectCode });
      if (exists) return res.status(409).json({ message: 'Mã học phần đã tồn tại!' });
      const subj = new Subject({ subjectCode, subjectName });
      await subj.save();
      return res.json({ message: 'Thêm học phần thành công!' });
    } catch (e) {}
  }

  const db = readLocalDb();
  if (db.subjects.some(s => s.subjectCode === subjectCode)) {
    return res.status(409).json({ message: 'Mã học phần đã tồn tại!' });
  }
  db.subjects.push({ subjectCode, subjectName });
  writeLocalDb(db);
  res.json({ message: 'Thêm học phần thành công (LocalDB)!' });
});

// Cập nhật Học phần (Môn học)
app.put('/api/admin/subjects/:code', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  const subjectCode = req.params.code;
  const { subjectName } = req.body;
  
  if (isMongoConnected) {
    try {
      const subj = await Subject.findOne({ subjectCode });
      if (!subj) return res.status(404).json({ message: 'Không tìm thấy học phần!' });
      subj.subjectName = subjectName;
      await subj.save();
      return res.json({ message: 'Cập nhật học phần thành công!' });
    } catch (e) {
      return res.status(500).json({ message: 'Lỗi cập nhật MongoDB: ' + e.message });
    }
  }

  const db = readLocalDb();
  const index = db.subjects.findIndex(s => s.subjectCode === subjectCode);
  if (index === -1) return res.status(404).json({ message: 'Không tìm thấy học phần!' });
  db.subjects[index].subjectName = subjectName;
  writeLocalDb(db);
  res.json({ message: 'Cập nhật học phần thành công (LocalDB)!' });
});

// Xóa Học phần
app.delete('/api/admin/subjects/:code', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  const subjectCode = req.params.code;

  if (isMongoConnected) {
    try {
      await Subject.deleteOne({ subjectCode });
      return res.json({ message: 'Xóa học phần thành công!' });
    } catch (e) {
      return res.status(500).json({ message: 'Lỗi xóa MongoDB: ' + e.message });
    }
  }

  const db = readLocalDb();
  db.subjects = db.subjects.filter(s => s.subjectCode !== subjectCode);
  writeLocalDb(db);
  res.json({ message: 'Xóa học phần thành công (LocalDB)!' });
});

// 4. Quản lý Lớp học phần
app.get('/api/admin/classes', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  if (isMongoConnected) {
    try {
      const list = await Class.find({});
      return res.json(list);
    } catch (e) {}
  }
  const db = readLocalDb();
  res.json(db.classes);
});

app.post('/api/admin/classes', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  const { classId, subjectCode, teacherId } = req.body;
  if (!classId || !subjectCode || !teacherId) return res.status(400).json({ message: 'Thiếu thông tin bắt buộc!' });

  // Kiểm tra giảng viên tồn tại
  let teacherExists = false;
  if (isMongoConnected) {
    try {
      const teacherObj = await Teacher.findOne({ teacherId });
      if (teacherObj) teacherExists = true;
    } catch (e) {}
  } else {
    const db = readLocalDb();
    teacherExists = db.teachers.some(t => t.teacherId === teacherId);
  }

  if (!teacherExists) {
    return res.status(404).json({ message: `Mã giảng viên "${teacherId}" không tồn tại trong hệ thống!` });
  }

  // Lấy tên môn học
  let subjectName = "";
  if (isMongoConnected) {
    try {
      const subj = await Subject.findOne({ subjectCode });
      if (subj) subjectName = subj.subjectName;
    } catch (e) {}
  } else {
    const db = readLocalDb();
    const subj = db.subjects.find(s => s.subjectCode === subjectCode);
    if (subj) subjectName = subj.subjectName;
  }

  if (isMongoConnected) {
    try {
      const exists = await Class.findOne({ classId });
      if (exists) return res.status(409).json({ message: 'Mã lớp đã tồn tại!' });
      const newClass = new Class({ classId, subjectCode, subjectName, teacherId, studentIds: [] });
      await newClass.save();
      return res.json({ message: 'Tạo lớp học phần thành công!' });
    } catch (e) {}
  }

  const db = readLocalDb();
  if (db.classes.some(c => c.classId === classId)) {
    return res.status(409).json({ message: 'Mã lớp đã tồn tại!' });
  }
  db.classes.push({ classId, subjectCode, subjectName, teacherId, studentIds: [] });
  writeLocalDb(db);
  res.json({ message: 'Tạo lớp học phần thành công (LocalDB)!' });
});

app.delete('/api/admin/classes/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  const classId = req.params.id;

  if (isMongoConnected) {
    try {
      await Class.deleteOne({ classId });
      return res.json({ message: 'Xóa lớp thành công!' });
    } catch (e) {}
  }

  const db = readLocalDb();
  db.classes = db.classes.filter(c => c.classId !== classId);
  writeLocalDb(db);
  res.json({ message: 'Xóa lớp thành công (LocalDB)!' });
});

// Thêm sinh viên vào lớp học phần
app.post('/api/admin/classes/:id/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  const classId = req.params.id;
  const { studentId } = req.body;

  if (isMongoConnected) {
    try {
      const c = await Class.findOne({ classId });
      if (!c) return res.status(404).json({ message: 'Lớp không tồn tại!' });
      if (c.studentIds.includes(studentId)) return res.status(409).json({ message: 'Sinh viên đã có trong lớp!' });
      c.studentIds.push(studentId);
      await c.save();
      return res.json({ message: 'Thêm sinh viên vào lớp thành công!' });
    } catch (e) {}
  }

  const db = readLocalDb();
  const c = db.classes.find(cls => cls.classId === classId);
  if (!c) return res.status(404).json({ message: 'Lớp không tồn tại!' });
  if (c.studentIds.includes(studentId)) return res.status(409).json({ message: 'Sinh viên đã có trong lớp!' });
  c.studentIds.push(studentId);
  writeLocalDb(db);
  res.json({ message: 'Thêm sinh viên vào lớp thành công (LocalDB)!' });
});

// Xem danh sách sinh viên của lớp học phần (Admin)
app.get('/api/admin/classes/:classId/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  const { classId } = req.params;

  let studentIds = [];
  if (isMongoConnected) {
    try {
      const cls = await Class.findOne({ classId });
      if (cls) studentIds = cls.studentIds;
    } catch (e) {}
  } else {
    const db = readLocalDb();
    const cls = db.classes.find(c => c.classId === classId);
    if (cls) studentIds = cls.studentIds;
  }

  // Lấy chi tiết thông tin sinh viên
  let studentsList = [];
  if (isMongoConnected) {
    try {
      studentsList = await Student.find({ studentId: { $in: studentIds } });
      return res.json(studentsList);
    } catch (e) {}
  }

  const db = readLocalDb();
  studentsList = db.students.filter(s => studentIds.includes(s.studentId));
  res.json(studentsList);
});

// Xóa sinh viên khỏi lớp học phần (Admin)
app.delete('/api/admin/classes/:id/students/:studentId', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền truy cập!' });
  const classId = req.params.id;
  const studentId = req.params.studentId;

  if (isMongoConnected) {
    try {
      const c = await Class.findOne({ classId });
      if (!c) return res.status(404).json({ message: 'Lớp không tồn tại!' });
      c.studentIds = c.studentIds.filter(id => id !== studentId);
      await c.save();
      return res.json({ message: 'Xóa sinh viên khỏi lớp thành công!' });
    } catch (e) {
      return res.status(500).json({ message: 'Lỗi cập nhật MongoDB: ' + e.message });
    }
  }

  const db = readLocalDb();
  const c = db.classes.find(cls => cls.classId === classId);
  if (!c) return res.status(404).json({ message: 'Lớp không tồn tại!' });
  c.studentIds = c.studentIds.filter(id => id !== studentId);
  writeLocalDb(db);
  res.json({ message: 'Xóa sinh viên khỏi lớp thành công (LocalDB)!' });
});


// ================= TEACHER API ROUTES =================
// Lấy danh sách lớp giảng dạy của GV
app.get('/api/teacher/classes', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Chỉ dành cho Giảng viên!' });
  const { teacherId } = req.user;

  if (isMongoConnected) {
    try {
      const list = await Class.find({ teacherId });
      return res.json(list);
    } catch (e) {}
  }
  const db = readLocalDb();
  const list = db.classes.filter(c => c.teacherId === teacherId);
  res.json(list);
});

// Xem danh sách sinh viên của lớp
app.get('/api/teacher/classes/:classId/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Chỉ dành cho Giảng viên!' });
  const { classId } = req.params;

  let studentIds = [];
  if (isMongoConnected) {
    try {
      const cls = await Class.findOne({ classId });
      if (cls) studentIds = cls.studentIds;
    } catch (e) {}
  } else {
    const db = readLocalDb();
    const cls = db.classes.find(c => c.classId === classId);
    if (cls) studentIds = cls.studentIds;
  }

  // Lấy chi tiết thông tin sinh viên
  let studentsList = [];
  if (isMongoConnected) {
    try {
      studentsList = await Student.find({ studentId: { $in: studentIds } });
      return res.json(studentsList);
    } catch (e) {}
  }

  const db = readLocalDb();
  studentsList = db.students.filter(s => studentIds.includes(s.studentId));
  res.json(studentsList);
});

// Tạo phiên điểm danh
app.post('/api/sessions', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Chỉ giảng viên mới được tạo phiên!' });
  const { classId, label } = req.body;
  const { teacherId } = req.user;
  const sessionId = 'SESS_' + Math.floor(100000 + Math.random() * 900000); // Mã ngẫu nhiên 6 chữ số

  if (isMongoConnected) {
    try {
      const sess = new Session({ sessionId, classId, teacherId, label, isActive: true });
      await sess.save();
      return res.json({ message: 'Tạo phiên điểm danh thành công!', sessionId });
    } catch (e) {}
  }

  const db = readLocalDb();
  db.sessions.push({ sessionId, classId, teacherId, label, createdAt: new Date().toISOString(), isActive: true });
  writeLocalDb(db);
  res.json({ message: 'Tạo phiên điểm danh thành công (LocalDB)!', sessionId });
});

// Lấy lịch sử phiên của một lớp
app.get('/api/sessions/:classId', authenticateToken, async (req, res) => {
  const { classId } = req.params;

  if (isMongoConnected) {
    try {
      const list = await Session.find({ classId }).sort({ createdAt: -1 });
      return res.json(list);
    } catch (e) {}
  }
  const db = readLocalDb();
  const list = db.sessions.filter(s => s.classId === classId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

// Lấy toàn bộ danh sách điểm danh của một lớp học phần (phục vụ bảng tổng hợp - loại trừ ảnh selfie)
app.get('/api/attendance/class/:classId', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Chỉ dành cho Giảng viên!' });
  const { classId } = req.params;

  if (isMongoConnected) {
    try {
      const list = await Attendance.find({ classId }).select('-image').sort({ timestamp: 1 });
      return res.json(list);
    } catch (e) {
      return res.status(500).json({ message: 'Lỗi tải dữ liệu điểm danh: ' + e.message });
    }
  }
  const db = readLocalDb();
  const list = db.attendances.filter(a => a.classId === classId).map(({ image, ...rest }) => rest);
  res.json(list);
});

// Lấy đầy đủ dữ liệu cho Bảng tổng hợp ma trận điểm danh (gộp 3 request trong 1, không có ảnh selfie)
app.get('/api/teacher/classes/:classId/attendance-matrix', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Chỉ dành cho Giảng viên!' });
  const { classId } = req.params;

  let studentIds = [];
  let students = [];
  let sessions = [];
  let attendances = [];

  if (isMongoConnected) {
    try {
      // 1. Tìm lớp để lấy studentIds
      const cls = await Class.findOne({ classId });
      if (cls) studentIds = cls.studentIds;

      // 2. Chạy đồng thời 3 truy vấn tối ưu hóa trên server
      const [studentsData, sessionsData, attendancesData] = await Promise.all([
        Student.find({ studentId: { $in: studentIds } }),
        Session.find({ classId }).sort({ createdAt: 1 }),
        Attendance.find({ classId }).select('-image').sort({ timestamp: 1 })
      ]);

      students = studentsData;
      sessions = sessionsData;
      attendances = attendancesData;

      return res.json({ students, sessions, attendances });
    } catch (e) {
      return res.status(500).json({ message: 'Lỗi tải dữ liệu ma trận: ' + e.message });
    }
  }

  // Fallback LocalDB
  try {
    const db = readLocalDb();
    const cls = db.classes.find(c => c.classId === classId);
    if (cls) studentIds = cls.studentIds;

    students = db.students.filter(s => studentIds.includes(s.studentId));
    sessions = db.sessions.filter(s => s.classId === classId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    attendances = db.attendances
      .filter(a => a.classId === classId)
      .map(({ image, ...rest }) => rest);

    res.json({ students, sessions, attendances });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi tải dữ liệu ma trận LocalDB: ' + e.message });
  }
});

// Điểm danh thủ công
app.post('/api/attendance/manual', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Chỉ giảng viên được phép điểm danh thủ công!' });
  const { studentId, sessionId, classId } = req.body;

  // Lấy tên sinh viên
  let studentName = "";
  if (isMongoConnected) {
    try {
      const s = await Student.findOne({ studentId });
      if (s) studentName = s.name;
    } catch (e) {}
  } else {
    const db = readLocalDb();
    const s = db.students.find(x => x.studentId === studentId);
    if (s) studentName = s.name;
  }

  if (isMongoConnected) {
    try {
      const exists = await Attendance.findOne({ studentId, sessionId });
      if (exists) return res.status(409).json({ message: 'Sinh viên này đã được điểm danh buổi này rồi!' });

      const att = new Attendance({
        studentId,
        name: studentName,
        sessionId,
        classId,
        image: '', // Không cần ảnh khi điểm danh thủ công
        isManual: true,
        timestamp: new Date()
      });
      await att.save();
      return res.json({ message: 'Điểm danh thủ công thành công!' });
    } catch (e) {}
  }

  const db = readLocalDb();
  const exists = db.attendances.find(a => a.studentId === studentId && a.sessionId === sessionId);
  if (exists) return res.status(409).json({ message: 'Sinh viên này đã được điểm danh buổi này rồi!' });

  db.attendances.push({
    studentId,
    name: studentName,
    sessionId,
    classId,
    image: '',
    timestamp: new Date().toISOString(),
    isManual: true
  });
  writeLocalDb(db);
  res.json({ message: 'Điểm danh thủ công thành công (LocalDB)!' });
});


// ================= STUDENT API ROUTES =================
// Sinh viên đăng nhập để xem Portal
app.post('/api/student/login', async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ message: 'Vui lòng cung cấp MSSV!' });

  let student = null;
  if (isMongoConnected) {
    try {
      student = await Student.findOne({ studentId });
    } catch (e) {}
  } else {
    const db = readLocalDb();
    student = db.students.find(s => s.studentId === studentId);
  }

  if (!student) return res.status(404).json({ message: 'Không tìm thấy sinh viên với MSSV này!' });

  const token = jwt.sign({ studentId: student.studentId, name: student.name, role: 'student' }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, studentId: student.studentId, name: student.name });
});

// Xem các lớp học phần sinh viên đang tham gia
app.get('/api/student/classes', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Yêu cầu quyền Sinh viên!' });
  const { studentId } = req.user;

  if (isMongoConnected) {
    try {
      const classes = await Class.find({ studentIds: studentId });
      return res.json(classes);
    } catch (e) {}
  }

  const db = readLocalDb();
  const classes = db.classes.filter(c => c.studentIds.includes(studentId));
  res.json(classes);
});

// Xem lịch sử điểm danh của bản thân trong lớp học phần
app.get('/api/student/classes/:classId/sessions', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Yêu cầu quyền Sinh viên!' });
  const { classId } = req.params;
  const { studentId } = req.user;

  // Lấy toàn bộ sessions của lớp
  let sessions = [];
  let attendances = [];

  if (isMongoConnected) {
    try {
      sessions = await Session.find({ classId }).sort({ createdAt: -1 });
      attendances = await Attendance.find({ classId, studentId });
    } catch (e) {}
  } else {
    const db = readLocalDb();
    sessions = db.sessions.filter(s => s.classId === classId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    attendances = db.attendances.filter(a => a.classId === classId && a.studentId === studentId);
  }

  // Map trạng thái điểm danh của sinh viên vào từng session
  const history = sessions.map(sess => {
    const att = attendances.find(a => a.sessionId === sess.sessionId);
    return {
      sessionId: sess.sessionId,
      label: sess.label,
      date: sess.createdAt,
      attended: !!att,
      isManual: att ? att.isManual : false,
      timestamp: att ? att.timestamp : null
    };
  });

  res.json(history);
});

// Lấy thông tin về session (tên lớp, tên môn học) phục vụ trang điểm danh sinh viên
app.get('/api/sessions/info/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  let session = null;

  if (isMongoConnected) {
    try {
      session = await Session.findOne({ sessionId });
    } catch (e) {}
  } else {
    const db = readLocalDb();
    session = db.sessions.find(s => s.sessionId === sessionId);
  }

  if (!session) return res.status(404).json({ message: 'Không tìm thấy phiên điểm danh!' });

  let classInfo = null;
  if (isMongoConnected) {
    try {
      classInfo = await Class.findOne({ classId: session.classId });
    } catch (e) {}
  } else {
    const db = readLocalDb();
    classInfo = db.classes.find(c => c.classId === session.classId);
  }

  res.json({
    sessionId: session.sessionId,
    label: session.label,
    classId: session.classId,
    subjectName: classInfo ? classInfo.subjectName : 'Không rõ học phần',
    subjectCode: classInfo ? classInfo.subjectCode : ''
  });
});

// Lấy DS sinh viên thuộc lớp học phần của session để hiển thị Dropdown cho SV chọn tên
app.get('/api/sessions/:sessionId/students', async (req, res) => {
  const { sessionId } = req.params;
  let session = null;

  if (isMongoConnected) {
    try {
      session = await Session.findOne({ sessionId });
    } catch (e) {}
  } else {
    const db = readLocalDb();
    session = db.sessions.find(s => s.sessionId === sessionId);
  }

  if (!session) return res.status(404).json({ message: 'Không tìm thấy phiên điểm danh!' });

  let studentIds = [];
  if (isMongoConnected) {
    try {
      const cls = await Class.findOne({ classId: session.classId });
      if (cls) studentIds = cls.studentIds;
    } catch (e) {}
  } else {
    const db = readLocalDb();
    const cls = db.classes.find(c => c.classId === session.classId);
    if (cls) studentIds = cls.studentIds;
  }

  // Query toàn bộ thông tin sinh viên từ danh sách ID
  let list = [];
  if (isMongoConnected) {
    try {
      list = await Student.find({ studentId: { $in: studentIds } }, 'studentId name homeClass');
      return res.json(list);
    } catch (e) {}
  }

  const db = readLocalDb();
  list = db.students
    .filter(s => studentIds.includes(s.studentId))
    .map(s => ({ studentId: s.studentId, name: s.name, homeClass: s.homeClass }));
  
  res.json(list);
});

// Sinh viên nộp điểm danh bằng ảnh selfie (Public, không yêu cầu Token)
app.post('/api/attendance', async (req, res) => {
  const { studentId, sessionId, image } = req.body;
  if (!studentId || !sessionId || !image) {
    return res.status(400).json({ message: 'Vui lòng điền đủ MSSV, chọn tên và chụp ảnh!' });
  }

  // Kiểm tra thông tin phiên và lớp
  let session = null;
  if (isMongoConnected) {
    try {
      session = await Session.findOne({ sessionId });
    } catch (e) {}
  } else {
    const db = readLocalDb();
    session = db.sessions.find(s => s.sessionId === sessionId);
  }

  if (!session) return res.status(404).json({ message: 'Phiên điểm danh không tồn tại hoặc đã bị đóng!' });

  // Kiểm tra tên sinh viên
  let student = null;
  if (isMongoConnected) {
    try {
      student = await Student.findOne({ studentId });
    } catch (e) {}
  } else {
    const db = readLocalDb();
    student = db.students.find(s => s.studentId === studentId);
  }

  if (!student) return res.status(404).json({ message: 'Mã số sinh viên không tồn tại trong hệ thống!' });

  // Lưu điểm danh
  if (isMongoConnected) {
    try {
      const exists = await Attendance.findOne({ studentId, sessionId });
      if (exists) return res.status(409).json({ message: 'Bạn đã điểm danh phiên này rồi!' });

      const att = new Attendance({
        studentId,
        name: student.name,
        sessionId,
        classId: session.classId,
        image,
        isManual: false,
        timestamp: new Date()
      });
      await att.save();
      return res.json({ message: 'Chúc mừng! Điểm danh thành công.' });
    } catch (err) {
      console.log('MongoDB attendance write error:', err.message);
    }
  }

  const db = readLocalDb();
  const exists = db.attendances.find(a => a.studentId === studentId && a.sessionId === sessionId);
  if (exists) return res.status(409).json({ message: 'Bạn đã điểm danh phiên này rồi!' });

  db.attendances.push({
    studentId,
    name: student.name,
    sessionId,
    classId: session.classId,
    image,
    timestamp: new Date().toISOString(),
    isManual: false
  });
  writeLocalDb(db);
  res.json({ message: 'Chúc mừng! Điểm danh thành công (Chế độ dự phòng local_db.json).' });
});

// Lấy danh sách điểm danh theo phiên (Giảng viên)
app.get('/api/statistics/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  if (isMongoConnected) {
    try {
      const count = await Attendance.countDocuments({ sessionId });
      const list = await Attendance.find({ sessionId }).sort({ timestamp: -1 });
      return res.json({ sessionId, count, list });
    } catch (err) {}
  }

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


// === CLEAN URL ROUTING ===
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Trang chọn cổng đăng nhập (Portal Selector)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// 3 trang đăng nhập riêng biệt
app.get('/login/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login_admin.html'));
});

app.get('/login/teacher', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login_teacher.html'));
});

app.get('/login/student', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login_student.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

app.get('/teacher', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/teacher.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/student.html'));
});

app.get('/student-portal', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/student_portal.html'));
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log('🚀 QRAttend Server is running on port 3000');
    console.log('🔑 Chọn cổng đăng nhập: http://localhost:3000/login');
    console.log('🛡️  Đăng nhập Admin: http://localhost:3000/login/admin');
    console.log('👨‍🏫 Đăng nhập Giảng viên: http://localhost:3000/login/teacher');
    console.log('👨‍🎓 Đăng nhập Sinh viên: http://localhost:3000/login/student');
    console.log('🎒 Cổng sinh viên: http://localhost:3000/student-portal');
  });
}

module.exports = app;
