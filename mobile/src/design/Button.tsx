import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { AR_FONT } from './fonts';
import { usePalette } from './theme';
import { triggerLightHaptic } from '@/lib/colors';
import Icon, { IconName } from '@/components/ui/Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
}: Props) {
  const palette = usePalette();

  const handlePress = () => {
    if (disabled || loading) return;
    triggerLightHaptic();
    onPress();
  };

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: palette.primary,
          border: palette.primary,
          text: palette.onPrimary,
        };
      case 'danger':
        return {
          bg: palette.danger + '18',
          border: palette.danger + '35',
          text: palette.danger,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          border: 'transparent',
          text: palette.text,
        };
      case 'secondary':
      default:
        return {
          bg: palette.surfaceRaised,
          border: palette.surfaceLine,
          text: palette.text,
        };
    }
  };

  const { bg, border, text } = getColors();

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={text} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={text} /> : null}
          <Text style={[styles.text, { color: text }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export default Button;

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontFamily: AR_FONT.bold,
    fontSize: 14,
    includeFontPadding: false,
    textAlign: 'center',
  },
});
