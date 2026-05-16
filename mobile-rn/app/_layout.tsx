/**
 * Root layout — installs providers and gates routing on auth hydration.
 *
 * The auth store reads the JWT from secure storage on first mount. Until
 * that finishes we keep the splash screen visible so the user never sees
 * a flash of the login screen when they're already signed in.
 */

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ROLE_HOME: Record<string, string> = {
  admin: '/(admin)',
  super_admin: '/(admin)',
  teacher: '/(teacher)',
  parent: '/(student)',
  student: '/(student)',
};

function ProtectedRouter() {
  const segments = useSegments();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    SplashScreen.hideAsync().catch(() => {});

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (user && inAuthGroup) {
      const home = ROLE_HOME[user.role] ?? '/(admin)';
      router.replace(home as never);
    }
  }, [hydrated, segments, user, router]);

  if (!hydrated) {
    return <View style={styles.boot} />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" backgroundColor={colors.surface} />
          <ProtectedRouter />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
