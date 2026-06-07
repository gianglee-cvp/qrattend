// === STUDENT LOGIN PAGE ===
function hideAlert() {
  document.getElementById('alert-box').style.display = 'none';
}

function showAlert(message) {
  const alertBox = document.getElementById('alert-box');
  document.getElementById('alert-message').innerText = message;
  alertBox.style.display = 'flex';
}

async function handleStudentLogin(e) {
  e.preventDefault();
  hideAlert();

  const studentId = document.getElementById('studentId').value.trim();

  const btnLogin = document.getElementById('btn-login');
  if (btnLogin.disabled) return; // Prevent double clicks
  btnLogin.disabled = true;
  btnLogin.innerHTML = `<span>Đang xử lý...</span><i class="fa-solid fa-spinner fa-spin"></i>`;

  try {
    const res = await fetch(`${API_URL}/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Đăng nhập sinh viên thất bại!');

    // Lưu trữ thông tin đăng nhập
    localStorage.setItem('token', data.token);
    localStorage.setItem('studentId', data.studentId);
    localStorage.setItem('name', data.name);
    localStorage.setItem('role', 'student');

    // Điều hướng sang Cổng sinh viên
    window.location.href = '/student-portal';
  } catch (err) {
    showAlert(err.message);
  } finally {
    btnLogin.disabled = false;
    btnLogin.innerHTML = `<span>Đăng nhập Sinh Viên</span><i class="fa-solid fa-arrow-right"></i>`;
  }
}
