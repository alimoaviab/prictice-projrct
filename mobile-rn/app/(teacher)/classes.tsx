import { ModuleListScreen, type ModuleListItem } from '@/components/layout/ModuleListScreen';

const ITEMS: ModuleListItem[] = [
  { key: 'classes', label: 'My Classes', description: 'Sections you teach', icon: 'graduation', accent: 'primary' },
  { key: 'timetable', label: 'Timetable', description: 'This week\u2019s schedule', icon: 'calendar', accent: 'success' },
  { key: 'live-classes', label: 'Live Classes', description: 'Start or join sessions', icon: 'video', accent: 'primary' },
];

export default function Classes() {
  return (
    <ModuleListScreen
      greeting="Teaching"
      title="My Classes"
      subtitle="Schedules and live sessions"
      items={ITEMS}
    />
  );
}
