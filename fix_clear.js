const fs = require('fs');
let code = fs.readFileSync('frontend/admin.js', 'utf8');

function clearLoaderBeforeRender(varName) {
  const badPattern = new RegExp(\`(\${varName} = await res\\.json\\(\\);\\s*if \\(\${varName}\\.length === 0\\) \\{)\`, 'g');
  code = code.replace(badPattern, \`tbody.innerHTML = '';\n\n    $1\`);
}

clearLoaderBeforeRender('allStudents');
clearLoaderBeforeRender('allTeachers');
clearLoaderBeforeRender('allSubjects');
clearLoaderBeforeRender('allClasses');

fs.writeFileSync('frontend/admin.js', code);
console.log('Fixed clearing loader!');
