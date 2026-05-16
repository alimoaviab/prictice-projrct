import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme/tokens';

interface HeaderProps {
  greeting?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function Header({ greeting, title, subtitle, right }: HeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        {greeting ? <Text style={styles.greeting}>{greeting}</Text> : null}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  text: { flex: 1, gap: 2 },
  greeting: {
    ...typography.bodySm,
    color: colors.gray500,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    ...typography.h2,
    color: colors.gray900,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.gray500,
  },
  right: { flexShrink: 0 },
});
