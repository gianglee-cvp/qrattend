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
const html5Qr = new Html5Qrcode("reader");
html5Qr.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 },
  (decodedText) => {
    scannedSessionId = decodedText;
    document.getElementById('result').innerText = 'Mã buổi học: ' + scannedSessionId;
    html5Qr.stop();
  },
  (error) => {}
);

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
