import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { FONT } from '@/lib/fonts';
import { colors, tokens, triggerLightHaptic } from '@/lib/colors';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  /** محتفظ به للتوافق فقط — لون التفعيل موحّد بلون العلامة الأخضر المزرق */
  accent?: string;
}

export function Chip({ label, active, onPress, style }: Props) {
  const handlePress = () => {
    if (!onPress) return;
    triggerLightHaptic();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
      style={[styles.chip, active ? styles.chipActive : styles.chipIdle, style]}
    >
      <Text
        style={[styles.text, active ? styles.textActive : styles.textIdle]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default Chip;

const styles = StyleSheet.create({
  chip: {
    minHeight: 38,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brandLight,
  },
  chipIdle: {
    backgroundColor: colors.elevated,
    borderColor: colors.borderSubtle,
  },
  text: {
    fontSize: 13,
    letterSpacing: 0,
    includeFontPadding: false,
    textAlign: 'center',
  },
  textActive: {
    fontFamily: FONT.bold,
    color: colors.brandDark,
  },
  textIdle: {
    fontFamily: FONT.semibold,
    color: colors.dim,
  },
});
