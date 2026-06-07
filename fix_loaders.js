const fs = require('fs');
let code = fs.readFileSync('frontend/admin.js', 'utf8');

// Move loading indicator BEFORE the fetch request
function injectLoader(funcName, tableId, colspan) {
  const regex = new RegExp(\`(async function \${funcName}\\(\\)\\s*\\{\\s*try\\s*\\{)\`);
  
  // First, remove the old misplaced loading indicator
  const badRegex = new RegExp(\`const tbody = document\\.getElementById\\('\${tableId}'\\);\\s*tbody\\.innerHTML = '<tr><td colspan="\${colspan}" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"><\\/i> Đang tải dữ liệu...<\\/td><\\/tr>';\`, 'g');
  
  // Also remove the old tbody.innerHTML = '';
  const badRegex2 = new RegExp(\`const tbody = document\\.getElementById\\('\${tableId}'\\);\\s*tbody\\.innerHTML = '';\`, 'g');

  code = code.replace(badRegex, '');
  code = code.replace(badRegex2, '');
  
  // Now inject the new loader at the start of the try block
  code = code.replace(regex, \`$1
    const tbody = document.getElementById('\${tableId}');
    if (tbody) tbody.innerHTML = '<tr><td colspan="\${colspan}" style="text-align: center; padding: 30px; color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><br><br>Đang tải dữ liệu...</td></tr>';
\`);
}

injectLoader('fetchStudents', 'student-table-body', '5');
injectLoader('fetchTeachers', 'teacher-table-body', '5');
injectLoader('fetchSubjects', 'subject-table-body', '3');
injectLoader('fetchClasses', 'class-table-body', '5');

fs.writeFileSync('frontend/admin.js', code);
console.log('Fixed loaders');
