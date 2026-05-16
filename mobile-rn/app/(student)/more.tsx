import { ModuleListScreen, type ModuleListItem } from '@/components/layout/ModuleListScreen';

const ITEMS: ModuleListItem[] = [
  { key: 'fees', label: 'Fee Charges', description: 'Pay or view dues', icon: 'wallet', accent: 'success' },
  { key: 'events', label: 'Events', description: 'School calendar', icon: 'megaphone', accent: 'primary' },
  { key: 'announcements', label: 'Announcements', description: 'Notices from school', icon: 'bell', accent: 'warning' },
];

export default function StudentMore() {
  return (
    <ModuleListScreen
      greeting="Updates"
      title="More"
      subtitle="Fees, events and notices"
      items={ITEMS}
    />
  );
}
