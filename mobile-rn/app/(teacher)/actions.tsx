import { ModuleListScreen, type ModuleListItem } from '@/components/layout/ModuleListScreen';

const ITEMS: ModuleListItem[] = [
  { key: 'attendance', label: 'Attendance', description: 'Mark today\u2019s attendance', icon: 'check-circle', accent: 'success' },
  { key: 'homework', label: 'Homework', description: 'Assign or grade', icon: 'book', accent: 'primary' },
  { key: 'tests', label: 'Tests', description: 'Schedule class tests', icon: 'clipboard', accent: 'warning' },
  { key: 'exams', label: 'Exams', description: 'Term exam schedule', icon: 'clipboard', accent: 'warning' },
  { key: 'results', label: 'Results', description: 'Enter marks', icon: 'star', accent: 'success' },
  { key: 'behavior', label: 'Behavior Notes', description: 'Add discipline / merit notes', icon: 'shield', accent: 'warning' },
  { key: 'leave', label: 'Apply for Leave', description: 'Request time off', icon: 'clock', accent: 'warning' },
  { key: 'events', label: 'Events', description: 'School calendar', icon: 'megaphone', accent: 'primary' },
];

export default function Actions() {
  return (
    <ModuleListScreen
      greeting="Daily Tasks"
      title="Actions"
      subtitle="Mark, grade, and update"
      items={ITEMS}
    />
  );
}
