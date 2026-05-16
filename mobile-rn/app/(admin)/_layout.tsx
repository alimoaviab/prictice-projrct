/**
 * Admin portal layout — bottom-tab navigator.
 *
 * Modules listed in the original spec (Dashboard, AI Copilot, Academic Care,
 * Classes, Timetable, Attendance, Exams, Tests, Results, Live Classes,
 * Homework, Behavior, Teacher Leave, Events, Fees, Parent Connect, Settings)
 * are all reachable from the Dashboard's quick-actions and module grid.
 *
 * The tab bar surfaces only the four most-used destinations; secondary modules
 * live one tap deeper to keep the bar uncluttered on small phones.
 */

import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, typography } from '@/theme/tokens';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarLabelStyle: {
          ...typography.caption,
          fontWeight: '700',
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray100,
          height: 64,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size }) => (
          <Icon name={routeIcon(route.name)} size={size ?? 22} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="academics" options={{ title: 'Academics' }} />
      <Tabs.Screen name="people" options={{ title: 'People' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

function routeIcon(name: string): IconName {
  switch (name) {
    case 'index':
      return 'home';
    case 'academics':
      return 'graduation';
    case 'people':
      return 'users';
    case 'settings':
      return 'settings';
    default:
      return 'home';
  }
}
