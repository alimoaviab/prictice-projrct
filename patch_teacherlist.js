const fs = require('fs');
const file = 'school-app/modules/teachers/pages/TeacherListPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// add import
code = code.replace('import { useClasses } from "../../classes/hooks/useClasses";', 'import { useClasses } from "../../classes/hooks/useClasses";\nimport { useSubjects } from "../../subjects/hooks/useSubjects";');

// use hook
code = code.replace('const { state: classesState } = useClasses();', 'const { state: classesState } = useClasses();\n  const { data: subjectsData } = useSubjects();');

// replace hardcoded subjects
const matcher = /const subjectOptions = \[\s*\{[\s\S]*?\];/;
code = code.replace(matcher, 'const subjectOptions = subjectsData.map((subj) => ({ id: (subj as any)._id || subj.id || subj.name, label: subj.name }));');

fs.writeFileSync(file, code);
