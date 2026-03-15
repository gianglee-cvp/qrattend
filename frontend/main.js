function renderRoleUI() {
  const role = document.getElementById('roleSelect').value;
  const roleUI = document.getElementById('roleUI');
  if (role === 'teacher') {
    roleUI.innerHTML = `
      <div class="mb-4">
        <h3>Tạo mã QR cho buổi học</h3>
        <input type="text" id="sessionId" class="form-control mb-2" placeholder="Nhập mã buổi học">
        <button class="btn btn-primary mb-2" onclick="generateQR()">Tạo mã QR</button>
        <div id="qrcode"></div>
      </div>
      <hr>
      <h3>Thống kê điểm danh</h3>
      <input type="text" id="statSessionId" class="form-control mb-2" placeholder="Nhập mã buổi học">
      <button class="btn btn-info mb-2" onclick="getStatistics()">Xem thống kê</button>
      <div id="statistics"></div>
    `;
  } else {
    roleUI.innerHTML = `
      <div class="mb-4">
        <h3>Quét mã QR để điểm danh</h3>
        <div id="reader" style="width:300px;"></div>
        <input type="text" id="studentId" class="form-control mt-2" placeholder="Nhập mã sinh viên">
        <button class="btn btn-success mt-2" onclick="submitAttendance()">Điểm danh</button>
        <div id="result" class="mt-2"></div>
      </div>
    `;
    startQrScanner();
  }
}

// Tạo mã QR
function generateQR() {
  const sessionId = document.getElementById('sessionId').value;
  const qrDiv = document.getElementById('qrcode');
  qrDiv.innerHTML = '';
  if (sessionId) {
    new QRCode(qrDiv, {
      text: sessionId,
      width: 200,
      height: 200
    });
  }
}

// Quét mã QR
let scannedSessionId = '';
function startQrScanner() {
  if (document.getElementById('reader')) {
    const html5Qr = new Html5Qrcode("reader");
    html5Qr.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 },
      (decodedText) => {
        scannedSessionId = decodedText;
        document.getElementById('result').innerText = 'Mã buổi học: ' + scannedSessionId;
        html5Qr.stop();
      },
      (error) => {}
    );
  }
}

// Điểm danh
function submitAttendance() {
  const studentId = document.getElementById('studentId').value;
  if (!studentId || !scannedSessionId) {
    document.getElementById('result').innerText = 'Vui lòng nhập mã sinh viên và quét mã QR.';
    return;
  }
  fetch('http://localhost:3000/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, sessionId: scannedSessionId })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById('result').innerText = data.message;
    });
}

// Thống kê
function getStatistics() {
  const sessionId = document.getElementById('statSessionId').value;
  fetch('http://localhost:3000/api/statistics/' + sessionId)
    .then(res => res.json())
    .then(data => {
      document.getElementById('statistics').innerText = 'Số sinh viên đã điểm danh: ' + data.count;
    });
}

// Khởi tạo UI mặc định
window.onload = renderRoleUI;
