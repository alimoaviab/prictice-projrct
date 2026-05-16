import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, typography } from '@/theme/tokens';

interface QuickActionProps {
  label: string;
  description?: string;
  icon: React.ReactNode;
  onPress?: () => void;
  accent?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
}

const tintMap = {
  primary: colors.primaryLight,
  success: colors.successLight,
  warning: colors.warningLight,
  error: colors.errorLight,
  neutral: colors.gray100,
} as const;

export function QuickAction({
  label,
  description,
  icon,
  onPress,
  accent = 'primary',
}: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.gray100 }}
      style={({ pressed }) => [styles.card, shadows.card, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tintMap[accent] }]}>{icon}</View>
      <View style={styles.text}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  label: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.gray900,
  },
  description: {
    ...typography.bodySm,
    color: colors.gray500,
  },
});
