import { ModuleListScreen, type ModuleListItem } from '@/components/layout/ModuleListScreen';

const ITEMS: ModuleListItem[] = [
  { key: 'students', label: 'Students', description: 'Profiles, enrollment, history', icon: 'graduation', accent: 'primary' },
  { key: 'teachers', label: 'Teachers', description: 'Faculty roster & assignments', icon: 'users', accent: 'primary' },
  { key: 'parent-connect', label: 'Parent Connect', description: 'Parent communications', icon: 'family', accent: 'primary' },
  { key: 'behavior', label: 'Student Behavior', description: 'Discipline & merit notes', icon: 'shield', accent: 'warning' },
  { key: 'leave', label: 'Teacher Leave', description: 'Leave approvals queue', icon: 'clock', accent: 'warning' },
  { key: 'announcements', label: 'Announcements', description: 'School-wide broadcasts', icon: 'megaphone', accent: 'primary' },
  { key: 'events', label: 'Events', description: 'School calendar & RSVP', icon: 'calendar', accent: 'success' },
  { key: 'fees', label: 'Fees & Subscription', description: 'Billing & payments', icon: 'wallet', accent: 'success' },
];

export default function People() {
  return (
    <ModuleListScreen
      greeting="Community"
      title="People & Comms"
      subtitle="Students, teachers, parents and announcements"
      items={ITEMS}
    />
  );
}
