import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, shadows, spacing } from '@/theme/tokens';

interface CardProps extends ViewProps {
  variant?: 'default' | 'flat';
  padding?: keyof typeof spacing;
}

export function Card({
  variant = 'default',
  padding = 'lg',
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { padding: spacing[padding] },
        variant === 'default' && shadows.card,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
});
