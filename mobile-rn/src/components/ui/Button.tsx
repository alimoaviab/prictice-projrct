import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';
import { colors, radius, shadows, typography } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const sizeStyle = sizeStyles[size];
  const variantStyle = variantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        sizeStyle.container,
        variantStyle.container,
        variant === 'primary' && shadows.primaryButton,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.text.color} />
      ) : (
        <View style={styles.content}>
          {iconLeft}
          <Text style={[sizeStyle.text, variantStyle.text]}>{label}</Text>
          {iconRight}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.55 },
});

const sizeStyles: Record<Size, { container: object; text: object }> = {
  sm: {
    container: { height: 36, paddingHorizontal: 16 },
    text: { ...typography.bodyMd, fontWeight: '700' },
  },
  md: {
    container: { height: 48, paddingHorizontal: 20 },
    text: { ...typography.bodyLg, fontWeight: '700' },
  },
  lg: {
    container: { height: 56, paddingHorizontal: 24 },
    text: { ...typography.h4, fontWeight: '700' },
  },
};

const variantStyles: Record<Variant, { container: object; text: { color: string } }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    text: { color: colors.white },
  },
  secondary: {
    container: { backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray200 },
    text: { color: colors.gray900 },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.primary },
  },
  danger: {
    container: { backgroundColor: colors.error },
    text: { color: colors.white },
  },
};
