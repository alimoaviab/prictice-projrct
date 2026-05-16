import { Alert } from 'react-native';

import { ModuleListScreen, type ModuleListItem } from '@/components/layout/ModuleListScreen';
import { useAuthStore } from '@/store/auth-store';

export default function StudentProfile() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function confirmLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);
  }

  const items: ModuleListItem[] = [
    { key: 'profile', label: user?.email ?? 'Account', description: 'Profile & preferences', icon: 'shield', accent: 'primary' },
    { key: 'children', label: 'Linked Children', description: 'Switch active child', icon: 'family', accent: 'primary' },
    { key: 'notifications', label: 'Notifications', description: 'Email, SMS, push', icon: 'bell', accent: 'warning' },
    { key: 'logout', label: 'Sign Out', description: 'End your session', icon: 'logout', accent: 'error', onPress: confirmLogout },
  ];

  return (
    <ModuleListScreen
      greeting="Account"
      title="Profile"
      subtitle="Preferences and settings"
      items={items}
    />
  );
}
