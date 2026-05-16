import { ModuleListScreen, type ModuleListItem } from '@/components/layout/ModuleListScreen';

const ITEMS: ModuleListItem[] = [
  { key: 'classes', label: 'Classes', description: 'Sections, batches, subject mapping', icon: 'graduation', accent: 'primary' },
  { key: 'timetable', label: 'Timetable', description: 'Weekly schedules per class', icon: 'calendar', accent: 'success' },
  { key: 'attendance', label: 'Attendance', description: 'Daily attendance & analytics', icon: 'check-circle', accent: 'success' },
  { key: 'exams', label: 'Exams', description: 'Term exams & schedules', icon: 'clipboard', accent: 'warning' },
  { key: 'tests', label: 'Tests', description: 'Class tests & quizzes', icon: 'clipboard', accent: 'warning' },
  { key: 'results', label: 'Results', description: 'Marks, marksheets, transcripts', icon: 'star', accent: 'success' },
  { key: 'live-classes', label: 'Live Classes', description: 'Online sessions & recordings', icon: 'video', accent: 'primary' },
  { key: 'homework', label: 'Homework', description: 'Assignments & submissions', icon: 'book', accent: 'primary' },
];

export default function Academics() {
  return (
    <ModuleListScreen
      greeting="Academic Care"
      title="Academics"
      subtitle="Curriculum, schedules and evaluations"
      items={ITEMS}
    />
  );
}
