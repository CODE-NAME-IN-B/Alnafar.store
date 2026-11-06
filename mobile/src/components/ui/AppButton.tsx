import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Icon, { IconName } from './Icon';
import { ScalePressable } from './motion';
import { FONT } from '@/lib/fonts';
import { colors, tokens, triggerLightHaptic } from '@/lib/colors';
import { ROW } from '@/lib/rtl';
import { usePalette } from '@/design/theme';
import { TYPE } from '@/design/type';

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

/** لواحق كل variant من الرموز الدلالية — فاتح/داكن بنفس الأسماء */
const useVariant = (variant: ButtonVariant) => {
  const p = usePalette();
  switch (variant) {
    case 'primary':
      return { bg: p.primary, border: 'transparent' as const, text: p.onPrimary, bw: 0 };
    case 'tonal':
      return { bg: p.surfaceRaised, border: 'transparent' as const, text: p.text, bw: 0 };
    case 'secondary':
      return { bg: 'transparent' as const, border: p.surfaceLine, text: p.text, bw: 1 };
    case 'tertiary':
      return { bg: 'transparent' as const, border: 'transparent' as const, text: p.textSub, bw: 0 };
    case 'ghost':
      return { bg: 'transparent' as const, border: 'transparent' as const, text: p.textSub, bw: 0 };
    case 'danger':
      return { bg: 'transparent' as const, border: p.danger, text: p.danger, bw: 1 };
    case 'icon':
    default:
      return { bg: p.surface, border: p.surfaceLine, text: p.text, bw: 1 };
  }
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
  const palette = useVariant(variant);
  const isIconOnly = variant === 'icon' || (!label && Boolean(icon));

  const handlePress = () => {
    triggerLightHaptic();
    onPress();
  };

  return (
    <ScalePressable
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
          borderWidth: palette.bw,
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
            <Text
              style={[
                styles.label,
                { color: palette.text },
                badgeCount && badgeCount > 0 ? { minWidth: 64 } : null,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          ) : null}
          {badgeCount && badgeCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {badgeCount > 99 ? '99+' : badgeCount}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </ScalePressable>
  );
}

export default AppButton;

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    flexDirection: ROW,
  },
  content: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
  },
  label: {
    ...TYPE.label,
    fontFamily: FONT.bold,
    fontSize: 15,
    lineHeight: 22,
  },
  badge: {
    backgroundColor: colors.success,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#0f1d17',
  },
});
