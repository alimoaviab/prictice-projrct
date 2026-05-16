import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, radius, typography } from '@/theme/tokens';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  rightAdornment?: React.ReactNode;
  /** Renders a built-in show/hide toggle. */
  passwordToggle?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, rightAdornment, passwordToggle, secureTextEntry, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = passwordToggle || secureTextEntry;
  const effectivelySecure = isPassword && !showPassword;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}
      >
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={colors.textPlaceholder}
          secureTextEntry={effectivelySecure}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />

        {passwordToggle ? (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={12}
            style={styles.adornment}
          >
            <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : rightAdornment ? (
          <View style={styles.adornment}>{rightAdornment}</View>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    ...typography.labelXs,
    color: colors.gray400,
    marginLeft: 8,
    textTransform: 'none',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 18,
    backgroundColor: colors.gray50,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fieldFocused: {
    backgroundColor: colors.white,
    borderColor: colors.primary,
  },
  fieldError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.gray900,
    padding: 0,
  },
  adornment: {
    paddingLeft: 8,
  },
  toggleText: {
    ...typography.bodySm,
    color: colors.gray500,
    fontWeight: '700',
  },
  errorText: {
    ...typography.bodySm,
    color: colors.error,
    marginLeft: 8,
  },
});
