function generateQR() {
  const sessionId = document.getElementById('sessionId').value;
  const qrDiv = document.getElementById('qrcode');
  qrDiv.innerHTML = '';
  
  if (sessionId) {
    // Tự động lấy domain hiện tại (dù là IP hay tên miền tunnel)
    const attendanceUrl = `${window.location.origin}/student.html?session=${encodeURIComponent(sessionId)}`;
    
    new QRCode(qrDiv, {
      text: attendanceUrl,
      width: 250,
      height: 250,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    
    const p = document.createElement('p');
    p.className = "mt-3 small text-muted break-all";
    p.style.wordBreak = "break-all";
    p.innerText = `Link quét (Dành cho camera thường): ${attendanceUrl}`;
    qrDiv.appendChild(p);
  } else {
    alert("Vui lòng nhập mã buổi học!");
  }
}

function getStatistics() {
  const sessionId = document.getElementById('statSessionId').value;
  if (!sessionId) {
    alert("Vui lòng nhập mã buổi học để xem thống kê!");
    return;
  }
  
  const statsDiv = document.getElementById('statistics');
  statsDiv.innerHTML = `<p class="text-center text-muted">Đang tải dữ liệu...</p>`;
  
  fetch(`${API_URL}/statistics/${sessionId}`)
    .then(res => res.json())
    .then(data => {
      let html = `<div class="alert alert-info border-0 shadow-sm rounded-4 mb-4">
        <small class="text-muted d-block">SỐ LƯỢNG HIỆN TẠI</small>
        <span class="h2 fw-bold">${data.count}</span> sinh viên
      </div>`;
      
      if (data.list && data.list.length > 0) {
        html += `<div class="list-group shadow-sm">`;
        data.list.forEach(item => {
          html += `
            <div class="list-group-item border-0 border-bottom d-flex align-items-center p-3">
              <img src="${item.image}" class="rounded-3 me-3 border" style="width: 60px; height: 60px; object-fit: cover;" alt="avatar">
              <div class="flex-grow-1">
                <h6 class="mb-1 fw-bold text-dark">${item.name || 'Không rõ tên'}</h6>
                <p class="mb-0 text-muted small">MSSV: <span class="fw-medium text-primary">${item.studentId}</span></p>
              </div>
              <div class="text-end">
                <small class="text-black-50" style="font-size: 0.75rem;">${new Date(item.timestamp).toLocaleTimeString()}</small>
              </div>
            </div>
          `;
        });
        html += `</div>`;
      } else {
        html += `<div class="text-center p-4 bg-white rounded-4 border">
          <p class="text-muted mb-0">Chưa có sinh viên nào điểm danh buổi này.</p>
        </div>`;
      }
      
      statsDiv.innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      statsDiv.innerHTML = `<div class="alert alert-danger">Lỗi kết nối tới Server.</div>`;
    });
}
