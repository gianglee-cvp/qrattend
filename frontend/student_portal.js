// Kiểm tra quyền sinh viên truy cập khi tải trang
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');
const studentName = localStorage.getItem('name');
const studentId = localStorage.getItem('studentId');

if (!token || role !== 'student') {
  localStorage.clear();
  window.location.href = '/login/student';
} else {
  document.getElementById('student-name').innerText = `${studentId} - ${studentName || 'Sinh viên'}`;
}

// Tải danh sách lớp khi tải trang
document.addEventListener('DOMContentLoaded', () => {
  fetchStudentClasses();
});

// Đăng xuất
function handleLogout() {
  localStorage.clear();
  window.location.href = '/login/student';
}

// Điều khiển Modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// Tải các lớp học phần đang tham gia
async function fetchStudentClasses() {
  const container = document.getElementById('classes-list-container');
  try {
    const res = await fetch(`${API_URL}/student/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    const classes = await res.json();

    container.innerHTML = '';
    if (classes.length === 0) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-secondary); width: 100%;">Bạn chưa được gán vào lớp học phần nào.</p>`;
      return;
    }

    classes.forEach(c => {
      container.innerHTML += `
        <div class="class-card" onclick="viewClassHistory('${c.classId}', '${c.subjectName}')">
          <div class="class-card-code">${c.subjectCode}</div>
          <h3 class="class-card-title">${c.subjectName}</h3>
          <div class="class-card-teacher"><i class="fa-solid fa-user-tie"></i> Giảng viên: ${c.teacherId}</div>
        </div>
      `;
    });
  } catch (err) {
    container.innerHTML = `<p style="text-align: center; color: var(--danger); width: 100%;">Lỗi kết nối tới Server!</p>`;
  }
}

// Xem chi tiết lịch sử điểm danh của 1 lớp
async function viewClassHistory(classId, subjectName) {
  document.getElementById('history-modal-title').innerText = `Lịch sử: ${subjectName}`;
  const tbody = document.getElementById('history-table-body');
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Đang tải dữ liệu...</td></tr>`;

  openModal('modal-class-history');

  try {
    const res = await fetch(`${API_URL}/student/classes/${classId}/sessions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const history = await res.json();

    tbody.innerHTML = '';
    if (history.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Lớp chưa tạo buổi học nào.</td></tr>`;
      return;
    }

    history.forEach(item => {
      const displayDate = new Date(item.date).toLocaleDateString('vi-VN');
      
      const statusHtml = item.attended
        ? `<span class="badge badge-success"><i class="fa-solid fa-check"></i> Có mặt</span>`
        : `<span class="badge badge-danger"><i class="fa-solid fa-xmark"></i> Vắng mặt</span>`;
      
      const timeHtml = item.attended && item.timestamp
        ? new Date(item.timestamp).toLocaleTimeString('vi-VN')
        : '-';

      const typeHtml = item.attended
        ? (item.isManual 
          ? `<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;"><i class="fa-solid fa-user-pen"></i> Thủ công</span>`
          : `<span class="badge badge-success"><i class="fa-solid fa-qrcode"></i> Quét QR</span>`)
        : '-';

      tbody.innerHTML += `
        <tr>
          <td><strong>${item.label || 'Không tên'}</strong></td>
          <td>${displayDate}</td>
          <td>${statusHtml}</td>
          <td>${timeHtml}</td>
          <td>${typeHtml}</td>
        </tr>
      `;
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">Không thể tải dữ liệu điểm danh!</td></tr>`;
  }
}
