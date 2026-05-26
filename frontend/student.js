let studentPhotoBase64 = '';
let scannedSessionId = '';
let html5Qr = null;

// Tự động load thông tin đã lưu
document.addEventListener("DOMContentLoaded", () => {
  const savedId = localStorage.getItem('studentId') || '';
  const savedName = localStorage.getItem('studentName') || '';
  document.getElementById('studentId').value = savedId;
  document.getElementById('studentName').value = savedName;

  // Kiểm tra session URL (nếu quét từ mã QR của Giáo viên)
  const urlParams = new URLSearchParams(window.location.search);
  const sessionFromUrl = urlParams.get('session');
  
  if (sessionFromUrl) {
    scannedSessionId = sessionFromUrl;
    document.getElementById('manualSessionId').value = sessionFromUrl;
    document.getElementById('manualSessionId').disabled = true; // Khóa lại nếu đã quét từ link
    showStatus(`📌 Sẵn sàng điểm danh cho buổi: <strong>${sessionFromUrl}</strong>`, 'success');
  } else {
    // Nếu không có session trên URL, bật camera lên cho tự quét
    setTimeout(startQrScanner, 200);
  }
});

function handlePhotoSelection(input) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      studentPhotoBase64 = e.target.result;
      document.getElementById('photoPreview').style.display = 'block';
      document.getElementById('previewImg').src = studentPhotoBase64;
    };
    reader.readAsDataURL(file);
  }
}

async function startQrScanner() {
  const readerElement = document.getElementById('reader');
  if (!readerElement) return;
  
  if (html5Qr) try { await html5Qr.stop(); } catch(e) {}
  
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };
  html5Qr = new Html5Qrcode("reader");
  
  html5Qr.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      // Phân tích nếu QR chứa URL
      if (decodedText.includes('session=')) {
        scannedSessionId = new URL(decodedText).searchParams.get('session');
      } else {
        scannedSessionId = decodedText;
      }
      document.getElementById('manualSessionId').value = scannedSessionId;
      showStatus(`📌 Đã quét buổi: <strong>${scannedSessionId}</strong>`, 'success');
      if (navigator.vibrate) navigator.vibrate(50);
      try { html5Qr.stop(); } catch(e){} // Dừng quét sau khi thành công
    },
    (error) => {}
  ).catch(err => {
    showStatus('📸 Bạn có thể tự quét mã QR khác hoặc chụp ảnh ngay!', 'info');
  });
}

function showStatus(message, type) {
  const resultDiv = document.getElementById('result');
  if (resultDiv) {
    resultDiv.innerHTML = `<div class="alert alert-${type} shadow-sm border-0 mb-0">${message}</div>`;
  }
}

function submitAttendance() {
  const studentId = document.getElementById('studentId').value.trim();
  const studentName = document.getElementById('studentName').value.trim();
  const btn = document.querySelector('button[onclick="submitAttendance()"]');
  
  if (!studentName) {
    showStatus('⚠️ Vui lòng nhập Họ và tên!', 'warning');
    return;
  }
  if (!studentId) {
    showStatus('⚠️ Vui lòng nhập MSSV!', 'warning');
    return;
  }
  const manualSessionId = document.getElementById('manualSessionId').value.trim();
  const finalSessionId = scannedSessionId || manualSessionId;

  if (!finalSessionId) {
    showStatus('⚠️ Vui lòng quét mã QR hoặc nhập tay Mã buổi học!', 'warning');
    return;
  }
  if (!studentPhotoBase64) {
    showStatus('⚠️ Bạn PHẢI chụp ảnh chân dung trước khi xác nhận!', 'danger');
    return;
  }

  btn.disabled = true;
  const originalBtnText = btn.innerText;
  btn.innerText = '⌛ ĐANG XỬ LÝ...';

  // Lưu lại cho lần sau
  localStorage.setItem('studentId', studentId);
  localStorage.setItem('studentName', studentName);

  fetch(`${API_URL}/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      studentId, 
      name: studentName,
      sessionId: finalSessionId,
      image: studentPhotoBase64 
    })
  })
    .then(async res => {
      const data = await res.json();
      if (res.ok) {
        showStatus(`✅ ${data.message}`, 'success');
        if (navigator.vibrate) navigator.vibrate([100, 30, 100]);
        // Xóa ảnh để tránh lấy nhầm cho lần điểm danh sau
        studentPhotoBase64 = '';
        document.getElementById('photoPreview').style.display = 'none';
      } else {
        showStatus(`❌ Lỗi: ${data.message}`, 'danger');
      }
    })
    .catch(err => {
      console.error(err);
      showStatus('❌ KHÔNG KẾT NỐI ĐƯỢC! Hãy kiểm tra Firewall và IP máy tính.', 'danger');
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerText = originalBtnText;
    });
}
