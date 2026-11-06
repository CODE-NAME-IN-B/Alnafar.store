import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

interface Props {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
}

/** شارة نصف ماليّة: نص دلالي + سطح خفيف — المنصات (PS4/PS5/PC) tone='neutral'
    بحدٍ رفيع (قرار §12.4: لا ألوان هوية للمنصات) */
export function Badge({ label, tone = 'neutral', style }: Props) {
  const palette = usePalette();
  const color =
    tone === 'primary'
      ? palette.textSub
      : tone === 'success'
        ? palette.success
        : tone === 'warning'
          ? palette.warning
          : tone === 'danger'
            ? palette.danger
            : palette.textSub;
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.surface,
          borderColor: palette.surfaceLine,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default Badge;

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: AR_FONT.medium,
    fontSize: 11,
    letterSpacing: 0,
    includeFontPadding: false,
  },
});
