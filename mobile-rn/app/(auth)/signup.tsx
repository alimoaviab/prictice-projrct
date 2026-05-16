/**
 * Mobile signup — sends the same JSON body shape as the web signup so the
 * Go backend handler stays unchanged. Mobile keeps the form lighter than
 * desktop: account fields up front, institution profile only when the
 * Admin tab is selected.
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

import { api } from '@/api/client';
import { RoleTabs } from '@/components/auth/RoleTabs';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { colors, radius, shadows, spacing, typography } from '@/theme/tokens';
import type { LoginRole } from '@/types/auth';

interface SignupForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  schoolCode: string;
  schoolName: string;
  principalName: string;
  city: string;
}

const initial: SignupForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  schoolCode: '',
  schoolName: '',
  principalName: '',
  city: '',
};

export default function SignupScreen() {
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>('admin');
  const [form, setForm] = useState<SignupForm>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof SignupForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  }

  async function handleSubmit() {
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (role === 'admin' && (!form.schoolName || !form.principalName || !form.city)) {
      setError('School name, principal, and city are required for admin signup.');
      return;
    }
    if (role !== 'admin' && !form.schoolCode) {
      setError('Enter the access code your school provided.');
      return;
    }

    setLoading(true);
    setError(null);

    const body =
      role === 'admin'
        ? {
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            confirmPassword: form.confirmPassword,
            phone: form.phone,
            role,
            schoolName: form.schoolName,
            principalName: form.principalName,
            city: form.city,
          }
        : {
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            confirmPassword: form.confirmPassword,
            phone: form.phone,
            role,
            schoolCode: form.schoolCode,
          };

    const result = await api.post<{ ok: boolean }>('/auth/signup', body);
    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? "We couldn't create your account.");
      return;
    }
    router.replace('/(auth)/login');
  }

  const isAdmin = role === 'admin';

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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>JOIN THE EDUPLEXO NETWORK</Text>
          </View>

          <RoleTabs value={role} onChange={setRole} />

          <View style={styles.form}>
            <Input
              label="FULL LEGAL NAME"
              placeholder="Johnathan Doe"
              value={form.fullName}
              onChangeText={(v) => update('fullName', v)}
              autoCapitalize="words"
            />
            <Input
              label="WORK EMAIL"
              placeholder="name@school.com"
              value={form.email}
              onChangeText={(v) => update('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="PHONE NUMBER"
              placeholder="+92 300 1234567"
              value={form.phone}
              onChangeText={(v) => update('phone', v)}
              keyboardType="phone-pad"
            />
            <Input
              label="PASSWORD"
              placeholder="••••••••"
              value={form.password}
              onChangeText={(v) => update('password', v)}
              passwordToggle
            />
            <Input
              label="CONFIRM PASSWORD"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChangeText={(v) => update('confirmPassword', v)}
              passwordToggle
            />

            {!isAdmin ? (
              <Input
                label="ACCESS CODE"
                placeholder="SCH-XXXX"
                value={form.schoolCode}
                onChangeText={(v) => update('schoolCode', v.toUpperCase())}
                autoCapitalize="characters"
              />
            ) : (
              <>
                <Input
                  label="SCHOOL / INSTITUTION NAME"
                  placeholder="Eduplexo Academy"
                  value={form.schoolName}
                  onChangeText={(v) => update('schoolName', v)}
                />
                <Input
                  label="PRINCIPAL NAME"
                  placeholder="Dr. Aisha Khan"
                  value={form.principalName}
                  onChangeText={(v) => update('principalName', v)}
                />
                <Input
                  label="CITY"
                  placeholder="Karachi"
                  value={form.city}
                  onChangeText={(v) => update('city', v)}
                />
              </>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Icon name="shield" size={18} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              label={loading ? 'Creating…' : 'Register Profile'}
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
            <Text style={styles.footerText}>Already part of the family? </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={8}>
              <Text style={styles.footerLink}>Sign In</Text>
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
  title: { ...typography.h1, color: colors.gray900 },
  subtitle: { ...typography.labelXs, color: colors.gray400, letterSpacing: 1.5 },
  form: { gap: spacing.lg },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.errorLight,
  },
  errorText: { flex: 1, ...typography.bodySm, color: colors.error, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: { ...typography.bodyMd, color: colors.gray400, fontWeight: '700' },
  footerLink: {
    ...typography.bodyMd,
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
