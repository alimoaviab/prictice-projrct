/**
 * Student / Parent Dashboard.
 *
 * Per the spec, parents and students live in the same portal. When a parent's
 * email is linked to multiple children, the linked profiles surface here so
 * the parent can switch between them (the linked-children switcher lands
 * once we wire `/parents/me/children`).
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
  { key: 'timetable',    label: 'Timetable',    icon: 'calendar',     accent: 'success', description: 'Class schedule' },
  { key: 'attendance',   label: 'Attendance',   icon: 'check-circle', accent: 'success', description: 'My attendance' },
  { key: 'homework',     label: 'Homework',     icon: 'book',         accent: 'primary', description: 'Assignments' },
  { key: 'exams',        label: 'Exams',        icon: 'clipboard',    accent: 'warning', description: 'Upcoming exams' },
  { key: 'results',      label: 'Results',      icon: 'star',         accent: 'success', description: 'My grades' },
  { key: 'live-classes', label: 'Live Classes', icon: 'video',        accent: 'primary', description: 'Online sessions' },
  { key: 'fees',         label: 'Fee Charges',  icon: 'wallet',       accent: 'success', description: 'Pay or view dues' },
  { key: 'events',       label: 'Events',       icon: 'megaphone',    accent: 'primary', description: 'School calendar' },
];

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);

  function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }

  const isParent = user?.role === 'parent';

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
            greeting={isParent ? 'Welcome' : 'Hi there'}
            title={isParent ? 'Parent Portal' : 'Student Portal'}
            subtitle={user?.email ?? ''}
          />

          {isParent ? (
            <Card style={styles.childCard}>
              <View style={styles.childRow}>
                <View style={styles.childAvatar}>
                  <Icon name="family" size={22} color={colors.primary} />
                </View>
                <View style={styles.childText}>
                  <Text style={styles.childTitle}>Linked Children</Text>
                  <Text style={styles.childSubtitle}>
                    Children linked to your email will appear here once the parent
                    profile sync runs.
                  </Text>
                </View>
              </View>
            </Card>
          ) : null}

          <View style={styles.statsRow}>
            <StatTile
              label="Attendance"
              value="—"
              accent="success"
              icon={<Icon name="check-circle" size={20} color={colors.success} />}
            />
            <StatTile
              label="Homework Due"
              value="—"
              accent="warning"
              icon={<Icon name="book" size={20} color={colors.warning} />}
            />
          </View>

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

  childCard: { marginBottom: spacing.md },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  childAvatar: {
    width: 48, height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  childText: { flex: 1 },
  childTitle: { ...typography.h4, color: colors.gray900 },
  childSubtitle: { ...typography.bodySm, color: colors.gray500, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },

  sectionTitle: { marginTop: spacing.sm, marginBottom: spacing.md },
  sectionTitleText: { ...typography.h4, color: colors.gray900 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
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
    width: 44, height: 44,
    borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  moduleLabel: { ...typography.bodyMd, fontWeight: '700', color: colors.gray900 },
  moduleDescription: { ...typography.bodySm, color: colors.gray500 },

  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
});
