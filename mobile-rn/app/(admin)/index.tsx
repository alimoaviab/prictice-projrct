/**
 * Admin Dashboard — entry surface for the entire admin portal.
 *
 * The mobile dashboard groups the desktop's many widgets into three scannable
 * blocks: at-a-glance KPIs, quick actions, and a module grid that exposes
 * every module from the spec (AI Copilot, Academic Care, Classes, Timetable,
 * Attendance, Exams, Tests, Results, Live Classes, Homework, Behavior,
 * Teacher Leave, Events, Fees, Parent Connect, Settings).
 *
 * Real data wiring lands in subsequent passes; for now the KPIs read from
 * placeholders that are easy to swap to TanStack Query once the
 * `/dashboards/admin` endpoint is wired up.
 */

import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Icon, type IconName } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { Header } from '@/components/layout/Header';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useAuthStore } from '@/store/auth-store';
import { colors, radius, shadows, spacing, typography } from '@/theme/tokens';

interface ModuleEntry {
  key: string;
  label: string;
  icon: IconName;
  accent: 'primary' | 'success' | 'warning' | 'error';
  description: string;
}

const MODULES: ModuleEntry[] = [
  { key: 'ai-copilot',     label: 'AI Copilot',     icon: 'sparkles',      accent: 'primary', description: 'Insights & assistant' },
  { key: 'academic-care',  label: 'Academic Care',  icon: 'book',          accent: 'success', description: 'At-risk students' },
  { key: 'classes',        label: 'Classes',        icon: 'graduation',    accent: 'primary', description: 'Sections & batches' },
  { key: 'timetable',      label: 'Timetable',      icon: 'calendar',      accent: 'success', description: 'Schedules' },
  { key: 'attendance',     label: 'Attendance',     icon: 'check-circle',  accent: 'success', description: 'Daily marking' },
  { key: 'exams',          label: 'Exams',          icon: 'clipboard',     accent: 'warning', description: 'Term exams' },
  { key: 'tests',          label: 'Tests',          icon: 'clipboard',     accent: 'warning', description: 'Class tests' },
  { key: 'results',        label: 'Results',        icon: 'star',          accent: 'success', description: 'Grades & marksheets' },
  { key: 'live-classes',   label: 'Live Classes',   icon: 'video',         accent: 'primary', description: 'Online sessions' },
  { key: 'homework',       label: 'Homework',       icon: 'book',          accent: 'primary', description: 'Assignments' },
  { key: 'behavior',       label: 'Student Behavior', icon: 'shield',      accent: 'warning', description: 'Discipline notes' },
  { key: 'leave',          label: 'Teacher Leave',  icon: 'clock',         accent: 'warning', description: 'Approvals' },
  { key: 'events',         label: 'Events',         icon: 'megaphone',     accent: 'primary', description: 'School calendar' },
  { key: 'fees',           label: 'Fee & Subscription', icon: 'wallet',    accent: 'success', description: 'Billing' },
  { key: 'parent-connect', label: 'Parent Connect', icon: 'family',        accent: 'primary', description: 'Parent comms' },
  { key: 'settings',       label: 'Settings',       icon: 'settings',      accent: 'primary', description: 'Configuration' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);

  function onRefresh() {
    setRefreshing(true);
    // Real refresh hook lands when /dashboards/admin is wired in.
    setTimeout(() => setRefreshing(false), 600);
  }

  return (
    <ScreenContainer flush>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.padded}>
          <Header
            greeting="Welcome back"
            title="Admin Console"
            subtitle={user?.email ?? 'Eduplexo Workspace'}
            right={<NotificationBell />}
          />

          <View style={styles.statsRow}>
            <StatTile
              label="Students"
              value="—"
              accent="primary"
              icon={<Icon name="users" size={20} color={colors.primary} />}
            />
            <StatTile
              label="Teachers"
              value="—"
              accent="success"
              icon={<Icon name="graduation" size={20} color={colors.success} />}
            />
          </View>
          <View style={styles.statsRow}>
            <StatTile
              label="Today's Attendance"
              value="—"
              accent="warning"
              icon={<Icon name="check-circle" size={20} color={colors.warning} />}
            />
            <StatTile
              label="Fees Collected"
              value="—"
              accent="success"
              icon={<Icon name="wallet" size={20} color={colors.success} />}
            />
          </View>

          <SectionTitle title="Quick Actions" />
          <View style={styles.quickRow}>
            <QuickPill
              label="Mark Attendance"
              icon="check-circle"
              onPress={() => router.push('/(admin)/academics' as never)}
            />
            <QuickPill
              label="New Announcement"
              icon="megaphone"
              onPress={() => router.push('/(admin)/people' as never)}
            />
            <QuickPill
              label="Add Student"
              icon="plus"
              onPress={() => router.push('/(admin)/people' as never)}
            />
          </View>

          <SectionTitle title="Modules" subtitle="Tap to open" />
          <View style={styles.moduleGrid}>
            {MODULES.map((m) => (
              <ModuleCard key={m.key} entry={m} />
            ))}
          </View>

          <Card style={styles.aiBanner} padding="lg">
            <View style={styles.aiHeader}>
              <View style={styles.aiIcon}>
                <Icon name="sparkles" size={22} color={colors.white} />
              </View>
              <View style={styles.aiText}>
                <Text style={styles.aiTitle}>Ask AI Copilot</Text>
                <Text style={styles.aiSubtitle}>
                  Get instant answers about attendance, fees, results, and more.
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitleText}>{subtitle}</Text> : null}
    </View>
  );
}

function QuickPill({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pill, shadows.card, pressed && styles.pressed]}
      android_ripple={{ color: colors.gray100 }}
    >
      <Icon name={icon} size={16} color={colors.primary} />
      <Text style={styles.pillLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function ModuleCard({ entry }: { entry: ModuleEntry }) {
  const tint =
    entry.accent === 'primary'
      ? colors.primaryLight
      : entry.accent === 'success'
        ? colors.successLight
        : entry.accent === 'warning'
          ? colors.warningLight
          : colors.errorLight;
  const stroke =
    entry.accent === 'primary'
      ? colors.primary
      : entry.accent === 'success'
        ? colors.success
        : entry.accent === 'warning'
          ? colors.warning
          : colors.error;

  return (
    <Pressable
      style={({ pressed }) => [styles.moduleCard, shadows.card, pressed && styles.pressed]}
      android_ripple={{ color: colors.gray100 }}
    >
      <View style={[styles.moduleIcon, { backgroundColor: tint }]}>
        <Icon name={entry.icon} size={22} color={stroke} />
      </View>
      <Text style={styles.moduleLabel} numberOfLines={1}>
        {entry.label}
      </Text>
      <Text style={styles.moduleDescription} numberOfLines={1}>
        {entry.description}
      </Text>
    </Pressable>
  );
}

function NotificationBell() {
  return (
    <Pressable style={({ pressed }) => [styles.bell, pressed && styles.pressed]}>
      <Icon name="bell" size={20} color={colors.gray700} />
      <View style={styles.bellDot} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl3 },
  padded: { paddingHorizontal: spacing.base },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.md, gap: 2 },
  sectionTitleText: { ...typography.h4, color: colors.gray900 },
  sectionSubtitleText: { ...typography.bodySm, color: colors.gray500 },

  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pillLabel: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.gray800,
  },

  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  moduleCard: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 10,
  },
  moduleIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleLabel: { ...typography.bodyMd, fontWeight: '700', color: colors.gray900 },
  moduleDescription: { ...typography.bodySm, color: colors.gray500 },

  aiBanner: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiText: { flex: 1 },
  aiTitle: { ...typography.h4, color: colors.white },
  aiSubtitle: { ...typography.bodySm, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  bell: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.white,
  },

  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
});
