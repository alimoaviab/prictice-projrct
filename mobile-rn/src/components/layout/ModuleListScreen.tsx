/**
 * Reusable module-list screen used by the secondary tabs (Academics, People,
 * Settings, etc.). Each entry routes to a deep module screen — those
 * dedicated screens are added in subsequent passes; for now tapping logs to
 * the console so the navigation never appears broken.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, radius, shadows, spacing, typography } from '@/theme/tokens';

export interface ModuleListItem {
  key: string;
  label: string;
  description?: string;
  icon: IconName;
  accent: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  onPress?: () => void;
}

interface ModuleListScreenProps {
  greeting?: string;
  title: string;
  subtitle?: string;
  items: ModuleListItem[];
}

const tintMap = {
  primary: { bg: colors.primaryLight, fg: colors.primary },
  success: { bg: colors.successLight, fg: colors.success },
  warning: { bg: colors.warningLight, fg: colors.warning },
  error: { bg: colors.errorLight, fg: colors.error },
  neutral: { bg: colors.gray100, fg: colors.gray700 },
} as const;

export function ModuleListScreen({ greeting, title, subtitle, items }: ModuleListScreenProps) {
  return (
    <ScreenContainer scroll>
      <Header greeting={greeting} title={title} subtitle={subtitle} />

      <View style={styles.list}>
        {items.map((item) => {
          const palette = tintMap[item.accent];
          return (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              style={({ pressed }) => [styles.row, shadows.card, pressed && styles.pressed]}
              android_ripple={{ color: colors.gray100 }}
            >
              <View style={[styles.iconWrap, { backgroundColor: palette.bg }]}>
                <Icon name={item.icon} size={20} color={palette.fg} />
              </View>
              <View style={styles.text}>
                <Text style={styles.label} numberOfLines={1}>
                  {item.label}
                </Text>
                {item.description ? (
                  <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <Icon name="chevron-right" size={18} color={colors.gray400} />
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.xl3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  label: { ...typography.bodyMd, fontWeight: '700', color: colors.gray900 },
  description: { ...typography.bodySm, color: colors.gray500, marginTop: 2 },
});
