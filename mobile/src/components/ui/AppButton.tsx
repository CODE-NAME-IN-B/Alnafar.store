import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Icon, { IconName } from './Icon';
import { FONT } from '@/lib/fonts';
import { colors, tokens, triggerLightHaptic } from '@/lib/colors';
import { ROW } from '@/lib/rtl';

export type ButtonVariant =
  | 'primary'
  | 'tonal'
  | 'secondary'
  | 'tertiary'
  | 'ghost'
  | 'danger'
  | 'icon';

interface Props {
  label?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  badgeCount?: number;
  accessibilityLabel?: string;
  style?: ViewStyle;
  testID?: string;
}

const PALETTES: Record<
  ButtonVariant,
  { bg: string; border: string; text: string; borderWidth: number }
> = {
  primary: {
    bg: colors.brand,
    border: colors.brandLight,
    text: colors.brandDark,
    borderWidth: 0,
  },
  tonal: {
    bg: colors.brandSoft,
    border: 'transparent',
    text: colors.brandLight,
    borderWidth: 0,
  },
  secondary: {
    bg: colors.brandSoft,
    border: 'transparent',
    text: colors.brandLight,
    borderWidth: 0,
  },
  tertiary: {
    bg: 'transparent',
    border: 'transparent',
    text: colors.dim,
    borderWidth: 0,
  },
  ghost: {
    bg: 'transparent',
    border: 'transparent',
    text: colors.dim,
    borderWidth: 0,
  },
  danger: {
    bg: colors.dangerSoft,
    border: 'transparent',
    text: '#fca5a5',
    borderWidth: 0,
  },
  icon: {
    bg: colors.elevated,
    border: colors.borderSubtle,
    text: colors.text,
    borderWidth: 1,
  },
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  badgeCount,
  accessibilityLabel,
  style,
  testID,
}: Props) {
  const isDisabled = disabled || loading;
  const palette = PALETTES[variant];
  const isIconOnly = variant === 'icon' || (!label && Boolean(icon));

  const handlePress = () => {
    triggerLightHaptic();
    onPress();
  };

  return (
    <Pressable
      testID={testID}
      disabled={isDisabled}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        isIconOnly ? styles.iconCircle : styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: palette.borderWidth,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : isIconOnly ? (
        <View style={styles.iconInner}>
          {icon ? <Icon name={icon} size={20} color={palette.text} /> : null}
          {badgeCount && badgeCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {badgeCount > 99 ? '99+' : badgeCount}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={18} color={palette.text} /> : null}
          {label ? (
            <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

export { AppButton as Button };
export default AppButton;

const styles = StyleSheet.create({
  base: {
    minHeight: tokens.touch.button,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: tokens.radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: colors.brand,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: FONT.bold,
    color: colors.brandDark,
    fontSize: 10,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  content: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontFamily: FONT.bold,
    fontSize: 14.5,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
    textAlign: 'center',
  },
});
