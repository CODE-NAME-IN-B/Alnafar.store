import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AR_FONT } from './fonts';
import { usePalette } from './theme';

export type StatusTone =
  | 'pending' /* برتقالي تعليق */
  | 'ready' /* أخضر جاهز */
  | 'delivered'
  | 'cancelled' /* أحمر */
  | 'neutral';

interface ToneSpec {
  colorKey: 'success' | 'warning' | 'danger' | 'muted';
}

/* نقطة بلون دلالي + كلمة نص بلون النص (§5 StatusBadge) — الحد الجانبي
   لبطاقة الإيصال يتبع الحالة (3dp) */

const TONES: Record<StatusTone, ToneSpec> = {
  pending: { colorKey: 'warning' },
  ready: { colorKey: 'success' },
  delivered: { colorKey: 'success' },
  cancelled: { colorKey: 'danger' },
  neutral: { colorKey: 'muted' },
};

interface Props {
  label: string;
  tone: StatusTone;
  style?: ViewStyle;
}

export function StatusBadge({ label, tone, style }: Props) {
  const palette = usePalette();
  const spec = TONES[tone];
  const dotColor =
    spec.colorKey === 'muted'
      ? palette.textFaint
      : spec.colorKey === 'warning'
        ? palette.warning
        : spec.colorKey === 'danger'
          ? palette.danger
          : palette.success;

  return (
    <View style={[styles.row, style]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text numberOfLines={1} style={[styles.txt, { color: palette.textSub }]}>
        {label}
      </Text>
    </View>
  );
}

export default StatusBadge;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  txt: {
    fontFamily: AR_FONT.semibold,
    fontSize: 12,
    letterSpacing: 0,
    includeFontPadding: false,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
