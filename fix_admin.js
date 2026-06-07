const fs = require('fs');
let code = fs.readFileSync('frontend/admin.js', 'utf8');

// Replace alert('Success message') with showToast('Success message', 'success')
code = code.replace(/alert\((['`].*?['`])\);/g, "showToast($1, 'success');");

// Replace alert(err.message || 'Error message') with showToast(err.message || 'Error message', 'error')
code = code.replace(/alert\((err\.message\s*\|\|\s*['`].*?['`])\);/g, "showToast($1, 'error');");

// Insert showToast function at the end if not exists
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

// Add loading indicator to fetchStudents
code = code.replace(
  /const tbody = document\.getElementById\('student-table-body'\);\n\s*tbody\.innerHTML = '';/,
  `const tbody = document.getElementById('student-table-body');\n    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</td></tr>';`
);

// Add loading indicator to fetchTeachers
code = code.replace(
  /const tbody = document\.getElementById\('teacher-table-body'\);\n\s*tbody\.innerHTML = '';/,
  `const tbody = document.getElementById('teacher-table-body');\n    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</td></tr>';`
);

// Add loading indicator to fetchSubjects
code = code.replace(
  /const tbody = document\.getElementById\('subject-table-body'\);\n\s*tbody\.innerHTML = '';/,
  `const tbody = document.getElementById('subject-table-body');\n    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</td></tr>';`
);

// Add loading indicator to fetchClasses
code = code.replace(
  /const tbody = document\.getElementById\('class-table-body'\);\n\s*tbody\.innerHTML = '';/,
  `const tbody = document.getElementById('class-table-body');\n    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</td></tr>';`
);

fs.writeFileSync('frontend/admin.js', code);
console.log('Fixed admin.js');
