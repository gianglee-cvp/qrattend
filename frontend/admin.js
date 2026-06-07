// Kiểm tra quyền truy cập Admin khi tải trang
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');
const adminName = localStorage.getItem('name');

if (!token || role !== 'admin') {
  localStorage.clear();
  window.location.href = '/login/admin';
} else {
  document.getElementById('admin-name').innerText = adminName || 'Quản trị viên';
}

// Biến lưu trữ dữ liệu cache cục bộ
let allStudents = [];
let allTeachers = [];
let allSubjects = [];
let allClasses = [];

// Tải dữ liệu ban đầu
document.addEventListener('DOMContentLoaded', () => {
  fetchStudents();
});

// Chuyển đổi giữa các tab
let currentActiveTab = 'students';

function switchTab(tabName) {
  currentActiveTab = tabName;
  // Cập nhật Active Sidebar Button
  const sidebarBtns = document.querySelectorAll('.sidebar-btn');
  sidebarBtns.forEach(btn => btn.classList.remove('active'));
  
  const activeBtn = Array.from(sidebarBtns).find(btn => btn.getAttribute('onclick').includes(tabName));
  if (activeBtn) activeBtn.classList.add('active');

  // Cập nhật Active Section
  const sections = document.querySelectorAll('.panel-section');
  sections.forEach(sec => sec.classList.remove('active'));
  
  const activeSec = document.getElementById(`tab-${tabName}`);
  if (activeSec) activeSec.classList.add('active');

  // Fetch tương ứng khi đổi tab CHỈ KHI dữ liệu rỗng (tránh load lại liên tục)
  if (tabName === 'students' && allStudents.length === 0) fetchStudents();
  if (tabName === 'teachers' && allTeachers.length === 0) fetchTeachers();
  if (tabName === 'subjects' && allSubjects.length === 0) fetchSubjects();
  if (tabName === 'classes' && allClasses.length === 0) fetchClasses();
}

// Nút làm mới dữ liệu thủ công
function refreshCurrentTab() {
  showToast('Đang làm mới dữ liệu...', 'success');
  if (currentActiveTab === 'students') fetchStudents();
  if (currentActiveTab === 'teachers') fetchTeachers();
  if (currentActiveTab === 'subjects') fetchSubjects();
  if (currentActiveTab === 'classes') fetchClasses();
}

// Xử lý đăng xuất
function handleLogout() {
  localStorage.clear();
  window.location.href = '/login/admin';
}

// ================= MODAL CONTROLLER =================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    
    // Nạp dữ liệu dropdown nếu cần thiết
    if (modalId === 'modal-add-class') {
      populateClassDropdowns();
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Nạp danh sách học phần và giáo viên vào form tạo lớp học phần
// Nạp danh sách học phần vào form tạo lớp học phần
async function populateClassDropdowns() {
  const subjectSelect = document.getElementById('add-class-subject');

  subjectSelect.innerHTML = `<option value="">-- Chọn học phần --</option>`;

  // Đảm bảo cache đã có học phần
  await Promise.all([
    fetch(`${API_URL}/admin/subjects`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(d => allSubjects = d)
  ]);

  allSubjects.forEach(s => {
    subjectSelect.innerHTML += `<option value="${s.subjectCode}">${s.subjectCode} - ${s.subjectName}</option>`;
  });
}

let activeClassIdForDetail = null;

// Mở popup chi tiết lớp học phần và quản lý danh sách sinh viên trong lớp
async function openClassDetailModal(classId) {
  activeClassIdForDetail = classId;
  document.getElementById('class-detail-title').innerText = `Danh Sách Sinh Viên Lớp: ${classId}`;

  // 1. Lấy danh sách sinh viên hiện tại trong lớp
  let classStudents = [];
  try {
    const res = await fetch(`${API_URL}/admin/classes/${classId}/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      classStudents = await res.json();
    }
  } catch (err) {
    console.error('Lỗi lấy DS sinh viên lớp:', err);
  }

  // 2. Hiển thị bảng danh sách sinh viên của lớp
  const tbody = document.getElementById('class-detail-students-tbody');
  tbody.innerHTML = '';
  if (classStudents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Chưa có sinh viên nào trong lớp này.</td></tr>`;
  } else {
    classStudents.forEach(s => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${s.studentId}</strong></td>
          <td>${s.name}</td>
          <td>${s.homeClass || '-'}</td>
          <td>
            <button class="btn-small btn-small-danger" onclick="removeStudentFromClass('${s.studentId}')">
              <i class="fa-solid fa-user-minus"></i> Xóa khỏi lớp
            </button>
          </td>
        </tr>
      `;
    });
  }

  // 3. Nạp danh sách sinh viên vào dropdown để thêm mới
  const studentSelect = document.getElementById('class-detail-add-student-select');
  studentSelect.innerHTML = `<option value="">-- Chọn sinh viên để thêm --</option>`;

  try {
    // Đảm bảo allStudents đã được tải
    if (!allStudents || allStudents.length === 0) {
      const res = await fetch(`${API_URL}/admin/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) allStudents = await res.json();
    }

    const currentStudentIds = classStudents.map(s => s.studentId);
    allStudents.forEach(s => {
      if (!currentStudentIds.includes(s.studentId)) {
        studentSelect.innerHTML += `<option value="${s.studentId}">${s.studentId} - ${s.name} (${s.homeClass || 'Tự do'})</option>`;
      }
    });
  } catch (err) {
    console.error('Lỗi load danh sách sinh viên để thêm:', err);
  }

  openModal('modal-class-detail');
}


// ================= FETCH DATA FUNCTIONS =================
// 1. Quản lý Sinh viên
async function fetchStudents() {
  try {
    const tbody = document.getElementById('student-table-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><br><br>Đang tải dữ liệu...</td></tr>';

    const res = await fetch(`${API_URL}/admin/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    allStudents = await res.json();
    
    tbody.innerHTML = '';

    if (allStudents.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Chưa có sinh viên nào.</td></tr>`;
      return;
    }

    allStudents.forEach(s => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${s.studentId}</strong></td>
          <td>${s.name}</td>
          <td>${s.email || '-'}</td>
          <td>${s.homeClass || '-'}</td>
          <td>
            <div class="action-btn-group">
              <button class="btn-small btn-small-warning" onclick="openEditStudentModal('${s.studentId}', '${s.name.replace(/'/g, "\\'")}', '${(s.email || '').replace(/'/g, "\\'")}', '${(s.homeClass || '').replace(/'/g, "\\'")}')">
                <i class="fa-solid fa-pen-to-square"></i> Sửa
              </button>
              <button class="btn-small btn-small-danger" onclick="deleteStudent('${s.studentId}')">
                <i class="fa-solid fa-trash"></i> Xóa
              </button>
            </div>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error('Lỗi lấy DS sinh viên');
  }
}

// 2. Quản lý Giảng viên
async function fetchTeachers() {
  try {
    const tbody = document.getElementById('teacher-table-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><br><br>Đang tải dữ liệu...</td></tr>';

    const res = await fetch(`${API_URL}/admin/teachers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    allTeachers = await res.json();
    
    tbody.innerHTML = '';

    if (allTeachers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Chưa có giảng viên nào.</td></tr>`;
      return;
    }

    allTeachers.forEach(t => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${t.teacherId}</strong></td>
          <td>${t.name}</td>
          <td>${t.username}</td>
          <td><code>${t.password}</code></td>
          <td>
            <button class="btn-small btn-small-danger" onclick="deleteTeacher('${t.teacherId}')">
              <i class="fa-solid fa-trash"></i> Xóa
            </button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error('Lỗi lấy DS giảng viên');
  }
}

// 3. Quản lý Học phần
async function fetchSubjects() {
  try {
    const tbody = document.getElementById('subject-table-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 30px; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><br><br>Đang tải dữ liệu...</td></tr>';

    const res = await fetch(`${API_URL}/admin/subjects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    allSubjects = await res.json();
    
    tbody.innerHTML = '';

    if (allSubjects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align: center;">Chưa có học phần nào.</td></tr>`;
      return;
    }

    allSubjects.forEach(s => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${s.subjectCode}</strong></td>
          <td>${s.subjectName}</td>
          <td>
            <div class="action-btn-group">
              <button class="btn-small btn-small-warning" onclick="openEditSubjectModal('${s.subjectCode}', '${s.subjectName}')">
                <i class="fa-solid fa-pen"></i> Sửa
              </button>
              <button class="btn-small btn-small-danger" onclick="deleteSubject('${s.subjectCode}')">
                <i class="fa-solid fa-trash"></i> Xóa
              </button>
            </div>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error('Lỗi lấy DS học phần');
  }
}

// 4. Quản lý Lớp học phần
async function fetchClasses() {
  try {
    const tbody = document.getElementById('class-table-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><br><br>Đang tải dữ liệu...</td></tr>';

    const res = await fetch(`${API_URL}/admin/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    allClasses = await res.json();
    
    tbody.innerHTML = '';

    if (allClasses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Chưa có lớp học phần nào.</td></tr>`;
      return;
    }

    allClasses.forEach(c => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${c.classId}</strong></td>
          <td>${c.subjectCode} - ${c.subjectName}</td>
          <td>${c.teacherId}</td>
          <td><span class="badge badge-success">${c.studentIds ? c.studentIds.length : 0} Sinh viên</span></td>
          <td>
            <div class="action-btn-group">
              <button class="btn-small btn-small-primary" onclick="openClassDetailModal('${c.classId}')">
                <i class="fa-solid fa-users-gear"></i> Chi tiết / SV
              </button>
              <button class="btn-small btn-small-danger" onclick="deleteClass('${c.classId}')">
                <i class="fa-solid fa-trash"></i> Xóa
              </button>
            </div>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error('Lỗi lấy DS lớp học phần');
  }
}


// ================= ACTIONS ADD / DELETE =================
// 1. Thêm Sinh viên
async function addStudent(e) {
  e.preventDefault();
  const studentId = document.getElementById('add-student-id').value.trim();
  const name = document.getElementById('add-student-name').value.trim();
  const email = document.getElementById('add-student-email').value.trim();
  const homeClass = document.getElementById('add-student-homeclass').value.trim();

  try {
    const res = await fetch(`${API_URL}/admin/students`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ studentId, name, email, homeClass })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Thêm sinh viên thành công!', 'success');
    closeModal('modal-add-student');
    document.getElementById('form-add-student').reset();
    fetchStudents();
  } catch (err) {
    showToast(err.message || 'Lỗi thêm sinh viên!', 'error');
  }
}

// Mở modal Sửa sinh viên và nạp thông tin hiện tại
function openEditStudentModal(studentId, name, email, homeClass) {
  document.getElementById('edit-student-id').value = studentId;
  document.getElementById('edit-student-name').value = name;
  document.getElementById('edit-student-email').value = email === '-' ? '' : email;
  document.getElementById('edit-student-homeclass').value = homeClass === '-' ? '' : homeClass;
  openModal('modal-edit-student');
}

// Xử lý cập nhật thông tin sinh viên
async function editStudent(e) {
  e.preventDefault();
  const studentId = document.getElementById('edit-student-id').value;
  const name = document.getElementById('edit-student-name').value.trim();
  const email = document.getElementById('edit-student-email').value.trim();
  const homeClass = document.getElementById('edit-student-homeclass').value.trim();

  try {
    const res = await fetch(`${API_URL}/admin/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, email, homeClass })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Cập nhật thông tin sinh viên thành công!', 'success');
    closeModal('modal-edit-student');
    fetchStudents();
  } catch (err) {
    showToast(err.message || 'Lỗi cập nhật sinh viên!', 'error');
  }
}

// Xóa sinh viên
async function deleteStudent(id) {
  if (!confirm(`Bạn có chắc chắn muốn xóa sinh viên ${id}?`)) return;

  try {
    const res = await fetch(`${API_URL}/admin/students/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Xóa sinh viên thành công!', 'success');
    fetchStudents();
  } catch (err) {
    showToast(err.message || 'Lỗi xóa sinh viên!', 'error');
  }
}

// 2. Thêm Giảng viên
async function addTeacher(e) {
  e.preventDefault();
  const teacherId = document.getElementById('add-teacher-id').value.trim();
  const name = document.getElementById('add-teacher-name').value.trim();
  const username = document.getElementById('add-teacher-username').value.trim();
  const password = document.getElementById('add-teacher-password').value.trim();

  try {
    const res = await fetch(`${API_URL}/admin/teachers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ teacherId, name, username, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Thêm giảng viên thành công!', 'success');
    closeModal('modal-add-teacher');
    document.getElementById('form-add-teacher').reset();
    fetchTeachers();
  } catch (err) {
    showToast(err.message || 'Lỗi thêm giảng viên!', 'error');
  }
}

// Xóa giảng viên
async function deleteTeacher(id) {
  if (!confirm(`Bạn có chắc chắn muốn xóa giảng viên ${id}?`)) return;

  try {
    const res = await fetch(`${API_URL}/admin/teachers/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Xóa giảng viên thành công!', 'success');
    fetchTeachers();
  } catch (err) {
    showToast(err.message || 'Lỗi xóa giảng viên!', 'error');
  }
}

// 3. Thêm Học phần
async function addSubject(e) {
  e.preventDefault();
  const subjectCode = document.getElementById('add-subject-code').value.trim();
  const subjectName = document.getElementById('add-subject-name').value.trim();

  try {
    const res = await fetch(`${API_URL}/admin/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subjectCode, subjectName })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Thêm học phần thành công!', 'success');
    closeModal('modal-add-subject');
    document.getElementById('form-add-subject').reset();
    fetchSubjects();
  } catch (err) {
    showToast(err.message || 'Lỗi thêm học phần!', 'error');
  }
}

// Mở popup sửa học phần
function openEditSubjectModal(code, name) {
  document.getElementById('edit-subject-code').value = code;
  document.getElementById('edit-subject-name').value = name;
  openModal('modal-edit-subject');
}

// Sửa học phần
async function editSubject(e) {
  e.preventDefault();
  const subjectCode = document.getElementById('edit-subject-code').value;
  const subjectName = document.getElementById('edit-subject-name').value.trim();

  try {
    const res = await fetch(`${API_URL}/admin/subjects/${subjectCode}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subjectName })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Cập nhật học phần thành công!', 'success');
    closeModal('modal-edit-subject');
    fetchSubjects();
    fetchClasses(); // Tải lại lớp học phần vì tên môn học có thể đã thay đổi
  } catch (err) {
    showToast(err.message || 'Lỗi cập nhật học phần!', 'error');
  }
}

// Xóa học phần
async function deleteSubject(code) {
  if (!confirm(`Bạn có chắc chắn muốn xóa học phần ${code}?`)) return;

  try {
    const res = await fetch(`${API_URL}/admin/subjects/${code}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Xóa học phần thành công!', 'success');
    fetchSubjects();
  } catch (err) {
    showToast(err.message || 'Lỗi xóa học phần!', 'error');
  }
}

// 4. Tạo Lớp học phần
async function addClass(e) {
  e.preventDefault();
  const classId = document.getElementById('add-class-id').value.trim();
  const subjectCode = document.getElementById('add-class-subject').value;
  const teacherId = document.getElementById('add-class-teacher').value;

  try {
    const res = await fetch(`${API_URL}/admin/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ classId, subjectCode, teacherId })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Tạo lớp học phần thành công!', 'success');
    closeModal('modal-add-class');
    document.getElementById('form-add-class').reset();
    fetchClasses();
  } catch (err) {
    showToast(err.message || 'Lỗi tạo lớp!', 'error');
  }
}

// Xóa lớp học phần
async function deleteClass(id) {
  if (!confirm(`Bạn có chắc chắn muốn xóa lớp học phần ${id}?`)) return;

  try {
    const res = await fetch(`${API_URL}/admin/classes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Xóa lớp học phần thành công!', 'success');
    fetchClasses();
  } catch (err) {
    showToast(err.message || 'Lỗi xóa lớp!', 'error');
  }
}

// Thêm sinh viên vào lớp từ màn hình chi tiết
async function addStudentToClassFromDetail() {
  const studentSelect = document.getElementById('class-detail-add-student-select');
  const studentId = studentSelect.value;
  if (!studentId) {
    showToast('Vui lòng chọn một sinh viên!', 'success');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/admin/classes/${activeClassIdForDetail}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ studentId })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Thêm sinh viên vào lớp thành công!', 'success');
    openClassDetailModal(activeClassIdForDetail);
    fetchClasses();
  } catch (err) {
    showToast(err.message || 'Lỗi thêm sinh viên vào lớp!', 'error');
  }
}

// Xóa sinh viên khỏi lớp
async function removeStudentFromClass(studentId) {
  if (!confirm(`Bạn có chắc chắn muốn xóa sinh viên ${studentId} khỏi lớp ${activeClassIdForDetail}?`)) return;

  try {
    const res = await fetch(`${API_URL}/admin/classes/${activeClassIdForDetail}/students/${studentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Đã xóa sinh viên khỏi lớp!', 'success');
    openClassDetailModal(activeClassIdForDetail);
    fetchClasses();
  } catch (err) {
    showToast(err.message || 'Lỗi xóa sinh viên khỏi lớp!', 'error');
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
