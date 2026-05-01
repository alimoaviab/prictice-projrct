const fs = require('fs');
const file = 'school-app/modules/students/pages/StudentListPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `const subjectOptions = subjectsData.map((subj) => ({ id: cls._id || subj.id || subj.name, label: subj.name }));`,
  `const subjectOptions = subjectsData.map((subj) => ({ id: (subj as any)._id || subj.id || subj.name, label: subj.name }));`
);

code = code.replace(
  '        classOptions={classOptions}',
  '        classOptions={classOptions}\n        subjectOptions={subjectOptions}'
);

fs.writeFileSync(file, code);
