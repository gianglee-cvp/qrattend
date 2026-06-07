// === ADMIN LOGIN PAGE ===
function hideAlert() {
  document.getElementById('alert-box').style.display = 'none';
}

function showAlert(message) {
  const alertBox = document.getElementById('alert-box');
  document.getElementById('alert-message').innerText = message;
  alertBox.style.display = 'flex';
}

async function handleAdminLogin(e) {
  e.preventDefault();
  hideAlert();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const btnLogin = document.getElementById('btn-login');
  if (btnLogin.disabled) return; // Prevent double clicks
  btnLogin.disabled = true;
  btnLogin.innerHTML = `<span>Đang xử lý...</span><i class="fa-solid fa-spinner fa-spin"></i>`;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role: 'admin' })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Sai tài khoản hoặc mật khẩu Admin!');

    // Lưu trữ thông tin đăng nhập
    localStorage.setItem('token', data.token);
    localStorage.setItem('name', data.name);
    localStorage.setItem('role', data.role);

    // Điều hướng sang Dashboard Admin
    window.location.href = '/admin';
  } catch (err) {
    showAlert(err.message);
  } finally {
    btnLogin.disabled = false;
    btnLogin.innerHTML = `<span>Đăng nhập Admin</span><i class="fa-solid fa-arrow-right"></i>`;
  }
}
