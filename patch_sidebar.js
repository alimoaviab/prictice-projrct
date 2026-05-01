const fs = require('fs');
const file = 'school-app/modules/students/components/StudentEditSidebar.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'classOptions: Array<{ id: string; label: string }>;',
  'classOptions: Array<{ id: string; label: string }>;\n    subjectOptions?: Array<{ id: string; label: string }>;'
);

code = code.replace(
  '    classOptions,',
  '    classOptions,\n    subjectOptions = [],'
);

const subjectsSection = `
                    {/* Subjects Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                            Enrolled Subjects
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                            {subjectOptions.map(option => (
                                <label key={option.id} className="flex items-center gap-2 text-sm text-gray-700">
                                    <input 
                                        type="checkbox"
                                        checked={form.subjects?.includes(option.id) || currentForm.subjects?.includes(option.id)}
                                        onChange={(e) => {
                                            const current = form.subjects ?? currentForm.subjects ?? [];
                                            const newSubjects = e.target.checked 
                                                ? [...current, option.id] 
                                                : current.filter(id => id !== option.id);
                                            setForm({ ...form, subjects: newSubjects });
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    {option.label}
                                </label>
                            ))}
                            {subjectOptions.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No subjects available</p>
                            )}
                        </div>
                    </div>
`;

code = code.replace(
  '{/* Guardian Section */}',
  subjectsSection + '\n                    {/* Guardian Section */}'
);

fs.writeFileSync(file, code);
