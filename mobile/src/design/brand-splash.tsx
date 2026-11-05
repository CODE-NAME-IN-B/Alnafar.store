import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { EASE } from './motion';

/**
 * BrandSplash — افتتاحية الشعار داخل التطبيق (منفَّذة في الخطوة 2 بقرار المالك)
 *
 * المشهد: خلفية كريمية (استمرارية الـ native splash) يُبنى فيها حرف N
 * الشريحة شريحة (يسار ← يمين ← قطر) ثم يسقط المربعان lime
 * بسلّم، ويقودها المنحنى التوقيعي. هلنة الأخيرة: تلاشٍ سريع يكشف التطبيق.
 *
 * هندسة الشرائح مرآة للسيد `assets/_brand/logo.svg` (وGEO في مولد الأصول)
 * — أي تعديل للشعار يبدأ من السيد ثم يُنقل هنا.
 *
 * القواعد:
 * - reduced motion → ترتلك الفتلة فوراً وينكشف التطبيق مباشرة.
 * - لا تؤخر التطبيق: تُعرض فوقه أثناء التحميل، وتُرفع بعد مشاهد كاملة
 *   (≈1.1s) لا تتغير بحجم الخطوط (المكوّن مستقل عن الـ fonts).
 */

/* ألوان الهوية الثابتة (لا ثيم هنا — الافتتاحية كريمية دائماً) */
const CREAM = '#F5F1E8';
const INK = '#1B2A21';
const LIME = '#C5DE8F';

/* هندسة الرسم (كسور من حاوية ART — مرآة logo.svg) */
const ART = 176;
const GEO = {
  top: 0.175,
  bottom: 0.825,
  l: { x: 0.16, w: 0.215 },
  r: { x: 0.625, w: 0.215, y2: 0.52 },
  /** القطع: قطع علوي/سفلي أفقيان + إمالة skew تحاكي الشرائح الموازية */
  diag: { w: 0.2, h: 0.345, shift: 0.05 },
  a: { x: 0.655, y: 0.52, s: 0.155 },
  b: { x: 0.5, y: 0.675, s: 0.155 },
} as const;

/* إمالة القطع: tan = الإزاحة/الارتفاع — ثابتة مهما كان حجم الفن */
const DIAG_SKEW_DEG = Math.round(
  (Math.atan(GEO.diag.shift / GEO.diag.h) * 180) / Math.PI * 100,
) / 100; // ≈ 8.25deg

/* إزاحة يسار القطع بحيث تلتقي حافتها العليا بـ l اليمين تماماً:
   أعلى-يسار القطع = L0 − (h/2)·tan(α) ⇒ L0 = 0.375 + (0.05/2) = 0.4 */
const DIAG_LEFT = 0.4;

/** زمن العرض الكامل قبل النداء علىDone (مطابقة للتتابع أدناه) */
const TOTAL_MS = 1_080;

const px = (f: number) => Math.round(f * ART);

export function BrandSplash({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const fired = useRef(false);

  /* قيم الأجزاء: 0 = مخفي/مرتز، 1 = في مكانه */
  const left = useSharedValue(0);
  const right = useSharedValue(0);
  const diag = useSharedValue(0);
  const sqA = useSharedValue(0);
  const sqB = useSharedValue(0);
  const veil = useSharedValue(1); /* قناع الإخفاء النهائي */

  useEffect(() => {
    /* reduced motion: لا مشهد — التطبيق فوراً */
    if (reduced) {
      if (!fired.current) {
        fired.current = true;
        onDone();
      }
      return;
    }

    /* الشرائح تُبنى بالتتابع (يسار → يمين → قطر)، ثم المربعان يهبطان سلّماً */
    left.value = withDelay(110, withTiming(1, { duration: 120, easing: EASE.signature }));
    right.value = withDelay(210, withTiming(1, { duration: 120, easing: EASE.signature }));
    diag.value = withDelay(330, withTiming(1, { duration: 120, easing: EASE.signature }));
    sqA.value = withDelay(480, withTiming(1, { duration: 180, easing: EASE.signature }));
    sqB.value = withDelay(570, withTiming(1, { duration: 180, easing: EASE.signature }));
    /* سيناريو ختامي قصير: تلاشٍ ثم نرفع الستار (نداء onDone) */
    veil.value = withDelay(900, withTiming(0, { duration: 180, easing: EASE.signature }));

    const t = setTimeout(() => {
      if (!fired.current) {
        fired.current = true;
        onDone();
      }
    }, TOTAL_MS);    return () => clearTimeout(t);
  }, [reduced, left, right, diag, sqA, sqB, veil, onDone]);

  /* مقابض الحركة */
  const leftStyle = useAnimatedStyle(() => ({
    opacity: left.value,
    transform: [{ translateY: -8 * (1 - left.value) }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    opacity: right.value,
    transform: [{ translateY: -8 * (1 - right.value) }],
  }));
  const diagStyle = useAnimatedStyle(() => ({
    opacity: diag.value,
    transform: [
      /* الإمالة مع حركة الدخول: حركة القطر من أعلى-يسار إلى أسفل-يمين */
      { skewX: `${DIAG_SKEW_DEG}deg` },
      { translateX: -8 * (1 - diag.value) },
      { translateY: -8 * (1 - diag.value) },
    ],
  }));
  const sqAStyle = useAnimatedStyle(() => ({
    opacity: sqA.value,
    transform: [{ translateY: -26 * (1 - sqA.value) }],
  }));
  const sqBStyle = useAnimatedStyle(() => ({
    opacity: sqB.value,
    transform: [{ translateY: -26 * (1 - sqB.value) }],
  }));
  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.value }));

  if (reduced) return null;

  return (
    <Animated.View style={[styles.veil, veilStyle]} pointerEvents="auto">
      {/* فن الشعار: N حبري حاد الأركان + مربعان lime (بلا بلاقة — على الكريمي) */}
      <View style={{ width: ART, height: ART }}>
        <Animated.View
          style={[
            styles.slab,
            {
              left: px(GEO.l.x),
              top: px(GEO.top),
              width: px(GEO.l.w),
              height: px(GEO.bottom - GEO.top),
              backgroundColor: INK,
            },
            leftStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.slab,
            {
              left: px(GEO.r.x),
              top: px(GEO.top),
              width: px(GEO.r.w),
              height: px(GEO.r.y2 - GEO.top),
              backgroundColor: INK,
            },
            rightStyle,
          ]}
        />
        {/* القطع: مستطيل بإمالة skew (تُطبّق داخل diagStyle) — الحواف الأفقية تبقى أفقية */}
        <Animated.View
          style={[
            styles.slab,
            {
              left: px(DIAG_LEFT),
              top: px(GEO.top),
              width: px(GEO.diag.w),
              height: px(GEO.diag.h),
              backgroundColor: INK,
            },
            diagStyle,
          ]}
        />
        {/* المربعان lime — يهبطان سلّماً */}
        <Animated.View
          style={[
            styles.slab,
            {
              left: px(GEO.a.x),
              top: px(GEO.a.y),
              width: px(GEO.a.s),
              height: px(GEO.a.s),
              backgroundColor: LIME,
            },
            sqAStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.slab,
            {
              left: px(GEO.b.x),
              top: px(GEO.b.y),
              width: px(GEO.b.s),
              height: px(GEO.b.s),
              backgroundColor: LIME,
            },
            sqBStyle,
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  veil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 100,
  },
  slab: {
    position: 'absolute',
  },
});
