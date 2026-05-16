import { Alert } from 'react-native';

import { ModuleListScreen, type ModuleListItem } from '@/components/layout/ModuleListScreen';
import { useAuthStore } from '@/store/auth-store';

export default function Settings() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  function confirmLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);
  }

  const items: ModuleListItem[] = [
    { key: 'profile', label: user?.email ?? 'Account', description: 'Profile & preferences', icon: 'shield', accent: 'primary' },
    { key: 'academic-year', label: 'Academic Year', description: 'Switch active year', icon: 'calendar', accent: 'success' },
    { key: 'school', label: 'School Profile', description: 'Branding & contact info', icon: 'graduation', accent: 'primary' },
    { key: 'roles', label: 'Roles & Access', description: 'Permissions matrix', icon: 'users', accent: 'primary' },
    { key: 'subscription', label: 'Subscription', description: 'Plan & billing', icon: 'wallet', accent: 'success' },
    { key: 'notifications', label: 'Notifications', description: 'Email, SMS, push', icon: 'bell', accent: 'warning' },
    { key: 'logout', label: 'Sign Out', description: 'End your session', icon: 'logout', accent: 'error', onPress: confirmLogout },
  ];

  return (
    <ModuleListScreen
      greeting="Configuration"
      title="Settings"
      subtitle="Workspace, account and preferences"
      items={items}
    />
  );
}
