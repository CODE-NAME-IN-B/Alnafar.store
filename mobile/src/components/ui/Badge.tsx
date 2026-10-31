import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { FONT } from '@/lib/fonts';
import { colors } from '@/lib/colors';

export type BadgeTone =
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'ps4'
  | 'ps5';

interface Props {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
}

const TONE_MAP: Record<BadgeTone, { bg: string; text: string }> = {
  brand: { bg: colors.brandSoft, text: colors.brandLight },
  success: { bg: colors.successSoft, text: '#4ade80' },
  warning: { bg: colors.warningSoft, text: '#fbbf24' },
  danger: { bg: colors.dangerSoft, text: '#fca5a5' },
  neutral: { bg: 'rgba(148, 163, 184, 0.14)', text: colors.dim },
  ps4: { bg: 'rgba(14, 165, 233, 0.22)', text: '#7dd3fc' },
  ps5: { bg: 'rgba(168, 85, 247, 0.22)', text: '#d8b4fe' },
};

export function Badge({ label, tone = 'neutral', style }: Props) {
  const palette = TONE_MAP[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }, style]}>
      <Text style={[styles.text, { color: palette.text }]} numberOfLines={1}>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FONT.bold,
    fontSize: 11,
    letterSpacing: 0,
    includeFontPadding: false,
  },
});
