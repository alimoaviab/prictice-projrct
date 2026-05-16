/**
 * Teacher Dashboard. Surfaces today's schedule + a module grid covering the
 * teacher portal scope: My Classes, Timetable, Attendance, Homework, Tests,
 * Exams, Results, Live Classes, Behavior, Leave, Events.
 */

import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Header } from '@/components/layout/Header';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { StatTile } from '@/components/ui/StatTile';
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
  { key: 'classes',      label: 'My Classes',     icon: 'graduation',   accent: 'primary', description: 'Sections you teach' },
  { key: 'timetable',    label: 'Timetable',      icon: 'calendar',     accent: 'success', description: 'Today\u2019s schedule' },
  { key: 'attendance',   label: 'Attendance',     icon: 'check-circle', accent: 'success', description: 'Mark students' },
  { key: 'homework',     label: 'Homework',       icon: 'book',         accent: 'primary', description: 'Assignments' },
  { key: 'tests',        label: 'Tests',          icon: 'clipboard',    accent: 'warning', description: 'Class tests' },
  { key: 'exams',        label: 'Exams',          icon: 'clipboard',    accent: 'warning', description: 'Term exams' },
  { key: 'results',      label: 'Results',        icon: 'star',         accent: 'success', description: 'Marks entry' },
  { key: 'live-classes', label: 'Live Classes',   icon: 'video',        accent: 'primary', description: 'Online sessions' },
  { key: 'behavior',     label: 'Behavior',       icon: 'shield',       accent: 'warning', description: 'Discipline notes' },
  { key: 'leave',        label: 'My Leave',       icon: 'clock',        accent: 'warning', description: 'Apply / track' },
  { key: 'events',       label: 'Events',         icon: 'megaphone',    accent: 'primary', description: 'School calendar' },
];

export default function TeacherDashboard() {
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);

  function onRefresh() {
    setRefreshing(true);
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
            greeting="Teacher"
            title="Today\u2019s Plan"
            subtitle={user?.email ?? ''}
          />

          <View style={styles.statsRow}>
            <StatTile
              label="Periods Today"
              value="—"
              accent="primary"
              icon={<Icon name="calendar" size={20} color={colors.primary} />}
            />
            <StatTile
              label="Pending Marks"
              value="—"
              accent="warning"
              icon={<Icon name="clipboard" size={20} color={colors.warning} />}
            />
          </View>

          <Card style={styles.scheduleCard}>
            <Text style={styles.scheduleTitle}>Next Period</Text>
            <Text style={styles.scheduleDescription}>
              Tap Classes to view your full timetable. Today\u2019s data appears once
              wired up to the live API.
            </Text>
          </Card>

          <SectionTitle title="Modules" />
          <View style={styles.grid}>
            {MODULES.map((m) => (
              <ModuleCard key={m.key} entry={m} />
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{title}</Text>
    </View>
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

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl3 },
  padded: { paddingHorizontal: spacing.base },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  scheduleCard: { marginBottom: spacing.lg, gap: 6 },
  scheduleTitle: { ...typography.h4, color: colors.gray900 },
  scheduleDescription: { ...typography.bodySm, color: colors.gray500 },

  sectionTitle: { marginTop: spacing.sm, marginBottom: spacing.md },
  sectionTitleText: { ...typography.h4, color: colors.gray900 },

  grid: {
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

  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
});
