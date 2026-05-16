/**
 * Mobile login screen — matches the web Login experience.
 *
 * Flow:
 *   1. Pick a role tab (Admin / Teacher / Parent Portal).
 *   2. Submit email + password to POST /api/auth/login.
 *   3. On success, the auth store decodes the JWT and the root router
 *      redirects to the role-specific home screen.
 *
 * Animations stay subtle on mobile — RN doesn't have framer-motion's
 * layout animation, so we use Reanimated's spring transition on the
 * active tab indicator instead. (Implemented in RoleTabs.)
 */

import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { RoleTabs } from '@/components/auth/RoleTabs';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth-store';
import { colors, radius, shadows, spacing, typography } from '@/theme/tokens';
import type { LoginRole, Role } from '@/types/auth';

const ROLE_HOME: Record<Role, string> = {
  admin: '/(admin)',
  super_admin: '/(admin)',
  teacher: '/(teacher)',
  parent: '/(student)',
  student: '/(student)',
};

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const storeError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [role, setRole] = useState<LoginRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const errorMessage = localError ?? storeError;

  async function handleSubmit() {
    setLocalError(null);
    clearError();

    if (!email.trim() || !password) {
      setLocalError('Please enter your email and password.');
      return;
    }

    const result = await login({ email: email.trim(), password, role });
    if (!result.ok) return;

    const target = ROLE_HOME[result.role ?? role] ?? '/(admin)';
    router.replace(target as never);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, shadows.floating]}>
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Image
                source={require('@assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>LOG IN TO CONTINUE</Text>
          </View>

          <RoleTabs value={role} onChange={setRole} />

          <View style={styles.form}>
            <Input
              label="EMAIL ADDRESS"
              placeholder="name@school.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (localError) setLocalError(null);
              }}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              importantForAutofill="yes"
              returnKeyType="next"
            />

            <Input
              label="PASSWORD"
              placeholder="••••••••"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (localError) setLocalError(null);
              }}
              passwordToggle
              autoComplete="password"
              textContentType="password"
              importantForAutofill="yes"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Icon name="shield" size={18} color={colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Button
              label={loading ? 'Signing in…' : 'Sign In'}
              onPress={handleSubmit}
              loading={loading}
              size="lg"
              fullWidth
              iconRight={
                !loading ? <Icon name="arrow-right" size={18} color={colors.white} /> : undefined
              }
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New here? </Text>
            <Pressable onPress={() => router.push('/(auth)/signup')} hitSlop={8}>
              <Text style={styles.footerLink}>Create Account</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xl2,
    backgroundColor: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl2,
    borderWidth: 1,
    borderColor: colors.gray100,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  header: { alignItems: 'center', gap: 6 },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  logoImage: { width: '100%', height: '100%' },
  title: {
    ...typography.h1,
    color: colors.gray900,
  },
  subtitle: {
    ...typography.labelXs,
    color: colors.gray400,
    letterSpacing: 1.5,
  },
  form: { gap: spacing.lg },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.errorLight,
  },
  errorText: {
    flex: 1,
    ...typography.bodySm,
    color: colors.error,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  footerText: { ...typography.bodyMd, color: colors.gray400, fontWeight: '700' },
  footerLink: {
    ...typography.bodyMd,
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
