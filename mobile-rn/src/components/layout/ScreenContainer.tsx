import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme/tokens';

interface ScreenContainerProps extends ViewProps {
  scroll?: boolean;
  /** Removes default horizontal padding for full-bleed screens. */
  flush?: boolean;
}

export function ScreenContainer({
  scroll = false,
  flush = false,
  style,
  children,
  ...rest
}: ScreenContainerProps) {
  const inner = (
    <View style={[styles.inner, !flush && styles.padded, style]} {...rest}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl3 },
  inner: { flex: 1 },
  padded: { paddingHorizontal: spacing.base },
});
