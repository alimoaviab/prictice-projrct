import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, typography } from '@/theme/tokens';

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarLabelStyle: { ...typography.caption, fontWeight: '700', marginBottom: 4 },
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
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="academics" options={{ title: 'Academics' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

function routeIcon(name: string): IconName {
  switch (name) {
    case 'index': return 'home';
    case 'academics': return 'graduation';
    case 'more': return 'megaphone';
    case 'profile': return 'settings';
    default: return 'home';
  }
}
