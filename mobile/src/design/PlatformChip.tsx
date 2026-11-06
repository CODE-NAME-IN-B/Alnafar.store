import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { triggerLightHaptic } from '@/lib/colors';
import { AR_FONT } from './fonts';
import { usePalette } from './theme';

interface Props {
  /** «فور» / «فايف» / أي تصنيف نصي */
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * PlatformChip — pill رفيع لتسمية المنصة (§5). قرار §12.4: المنصات
 * بلا ألوان هوية — النشط يحمل خلفية primary معكوسة (forest/light · lime/dark).
 */
export function PlatformChip({ label, active, onPress, style }: Props) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      onPressIn={() => onPress && triggerLightHaptic()}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
      style={[
        styles.chip,
        {
          backgroundColor: active ? palette.primary : 'transparent',
          borderColor: active ? 'transparent' : palette.surfaceLine,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.txt,
          { color: active ? palette.onPrimary : palette.textSub, fontFamily: active ? AR_FONT.bold : AR_FONT.medium },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default PlatformChip;

const styles = StyleSheet.create({
  chip: {
    minHeight: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txt: {
    fontSize: 12.5,
    letterSpacing: 0,
    includeFontPadding: false,
    textAlign: 'center',
  },
});
