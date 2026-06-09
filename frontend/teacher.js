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
  const btn = document.getElementById('btn-start-session');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo phiên...`;
  }

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
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-plus-circle"></i> Bắt đầu phiên điểm danh`;
    }
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

// Xem chi tiết phiên đã điểm danh (Bảng danh sách tất cả thành viên trong lớp)
async function viewSessionDetails(sessId, forceRefresh = false) {
  document.getElementById('detail-session-id').innerText = sessId;
  const tbody = document.getElementById('attendance-detail-table-body');
  openModal('modal-session-detail');

  // Load from cache if not forcing refresh
  if (sessionDetailsCache[sessId] && !forceRefresh) {
    const cached = sessionDetailsCache[sessId];
    renderSessionDetailsNew(sessId, cached.students, cached.attendances);
    if (!forceRefresh) showToast('Tải từ bộ nhớ đệm (Nhấn Làm mới nếu cần)', 'warning');
    return;
  }

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</td></tr>';

  try {
    // 1. Fetch attendance records for this session
    const statsRes = await fetch(`${API_URL}/statistics/${sessId}`);
    const statsData = await statsRes.json();
    
    // 2. Fetch all students in the class
    const studentsRes = await fetch(`${API_URL}/teacher/classes/${currentClassId}/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!studentsRes.ok) throw new Error("Không thể tải danh sách sinh viên lớp.");
    const students = await studentsRes.json();

    sessionDetailsCache[sessId] = { students, attendances: statsData.list }; // save to cache
    
    renderSessionDetailsNew(sessId, students, statsData.list);
    if (forceRefresh) showToast('Đã làm mới dữ liệu phiên!', 'success');
  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger)">Lỗi tải dữ liệu chi tiết!</td></tr>';
  }
}

function renderSessionDetailsNew(sessId, allStudents, attendances) {
  const tbody = document.getElementById('attendance-detail-table-body');
  tbody.innerHTML = '';
  
  if (!allStudents || allStudents.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Lớp học phần này không có sinh viên nào.</td></tr>';
    return;
  }

  allStudents.forEach(student => {
    // Find if this student has checked in in this session
    const att = attendances.find(a => a.studentId === student.studentId);
    
    let statusHtml = '';
    let timeHtml = '-';
    let typeHtml = '-';
    let imgHtml = `<span style="color: var(--text-secondary); font-size:12px;">Không có</span>`;
    let actionHtml = '';

    if (att) {
      statusHtml = `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Có mặt</span>`;
      timeHtml = new Date(att.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      typeHtml = att.isManual
        ? `<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; font-size: 11px;"><i class="fa-solid fa-user-pen"></i> Thủ công</span>`
        : `<span class="badge badge-success" style="font-size: 11px;"><i class="fa-solid fa-qrcode"></i> Quét QR</span>`;
      
      imgHtml = att.image 
        ? `<img src="${att.image}" class="attendance-selfie" onclick="viewLargeImage('${att.image}')" title="Click để xem ảnh lớn">`
        : `<span style="color: var(--text-secondary); font-size:12px;">Không có</span>`;
        
      actionHtml = `<span style="color: var(--success); font-size: 13px; font-weight: 600;"><i class="fa-solid fa-check"></i> Hợp lệ</span>`;
    } else {
      statusHtml = `<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Vắng</span>`;
      actionHtml = `
        <button class="btn-small" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); padding: 5px 8px;" onclick="markManualAttendanceInSession('${student.studentId}', '${sessId}')">
          <i class="fa-solid fa-user-check"></i> Điểm danh
        </button>
      `;
    }

    tbody.innerHTML += `
      <tr>
        <td><strong>${student.studentId}</strong></td>
        <td>${student.name}</td>
        <td>${statusHtml}</td>
        <td>${timeHtml}</td>
        <td>${typeHtml}</td>
        <td style="text-align: center;">${imgHtml}</td>
        <td>${actionHtml}</td>
      </tr>
    `;
  });
}

// Điểm danh thủ công ngay từ trong bảng chi tiết phiên
async function markManualAttendanceInSession(studentId, sessionId) {
  if (!confirm(`Xác nhận điểm danh thủ công cho sinh viên ${studentId}?`)) return;
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
    
    // Nạp lại chi tiết phiên (force refresh)
    viewSessionDetails(sessionId, true);
    
    // Nạp lại số lượng sinh viên ở ngoài bảng danh sách phiên
    fetchSessionsHistory();
  } catch (err) {
    showToast(err.message || 'Lỗi điểm danh thủ công!', 'error');
  }
}

// Xem ảnh selfie cỡ lớn
function viewLargeImage(imageSrc) {
  document.getElementById('modal-large-image').src = imageSrc;
  openModal('modal-image-view');
}


// ================= TAB 3: DANH SÁCH LỚP & BẢNG TỔNG HỢP ĐIỂM DANH =================
async function fetchStudentsList() {
  const table = document.getElementById('students-matrix-table');
  if (!table) return;

  table.innerHTML = `<thead><tr><th style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu bảng tổng hợp...</th></tr></thead>`;

  try {
    const res = await fetch(`${API_URL}/teacher/classes/${currentClassId}/attendance-matrix`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error("Lỗi tải thông tin từ máy chủ.");
    }

    const { students, sessions, attendances } = await res.json();

    classStudents = students;
    classSessions = sessions;

    // Sắp xếp các phiên điểm danh theo thứ tự thời gian tăng dần (buổi đầu tiên -> buổi gần nhất)
    sessions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Xây dựng Header cho bảng tổng hợp
    let headerHtml = `
      <tr>
        <th style="white-space: nowrap;">MSSV</th>
        <th style="white-space: nowrap; min-width: 160px;">Họ và Tên</th>
        <th style="white-space: nowrap; min-width: 90px;">Lớp SH</th>
    `;

    // Thêm các cột cho từng phiên điểm danh
    sessions.forEach((s, idx) => {
      const colLabel = s.label && s.label !== 'Điểm danh buổi học' ? s.label : `Buổi ${idx + 1}`;
      const createdDate = new Date(s.createdAt);
      const displayDate = `${createdDate.getDate()}/${createdDate.getMonth() + 1}`;
      headerHtml += `
        <th style="text-align: center; min-width: 80px;" title="${s.label || ''} (${s.sessionId}) - Tạo lúc: ${createdDate.toLocaleDateString('vi-VN')}">
          <div>${colLabel}</div>
          <div style="font-size: 10px; font-weight: normal; opacity: 0.7; margin-top: 2px;">${displayDate}</div>
        </th>
      `;
    });

    headerHtml += `
        <th style="text-align: center; min-width: 100px;">Tổng buổi</th>
      </tr>
    `;

    // Xây dựng Body cho bảng tổng hợp
    let bodyHtml = '';

    if (students.length === 0) {
      bodyHtml = `<tr><td colspan="${3 + sessions.length + 1}" style="text-align: center; padding: 20px;">Lớp học phần này chưa gán sinh viên nào.</td></tr>`;
      table.innerHTML = `<thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody>`;
      return;
    }

    students.forEach(student => {
      let rowHtml = `
        <tr>
          <td style="white-space: nowrap;"><strong>${student.studentId}</strong></td>
          <td style="white-space: nowrap;">${student.name}</td>
          <td style="white-space: nowrap;">${student.homeClass || '-'}</td>
      `;

      let attendedCount = 0;

      // Duyệt qua từng phiên điểm danh để kiểm tra trạng thái của sinh viên
      sessions.forEach(session => {
        const att = attendances.find(a => a.studentId === student.studentId && a.sessionId === session.sessionId);
        
        if (att) {
          attendedCount++;
          const methodIcon = att.isManual 
            ? '<i class="fa-solid fa-user-pen" style="font-size: 11px; margin-left: 3px;" title="Điểm danh thủ công"></i>' 
            : '<i class="fa-solid fa-qrcode" style="font-size: 11px; margin-left: 3px;" title="Quét QR"></i>';
          rowHtml += `
            <td style="text-align: center; color: var(--success);" title="Có mặt (${att.isManual ? 'Thủ công' : 'Quét QR'})">
              <span style="font-weight: bold; font-size: 16px;">✓</span>${methodIcon}
            </td>
          `;
        } else {
          rowHtml += `
            <td style="text-align: center; color: var(--danger);" title="Vắng mặt">
              <span style="font-weight: bold; font-size: 15px;">✗</span>
            </td>
          `;
        }
      });

      // Cột tổng hợp số buổi
      const totalSessions = sessions.length;
      const pct = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0;
      let pctColor = 'var(--danger)';
      if (pct >= 80) pctColor = 'var(--success)';
      else if (pct >= 50) pctColor = 'var(--warning)';

      rowHtml += `
          <td style="text-align: center; font-weight: 600;">
            <span style="color: var(--text-primary);">${attendedCount}/${totalSessions}</span>
            <div style="font-size: 11px; color: ${pctColor}; font-weight: normal; margin-top: 2px;">${pct}%</div>
          </td>
        </tr>
      `;

      bodyHtml += rowHtml;
    });

    table.innerHTML = `<thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody>`;

  } catch (err) {
    console.error('Lỗi tải bảng tổng hợp điểm danh:', err);
    table.innerHTML = `<thead><tr><th style="text-align: center; color: var(--danger); padding: 20px;">Lỗi tải bảng tổng hợp!</th></tr></thead>`;
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
