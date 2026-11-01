import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { FONT } from '@/lib/fonts';
import { colors, tokens, triggerLightHaptic } from '@/lib/colors';

interface Props {
  label: string;
  active?: boolean;
  /** حجم مدمج لأشرطة الفلاتر الكثيفة (لوحة الإدارة) */
  compact?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  /** محتفظ به للتوافق فقط — لون التفعيل موحّد بلون العلامة الأخضر المزرق */
  accent?: string;
}

export function Chip({ label, active, compact, onPress, style }: Props) {
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
      style={[styles.chip, compact ? styles.compact : null, active ? styles.chipActive : styles.chipIdle, style]}
    >
      <Text
        style={[styles.text, compact ? styles.textCompact : null, active ? styles.textActive : styles.textIdle]}
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
  compact: {
    minHeight: 30,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  text: {
    fontSize: 13,
    letterSpacing: 0,
    includeFontPadding: false,
    textAlign: 'center',
  },
  textCompact: {
    fontSize: 12,
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
