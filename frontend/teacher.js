let sessionDetailsCache = {};
// Kiểm tra quyền truy cập của Giảng viên khi tải trang
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');
const teacherName = localStorage.getItem('name');
const teacherId = localStorage.getItem('teacherId');

if (!token || role !== 'teacher') {
  localStorage.clear();
  window.location.href = '/login/teacher';
} else {
  document.getElementById('teacher-name').innerText = teacherName || 'Giảng viên';
}

// Biến lưu trữ lớp học phần hiện tại và danh sách các phiên
let currentClassId = '';
let classSessions = [];
let classStudents = [];
let activeSessionId = '';

// Tải danh sách lớp học phần khi tải trang
document.addEventListener('DOMContentLoaded', () => {
  fetchTeacherClasses();
});

// Xử lý đăng xuất
function handleLogout() {
  localStorage.clear();
  window.location.href = '/login/teacher';
}

// Lấy danh sách lớp dạy của GV
async function fetchTeacherClasses() {
  try {
    const res = await fetch(`${API_URL}/teacher/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    const classes = await res.json();

    const classSelect = document.getElementById('class-select');
    classSelect.innerHTML = `<option value="">-- Chọn lớp dạy --</option>`;

    classes.forEach(c => {
      classSelect.innerHTML += `<option value="${c.classId}">${c.classId} - ${c.subjectName}</option>`;
    });
  } catch (err) {
    console.error('Lỗi tải danh sách lớp giảng dạy.');
  }
}

// Xử lý thay đổi lớp học phần
function onClassChange() {
  const select = document.getElementById('class-select');
  currentClassId = select.value;

  const layout = document.getElementById('teacher-dashboard-layout');
  if (currentClassId) {
    layout.style.display = 'grid';
    
    // Xóa cache của lớp cũ
    classSessions = [];
    classStudents = [];
    sessionDetailsCache = {};
    
    // Reset session screen
    resetSessionUI();

    // Mặc định chọn tab "Tạo Điểm Danh"
    switchTab('session-create');
  } else {
    layout.style.display = 'none';
  }
}

// Reset UI tạo QR khi đổi lớp
function resetSessionUI() {
  activeSessionId = '';
  document.getElementById('session-setup-form').style.display = 'block';
  document.getElementById('session-qr-display').style.display = 'none';
  document.getElementById('qrcode').innerHTML = '';
  document.getElementById('session-label').value = '';
}

let currentTeacherTab = 'session-create';

// Chuyển đổi tab linh hoạt
function switchTab(tabName) {
  currentTeacherTab = tabName;
  // Cập nhật Active Sidebar Button
  const sidebarBtns = document.querySelectorAll('.sidebar-menu .sidebar-btn');
  sidebarBtns.forEach(btn => btn.classList.remove('active'));
  
  const activeBtn = Array.from(sidebarBtns).find(btn => btn.getAttribute('onclick').includes(tabName));
  if (activeBtn) activeBtn.classList.add('active');

  // Cập nhật Active Section panel
  const sections = document.querySelectorAll('.panel-section');
  sections.forEach(sec => sec.classList.remove('active'));
  
  const activeSec = document.getElementById(`tab-${tabName}`);
  if (activeSec) activeSec.classList.add('active');

  // Fetch dữ liệu dựa theo tab (CHỈ KHI CHƯA CÓ DATA)
  if (tabName === 'sessions-history' && classSessions.length === 0) fetchSessionsHistory();
  if (tabName === 'students-list' && classStudents.length === 0) fetchStudentsList();
}

// Nút làm mới thủ công
function refreshTeacherTab() {
  showToast('Đang làm mới dữ liệu...', 'success');
  if (currentTeacherTab === 'sessions-history') fetchSessionsHistory();
  if (currentTeacherTab === 'students-list') fetchStudentsList();
}


// ================= POPUP MODALS CONTROLLER =================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}


// ================= TAB 1: TẠO QR ĐIỂM DANH =================
async function createSession() {
  const label = document.getElementById('session-label').value.trim();
  
  try {
    const res = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ classId: currentClassId, label: label || 'Điểm danh buổi học' })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    activeSessionId = data.sessionId;

    // Hiển thị giao diện QR Code
    document.getElementById('session-setup-form').style.display = 'none';
    document.getElementById('session-qr-display').style.display = 'flex';
    document.getElementById('display-session-id').innerText = activeSessionId;
    document.getElementById('display-session-label').innerText = label || 'Điểm danh buổi học';

    // Lấy IP tĩnh của máy chủ qua API để điện thoại trong cùng mạng LAN có thể truy cập được
    let serverIp = 'localhost';
    try {
      const ipRes = await fetch(`${API_URL}/server-info`);
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        serverIp = ipData.ip;
      }
    } catch(e) {
      console.log('Không lấy được IP máy chủ, dùng localhost');
    }

    // Tạo QR Code trỏ trực tiếp đến URL student với tham số session sạch (Sử dụng IP thay vì localhost)
    let baseUrl = window.location.origin;
    if (baseUrl.includes('localhost')) {
      baseUrl = baseUrl.replace('localhost', serverIp);
    }
    const attendanceUrl = `${baseUrl}/student?session=${activeSessionId}`;
    
    const qrDiv = document.getElementById('qrcode');
    qrDiv.innerHTML = ''; // Clear cũ

    new QRCode(qrDiv, {
      text: attendanceUrl,
      width: 250,
      height: 250,
      colorDark: "#0b0f19",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    // Link text dành cho máy không quét được QR
    document.getElementById('qr-url-text').innerText = `Đường dẫn điểm danh: ${attendanceUrl}`;

  } catch (err) {
    showToast(err.message || 'Lỗi tạo phiên điểm danh!', 'error');
  }
}

// Đóng phiên điểm danh hiện tại
function closeCurrentSession() {
  if (confirm('Bạn có chắc muốn đóng phiên điểm danh này? Sinh viên sẽ không thể quét mã nữa.')) {
    resetSessionUI();
  }
}


// ================= TAB 2: LỊCH SỬ PHIÊN =================
async function fetchSessionsHistory() {
  try {
    const res = await fetch(`${API_URL}/sessions/${currentClassId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    classSessions = await res.json();

    const tbody = document.getElementById('sessions-table-body');
    tbody.innerHTML = '';

    if (classSessions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Chưa có phiên điểm danh nào được tạo.</td></tr>`;
      return;
    }

    classSessions.forEach(s => {
      const createdDate = new Date(s.createdAt);
      const displayDate = `${createdDate.toLocaleDateString('vi-VN')} ${createdDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

      tbody.innerHTML += `
        <tr>
          <td><strong>${s.sessionId}</strong></td>
          <td>${s.label || 'Không có nhãn'}</td>
          <td>${displayDate}</td>
          <td><span class="badge badge-success" id="count-${s.sessionId}">Đang tải...</span></td>
          <td>
            <button class="btn-small btn-small-primary" onclick="viewSessionDetails('${s.sessionId}')">
              <i class="fa-solid fa-eye"></i> Xem chi tiết
            </button>
          </td>
        </tr>
      `;

      // Fetch số lượng SV đã điểm danh cho từng session
      fetchSessionCount(s.sessionId);
    });

  } catch (err) {
    console.error('Lỗi tải lịch sử phiên.');
  }
}

// Lấy số lượng SV đã điểm danh của 1 session
async function fetchSessionCount(sessId) {
  try {
    const res = await fetch(`${API_URL}/statistics/${sessId}`);
    const data = await res.json();
    const badge = document.getElementById(`count-${sessId}`);
    if (badge) {
      badge.innerText = `${data.count} Sinh viên`;
    }
  } catch (e) {}
}

// Xem chi tiết phiên đã điểm danh (Bảng danh sách SV đã chụp ảnh)
async function viewSessionDetails(sessId, forceRefresh = false) {
  document.getElementById('detail-session-id').innerText = sessId;
  const tbody = document.getElementById('attendance-detail-table-body');
  openModal('modal-session-detail');

  // Load from cache if not forcing refresh
  if (sessionDetailsCache[sessId] && !forceRefresh) {
    renderSessionDetails(sessionDetailsCache[sessId]);
    if (!forceRefresh) showToast('Tải từ bộ nhớ đệm (Nhấn Làm mới nếu cần)', 'warning');
    return;
  }

  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</td></tr>';

  try {
    const res = await fetch(`${API_URL}/statistics/${sessId}`);
    const data = await res.json();
    
    sessionDetailsCache[sessId] = data; // save to cache
    renderSessionDetails(data);
    if (forceRefresh) showToast('Đã làm mới dữ liệu phiên!', 'success');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger)">Lỗi tải dữ liệu chi tiết!</td></tr>';
  }
}

function renderSessionDetails(data) {
  const tbody = document.getElementById('attendance-detail-table-body');
  tbody.innerHTML = '';
  
  if (!data || !data.list || data.list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Chưa có sinh viên nào điểm danh phiên này.</td></tr>';
    return;
  }

  data.list.forEach(item => {
    const attTime = new Date(item.timestamp).toLocaleTimeString('vi-VN');
    const imgHtml = item.image 
      ? `<img src="${item.image}" class="attendance-selfie" onclick="viewLargeImage('${item.image}')" title="Click để xem ảnh lớn">`
      : `<span style="color: var(--text-secondary); font-size:12px;">Không có</span>`;
    
    const typeHtml = item.isManual
      ? `<span class="badge badge-danger" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;"><i class="fa-solid fa-user-pen"></i> Thủ công</span>`
      : `<span class="badge badge-success"><i class="fa-solid fa-qrcode"></i> Quét QR</span>`;

    tbody.innerHTML += `
      <tr>
        <td>${imgHtml}</td>
        <td><strong>${item.studentId}</strong></td>
        <td>${item.name}</td>
        <td>${attTime}</td>
        <td>${typeHtml}</td>
      </tr>
    `;
  });
}

// Xem ảnh selfie cỡ lớn
function viewLargeImage(imageSrc) {
  document.getElementById('modal-large-image').src = imageSrc;
  openModal('modal-image-view');
}


// ================= TAB 3: DANH SÁCH LỚP & ĐIỂM DANH THỦ CÔNG =================
async function fetchStudentsList() {
  try {
    const res = await fetch(`${API_URL}/teacher/classes/${currentClassId}/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    classStudents = await res.json();

    const tbody = document.getElementById('students-table-body');
    tbody.innerHTML = '';

    if (classStudents.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Lớp học phần này chưa gán sinh viên nào.</td></tr>`;
      return;
    }

    classStudents.forEach(s => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${s.studentId}</strong></td>
          <td>${s.name}</td>
          <td>${s.homeClass || '-'}</td>
          <td>
            <button class="btn-small btn-small-primary" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2);" onclick="openManualAttendanceModal('${s.studentId}')">
              <i class="fa-solid fa-user-pen"></i> Điểm danh thủ công
            </button>
          </td>
        </tr>
      `;
    });

  } catch (err) {
    console.error('Lỗi tải danh sách lớp.');
  }
}

// Mở popup chọn buổi học để điểm danh thủ công cho sinh viên
async function openManualAttendanceModal(studentId) {
  document.getElementById('manual-student-id').value = studentId;

  const select = document.getElementById('manual-session-select');
  select.innerHTML = `<option value="">-- Chọn buổi học --</option>`;

  // Đảm bảo có lịch sử phiên
  const res = await fetch(`${API_URL}/sessions/${currentClassId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  classSessions = await res.json();

  if (classSessions.length === 0) {
    showToast('Lớp học phần này chưa từng tạo phiên điểm danh nào! Vui lòng tạo phiên trước.', 'success');
    return;
  }

  classSessions.forEach(s => {
    const createdDate = new Date(s.createdAt);
    const displayDate = `${createdDate.toLocaleDateString('vi-VN')} ${createdDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    select.innerHTML += `<option value="${s.sessionId}">${s.sessionId} - ${s.label || 'Không tên'} (${displayDate})</option>`;
  });

  openModal('modal-select-session-manual');
}

// Submit điểm danh thủ công lên server
async function submitManualAttendance(e) {
  e.preventDefault();
  const studentId = document.getElementById('manual-student-id').value;
  const sessionId = document.getElementById('manual-session-select').value;

  if (!sessionId) {
    showToast('Vui lòng chọn phiên để điểm danh!', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/attendance/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ studentId, sessionId, classId: currentClassId })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Điểm danh thủ công thành công!', 'success');
    closeModal('modal-select-session-manual');
    
    // Load lại lịch sử phiên hoặc danh sách nếu cần
    fetchSessionsHistory();

  } catch (err) {
    showToast(err.message || 'Lỗi điểm danh thủ công!', 'error');
  }
}

// Toast Notification System
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  let icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-circle-xmark';
  if (type === 'warning') icon = 'fa-triangle-exclamation';
  
  toast.innerHTML = `<i class="fa-solid ${icon}" style="color: var(--${type})"></i> <span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
