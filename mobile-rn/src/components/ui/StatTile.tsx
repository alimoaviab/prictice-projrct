import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, typography } from '@/theme/tokens';

interface StatTileProps {
  label: string;
  value: string | number;
  delta?: string;
  accent?: 'primary' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
}

const accentMap = {
  primary: { bg: colors.primaryLight, text: colors.primary },
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  error: { bg: colors.errorLight, text: colors.error },
} as const;

export function StatTile({ label, value, delta, accent = 'primary', icon }: StatTileProps) {
  const palette = accentMap[accent];
  return (
    <View style={[styles.tile, shadows.card]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: palette.bg }]}>{icon}</View>
      ) : null}
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {delta ? <Text style={[styles.delta, { color: palette.text }]}>{delta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 140,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    ...typography.label,
    color: colors.gray500,
    textTransform: 'uppercase',
  },
  value: {
    ...typography.h2,
    color: colors.gray900,
  },
  delta: {
    ...typography.bodySm,
    fontWeight: '700',
  },
});
