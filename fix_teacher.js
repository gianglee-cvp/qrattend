const fs = require('fs');
let code = fs.readFileSync('frontend/teacher.js', 'utf8');

// 1. Add sessionDetailsCache
if (!code.includes('let sessionDetailsCache')) {
  code = `let sessionDetailsCache = {};\n` + code;
}

// 2. Replace viewSessionDetails
const newViewSessionDetails = `async function viewSessionDetails(sessId, forceRefresh = false) {
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
    const res = await fetch(\`\${API_URL}/statistics/\${sessId}\`);
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
      ? \`<img src="\${item.image}" class="attendance-selfie" onclick="viewLargeImage('\${item.image}')" title="Click để xem ảnh lớn">\`
      : \`<span style="color: var(--text-secondary); font-size:12px;">Không có</span>\`;
    
    const typeHtml = item.isManual
      ? \`<span class="badge badge-danger" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;"><i class="fa-solid fa-user-pen"></i> Thủ công</span>\`
      : \`<span class="badge badge-success"><i class="fa-solid fa-qrcode"></i> Quét QR</span>\`;

    tbody.innerHTML += \`
      <tr>
        <td>\${imgHtml}</td>
        <td><strong>\${item.studentId}</strong></td>
        <td>\${item.name}</td>
        <td>\${attTime}</td>
        <td>\${typeHtml}</td>
      </tr>
    \`;
  });
}`;

// find old viewSessionDetails and replace
const oldFuncRegex = /async function viewSessionDetails\(sessId\) \{[\s\S]*?(?=\n\/\/ Xem ảnh selfie cỡ lớn)/;
code = code.replace(oldFuncRegex, newViewSessionDetails + '\n');

// 3. Replace alert
code = code.replace(/alert\((['`].*?['`])\);/g, "showToast($1, 'success');");
code = code.replace(/alert\((err\.message\s*\|\|\s*['`].*?['`])\);/g, "showToast($1, 'error');");
code = code.replace(/showToast\('Vui lòng chọn phiên để điểm danh!', 'success'\);/g, "showToast('Vui lòng chọn phiên để điểm danh!', 'warning');");

// 4. Add showToast function at end
if (!code.includes('function showToast')) {
  code += `\n// Toast Notification System
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = \`toast \${type}\`;
  let icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-circle-xmark';
  if (type === 'warning') icon = 'fa-triangle-exclamation';
  
  toast.innerHTML = \`<i class="fa-solid \${icon}" style="color: var(--\${type})"></i> <span>\${message}</span>\`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}\n`;
}

fs.writeFileSync('frontend/teacher.js', code);
console.log('Fixed teacher.js');
