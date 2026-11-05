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
 * شريحة شريحة (الس silicon upper ← الذراع اليمنى ← القطر ← الشق السفلي) ثم
 * يسقط المربعان lime بسلّم، ويقودها المنحنى التوقيعي. هللة الأخيرة:
 * تلاشٍ سريع يكشف التطبيق.
 *
 * هندسة الشرائح مرآة للسيد `assets/_brand/logo.svg` (G في مولد الأصول
 * gen_brand3) — أي تعديل للشعار يبدأ من السيد ثم يُنقل هنا.
 *
 * القواعد:
 * - reduced motion → ترتلك الفتلة فوراً وينكشف التطبيق مباشرة.
 * - على الكريمي تظهر الكريمية شرائح حبرية (مقيسة من المرجع) + المربعان lime.
 */

/* ألوان الهوية المقيسة من المرجع (لا ثيم هنا — الافتتاحية كريمية دائماً) */
const CREAM = '#F5F1E8';
const INK = '#1F241D';
const LIME = '#C1D792';

/* هندسة الرسم — مرآة G في logo.svg: İç نفس القيم (0..1000) على ART */
const ART = 176;
const GEO = {
  stemUpper: [179, 199, 366, 402],
  stemLower: [179, 462, 366, 793],
  stemRight: [654, 199, 821, 487],
  diag: [179, 199, 394, 199, 654, 463, 654, 631, 595, 631],
  limeA: [692, 532, 823, 667],
  limeB: [557, 671, 688, 793],
} as const;

/* القطع: شريط مائل 45° (skewX) داخل حاوية قصّ عند حاجة الذراع اليمنى (x=654)
   وأسفل الحرف (y=631) — فتطابق القطع العمودي المقطوع في المرجع تماماً.
   مستطيل الشريط: أعلى y=215 (دون ثغرة الشق العلوية)، ارتفاع إلى 631،
   عرض القطع الأفقي 230، والحواف العمودية تُمِل بمقدار 45°. */
const DIAG_SKEW_DEG = 45;
const DIAG_CLIP = { left: 179, top: 215, w: 475, h: 416 };
/* موضع الشريط داخل القماش: يسار = 179 + h/2 (تعويض الإزاحة حول المركز) */
const DIAG_BAND = { left: 179 + DIAG_CLIP.h / 2, top: 215, w: 230, h: DIAG_CLIP.h };

/** زمن العرض الكامل قبل نداء onDone (مطابق للتتابع أدناه) */
const TOTAL_MS = 1_080;

const px = (f: number) => Math.round((f / 1000) * ART);

export function BrandSplash({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const fired = useRef(false);

  /* قيم الأجزاء: 0 = مخفي/مُزاح، 1 = في مكانه */
  const up = useSharedValue(0);
  const right = useSharedValue(0);
  const diag = useSharedValue(0);
  const down = useSharedValue(0);
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

    /* الشرائح تُبنى بالتتابع (أعلى يسار → ذراع يمين → قطر → أسفل يسار)،
       ثم المربعان يهبطان سلّماً */
    up.value = withDelay(110, withTiming(1, { duration: 120, easing: EASE.signature }));
    right.value = withDelay(210, withTiming(1, { duration: 120, easing: EASE.signature }));
    diag.value = withDelay(330, withTiming(1, { duration: 120, easing: EASE.signature }));
    down.value = withDelay(430, withTiming(1, { duration: 120, easing: EASE.signature }));
    sqA.value = withDelay(560, withTiming(1, { duration: 180, easing: EASE.signature }));
    sqB.value = withDelay(650, withTiming(1, { duration: 180, easing: EASE.signature }));
    /* سيناريو ختامي: تلاشٍ ثم رفع الستار (نداء onDone) */
    veil.value = withDelay(900, withTiming(0, { duration: 180, easing: EASE.signature }));

    const t = setTimeout(() => {
      if (!fired.current) {
        fired.current = true;
        onDone();
      }
    }, TOTAL_MS);
    return () => clearTimeout(t);
  }, [reduced, up, right, diag, down, sqA, sqB, veil, onDone]);

  /* مقابض الحركة */
  const upStyle = useAnimatedStyle(() => ({
    opacity: up.value,
    transform: [{ translateY: -8 * (1 - up.value) }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    opacity: right.value,
    transform: [{ translateY: -8 * (1 - right.value) }],
  }));
  const diagStyle = useAnimatedStyle(() => ({
    opacity: diag.value,
    transform: [
      /* الإمالة مع حركة الدخول قطرياً */
      { skewX: `${DIAG_SKEW_DEG}deg` },
      { translateX: -8 * (1 - diag.value) },
      { translateY: -8 * (1 - diag.value) },
    ],
  }));
  const downStyle = useAnimatedStyle(() => ({
    opacity: down.value,
    transform: [{ translateY: 8 * (1 - down.value) }],
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
      {/* فن الشعار: شرائح حبرية بحاد الأركان + المربعان (بلا بلاقة — على الكريمي) */}
      <View style={{ width: ART, height: ART }}>
        <Animated.View
          style={[
            styles.slab,
            {
              left: px(GEO.stemUpper[0]),
              top: px(GEO.stemUpper[1]),
              width: px(GEO.stemUpper[2] - GEO.stemUpper[0]),
              height: px(GEO.stemUpper[3] - GEO.stemUpper[1]),
              backgroundColor: INK,
            },
            upStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.slab,
            {
              left: px(GEO.stemRight[0]),
              top: px(GEO.stemRight[1]),
              width: px(GEO.stemRight[2] - GEO.stemRight[0]),
              height: px(GEO.stemRight[3] - GEO.stemRight[1]),
              backgroundColor: INK,
            },
            rightStyle,
          ]}
        />
        {/* القطع: شريط 45° داخل حاوية قصّ عند حافة الذراع اليمنى — مطابق للمرجع */}
        <View
          style={{
            position: 'absolute',
            left: px(DIAG_CLIP.left),
            top: px(DIAG_CLIP.top),
            width: px(DIAG_CLIP.w),
            height: px(DIAG_CLIP.h),
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={[
              styles.slab,
              {
                left: px(DIAG_BAND.left - DIAG_CLIP.left),
                top: px(DIAG_BAND.top - DIAG_CLIP.top),
                width: px(DIAG_BAND.w),
                height: px(DIAG_BAND.h),
                backgroundColor: INK,
              },
              diagStyle,
            ]}
          />
        </View>
        <Animated.View
          style={[
            styles.slab,
            {
              left: px(GEO.stemLower[0]),
              top: px(GEO.stemLower[1]),
              width: px(GEO.stemLower[2] - GEO.stemLower[0]),
              height: px(GEO.stemLower[3] - GEO.stemLower[1]),
              backgroundColor: INK,
            },
            downStyle,
          ]}
        />
        {/* المربعان lime يهبطان سلّماً */}
        <Animated.View
          style={[
            styles.slab,
            {
              left: px(GEO.limeA[0]),
              top: px(GEO.limeA[1]),
              width: px(GEO.limeA[2] - GEO.limeA[0]),
              height: px(GEO.limeA[3] - GEO.limeA[1]),
              backgroundColor: LIME,
            },
            sqAStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.slab,
            {
              left: px(GEO.limeB[0]),
              top: px(GEO.limeB[1]),
              width: px(GEO.limeB[2] - GEO.limeB[0]),
              height: px(GEO.limeB[3] - GEO.limeB[1]),
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
