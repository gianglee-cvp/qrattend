let currentSessionId = '';
let classStudents = [];
let capturedImageBase64 = '';

// Sự kiện khi tải trang
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionParam = urlParams.get('session');

  if (sessionParam) {
    currentSessionId = sessionParam.trim();
    // Ẩn hộp nhập tay mã buổi học vì đã lấy được tự động từ QR URL
    document.getElementById('session-input-box').style.display = 'none';
    loadSessionInfo(currentSessionId);
  }
});

// Xử lý khi click nút tìm buổi học nhập tay
function loadSessionManual() {
  const manualId = document.getElementById('manualSessionId').value.trim();
  if (!manualId) {
    alert('Vui lòng nhập mã buổi học!');
    return;
  }
  currentSessionId = manualId;
  loadSessionInfo(currentSessionId);
}

// Tải thông tin lớp học phần dựa vào sessionId
async function loadSessionInfo(sessionId) {
  hideResult();
  try {
    const res = await fetch(`${API_URL}/sessions/info/${sessionId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Không tìm thấy phiên điểm danh!');

    // Hiển thị thông tin lớp học phần
    document.getElementById('class-info-box').style.display = 'flex';
    document.getElementById('display-subject-name').innerText = data.subjectName;
    document.getElementById('display-class-id').innerText = `Mã lớp: ${data.classId} (${data.sessionId})`;

    // Hiển thị form điền thông tin điểm danh
    document.getElementById('attendance-fields').style.display = 'block';

    // Ẩn ô nhập tay nếu trước đó dùng nhập tay thành công
    document.getElementById('session-input-box').style.display = 'none';

    // Tải danh sách sinh viên thuộc lớp học phần này
    fetchClassStudents(sessionId);

  } catch (err) {
    showResult(err.message, 'danger');
    document.getElementById('attendance-fields').style.display = 'none';
    document.getElementById('class-info-box').style.display = 'none';
    document.getElementById('session-input-box').style.display = 'block';
  }
}

// Tải danh sách sinh viên của lớp học phần
async function fetchClassStudents(sessionId) {
  try {
    const res = await fetch(`${API_URL}/sessions/${sessionId}/students`);
    if (!res.ok) throw new Error();
    classStudents = await res.json();
  } catch (err) {
    console.error('Không thể tải danh sách sinh viên của lớp.');
  }
}

// Xử lý sự kiện gõ tìm kiếm sinh viên
function onSearchInput(input) {
  const query = input.value.trim().toLowerCase();
  const suggestionBox = document.getElementById('suggestion-box');
  
  if (!query) {
    suggestionBox.style.display = 'none';
    return;
  }

  // Lọc sinh viên theo tên hoặc MSSV
  const filtered = classStudents.filter(s => 
    s.name.toLowerCase().includes(query) || 
    s.studentId.includes(query)
  );

  suggestionBox.innerHTML = '';
  if (filtered.length === 0) {
    suggestionBox.innerHTML = `<div class="suggestion-item" style="color: var(--text-secondary); cursor: default;">Không tìm thấy sinh viên hợp lệ</div>`;
  } else {
    filtered.forEach(s => {
      suggestionBox.innerHTML += `
        <div class="suggestion-item" onclick="selectStudent('${s.studentId}', '${s.name}')">
          <strong style="color: var(--text-primary);">${s.studentId}</strong> - ${s.name} (${s.homeClass || 'Lớp tự do'})
        </div>
      `;
    });
  }
  suggestionBox.style.display = 'block';
}

// Sự kiện click chọn 1 sinh viên trong dropdown gợi ý
function selectStudent(studentId, name) {
  document.getElementById('student-search-input').value = `${studentId} - ${name}`;
  document.getElementById('studentId').value = studentId;
  document.getElementById('suggestion-box').style.display = 'none';
}

// Click ra ngoài gợi ý ẩn dropdown đi
document.addEventListener('click', (e) => {
  const box = document.getElementById('suggestion-box');
  const input = document.getElementById('student-search-input');
  if (box && e.target !== input && !box.contains(e.target)) {
    box.style.display = 'none';
  }
});

// Đọc file ảnh từ camera chân dung sinh viên dạng Base64
function handlePhotoSelection(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    capturedImageBase64 = e.target.result;
    
    // Hiển thị preview ảnh
    document.getElementById('previewImg').src = capturedImageBase64;
    document.getElementById('photoPreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// Xác nhận nộp điểm danh
async function submitAttendance() {
  hideResult();
  const studentId = document.getElementById('studentId').value;
  
  if (!studentId) {
    alert('Vui lòng chọn Tên hoặc MSSV của bạn từ danh sách gợi ý!');
    return;
  }
  if (!capturedImageBase64) {
    alert('Vui lòng chụp ảnh chân dung selfie trước khi điểm danh!');
    return;
  }

  // Loading button state
  const btnSubmit = document.getElementById('btn-submit-attendance');
  const originalText = btnSubmit.innerHTML;
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = `<span>Đang xác nhận...</span><i class="fa-solid fa-spinner fa-spin"></i>`;

  try {
    const res = await fetch(`${API_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        sessionId: currentSessionId,
        image: capturedImageBase64
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi điểm danh!');

    showResult(data.message, 'success');
    
    // Ẩn form nhập liệu sau khi điểm danh thành công
    document.getElementById('attendance-fields').style.display = 'none';

  } catch (err) {
    showResult(err.message, 'danger');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = originalText;
  }
}

// Điều khiển Alert hiển thị kết quả
function showResult(message, type) {
  const alertBox = document.getElementById('result-alert');
  const alertMsg = document.getElementById('result-message');
  
  alertBox.className = `alert alert-${type}`;
  alertMsg.innerText = message;
  alertBox.style.display = 'flex';
}

function hideResult() {
  document.getElementById('result-alert').style.display = 'none';
}
