import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Easing } from 'react-native-reanimated';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { formatDinar } from '@/lib/money';
import { AR_FONT } from './fonts';
import { DUR, EASE } from './motion';
import { usePalette } from './theme';

/* الحركة المعتمدة (2) بتعديل المالك: تحوّل ناعم 200ms بلا قلب 180°.
   الطبقتان (سعر/عداد) تتبادلان بتلاشٍ سريع على نفس البصمة (عرض/ارتفاع ثابتان). */

interface Props {
  price: number;
  /** 0 = غير مضافة (بصمة السعر — تضيف)، والغير ذلك = عداد +/− */
  quantity: number;
  disabled?: boolean;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  /** بصمة مصغرة لصفوف الكتالوج 72dp */
  compact?: boolean;
}

/** زر السعر lime — بصمة السعر تضيف للسلة، وبعد الإضافة يتحول نعماً إلى عداد +/− */
export function PriceButton({
  price,
  quantity,
  disabled,
  onAdd,
  onIncrement,
  onDecrement,
  compact,
}: Props) {
  const palette = usePalette();
  const inCart = quantity > 0;
  /* نبضة تأكيد على مفاتيح الحالة */
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const tap = (fn: () => void) => () => {
    pulse.value = 1;
    pulse.value = withTiming(1.06, { duration: DUR.press, easing: EASE.signature });
    pulse.value = withTiming(1, { duration: DUR.quick, easing: EASE.signature });
    fn();
  };

  const h = compact ? 30 : 36;

  return (
    <Animated.View
      style={[
        pulseStyle,
        {
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: palette.accent,
          height: h,
        },
      ]}
    >
      {inCart ? (
        <Animated.View
          key="stepper"
          entering={FadeIn.duration(DUR.quick).easing(EASE.signature)}
          exiting={FadeOut.duration(DUR.quick).easing(EASE.signature)}
          layout={Layout.duration(DUR.quick).easing(Easing.bezier(0.18, 0.7, 0.25, 1))}
          style={[styles.stage, compact && styles.stageCompact]}
        >
          <Pressable
            onPress={tap(onDecrement)}
            hitSlop={6}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="إنقاص الكمية"
            style={[styles.stepBtn, compact && styles.stepBtnCompact]}
          >
            <Text style={styles.stepTxt}>−</Text>
          </Pressable>
          <Text style={[styles.qty, { color: palette.onAccent }, compact && styles.qtyCompact]}>
            {quantity}
          </Text>
          <Pressable
            onPress={tap(onIncrement)}
            hitSlop={6}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="زيادة الكمية"
            style={[styles.stepBtn, compact && styles.stepBtnCompact]}
          >
            <Text style={styles.stepTxt}>+</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View
          key="price"
          entering={FadeIn.duration(DUR.quick).easing(EASE.signature)}
          exiting={FadeOut.duration(DUR.quick).easing(EASE.signature)}
          layout={Layout.duration(DUR.quick).easing(Easing.bezier(0.18, 0.7, 0.25, 1))}
        >
          <Pressable
            onPress={tap(onAdd)}
            hitSlop={6}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`أضف للسلة — ${formatDinar(price)}`}
            style={[styles.stage, compact && styles.stageCompact]}
          >
            <Text style={[styles.price, { color: palette.onAccent }, compact && styles.priceCompact]}>
              {formatDinar(price)}
            </Text>
          </Pressable>
        </Animated.View>
      )}
      {/* طبقة كبسولة ثابتة للحد */}
      <View pointerEvents="none" style={[styles.rim, { height: h }]} />
    </Animated.View>
  );
}

export default PriceButton;

const styles = StyleSheet.create({
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    paddingHorizontal: 10,
    gap: 4,
  },
  stageCompact: {
    height: 30,
    paddingHorizontal: 8,
    gap: 2,
  },
  price: {
    fontFamily: AR_FONT.bold,
    fontSize: 13.5,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0,
    includeFontPadding: false,
    minWidth: 48,
    textAlign: 'center',
  },
  priceCompact: {
    fontSize: 12,
    minWidth: 42,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnCompact: {
    width: 24,
    height: 24,
  },
  stepTxt: {
    fontSize: 15,
    lineHeight: 18,
    includeFontPadding: false,
  },
  qty: {
    fontFamily: AR_FONT.bold,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    minWidth: 22,
    textAlign: 'center',
    includeFontPadding: false,
  },
  qtyCompact: {
    fontSize: 12,
    minWidth: 18,
  },
  rim: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    borderWidth: 1,
    borderRadius: 999,
    borderColor: 'rgba(31, 36, 29, 0.16)',
  },
});
