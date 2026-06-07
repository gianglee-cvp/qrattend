// === TEACHER LOGIN PAGE ===
function hideAlert() {
  document.getElementById('alert-box').style.display = 'none';
}

function showAlert(message) {
  const alertBox = document.getElementById('alert-box');
  document.getElementById('alert-message').innerText = message;
  alertBox.style.display = 'flex';
}

async function handleTeacherLogin(e) {
  e.preventDefault();
  hideAlert();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const btnLogin = document.getElementById('btn-login');
  const originalText = btnLogin.innerHTML;
  btnLogin.disabled = true;
  btnLogin.innerHTML = `<span>Đang xử lý...</span><i class="fa-solid fa-spinner fa-spin"></i>`;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role: 'teacher' })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Sai tên tài khoản hoặc mật khẩu Giảng viên!');

    // Lưu trữ thông tin đăng nhập
    localStorage.setItem('token', data.token);
    localStorage.setItem('name', data.name);
    localStorage.setItem('role', data.role);
    if (data.teacherId) {
      localStorage.setItem('teacherId', data.teacherId);
    }

    // Điều hướng sang Dashboard Giảng viên
    window.location.href = '/teacher';
  } catch (err) {
    showAlert(err.message);
  } finally {
    btnLogin.disabled = false;
    btnLogin.innerHTML = originalText;
  }
}
