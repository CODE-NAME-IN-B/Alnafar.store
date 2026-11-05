/**
 * motion-library.tsx — الأساسيات الأصلية للحركة في التطبيق
 *
 * مبدأ معتمد (PLAN §2.5 + 01-design-plan §4): موقع التحميل مرجع **هوية وإحساس**
 * فقط (اللون، الخط، المنحنى، الإيقاع) — وليس مصدراً للنسخ. كل مكوّن هنا مبرَّر
 * بمكان محدد يخدمه، وحركات التطبيق الأثرية (§4.2 من الوثيقة) تُلَّف عند موافقتها.
 *
 * جميع التنفيذات: Reanimated worklets على خيط الواجهة (transform/opacity)،
 * مع تحويل reduced motion إلى سلوك فوري.
 */
import React, { useEffect, useState } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { DUR, EASE, SITE } from './motion';
import { isSystemRTL } from '../lib/rtl';

/* ============================================================
 * EntryIn — إيقاع الدخول الأساسي للشاشات والقوائم:
 * fade + slide-up بسلسلة stagger (delay = i * 80ms، 720ms، signature easing).
 * الاستعمال: بطاقات القوائم، مقاطع الشاشة. يبقى ثابتاً مع reduced motion.
 * ============================================================ */

export function EntryIn({
  index = 0,
  style,
  children,
}: {
  /** ترتيب العنصر في السلسلة (0 أول عنصر) */
  index?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const entering = reduced
    ? undefined
    : FadeInDown.duration(DUR.entry)
        .delay(index * DUR.stagger)
        .easing(EASE.signature);
  return (
    <Animated.View style={style} entering={entering}>
      {children}
    </Animated.View>
  );
}

/* ============================================================
 * SignalBeacon — نقطة الحالة النابضة (2.4s):
 * نقطة صلبة + هالة تتنفس (scale 0.94→1.08، opacity). الاستعمال:
 * مؤشر الاتصال بالخادم في ترويسة المتجر، وحالات «جارٍ العمل».
 * بالـ reduced motion: هالة ثابتة شبه شفافة بلا تنفس.
 * ============================================================ */

export function SignalBeacon({
  color,
  size = 8,
  style,
}: {
  /** لون الحالة — يُمرَّر من usePalette (لا لون افتراضي مخفي) */
  color: string;
  size?: number;
  style?: ViewStyle;
}) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: Math.round(SITE.beaconPeriod / 2),
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: Math.round(SITE.beaconPeriod / 2),
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
  }, [reduced, pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.28, 0.55]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.94, 1.08]) }],
  }));

  const ring = Math.round(size * 2.6);
  const dot = Math.round(size);

  return (
    <View
      pointerEvents="none"
      style={[
        { width: ring, height: ring, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <Animated.View
        style={[
          haloStyle,
          {
            position: 'absolute',
            width: ring,
            height: ring,
            borderRadius: ring / 2,
            backgroundColor: color,
          },
        ]}
      />
      <View
        style={{
          width: dot,
          height: dot,
          borderRadius: dot / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/* ============================================================
 * AnimatedUnderline — خط التفعيل للروابط/التبويبات:
 * يثبت من حده البديل (من اليمين في RTL، من اليسار في LTR) — 200ms signature.
 * الاستعمال: تبويب نشط في صف تبويبات، رابط مختار.
 * ============================================================ */

export function AnimatedUnderline({
  active,
  color,
  height = 2,
  style,
}: {
  active: boolean;
  /** لون الخط من usePalette */
  color: string;
  height?: number;
  style?: ViewStyle;
}) {
  const reduced = useReducedMotion();
  const [measured, setMeasured] = useState(0);
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: DUR.quick,
      easing: EASE.signature,
    });
  }, [active, progress]);

  // يثبت الحد البديل: RTL يرسو يميناً، LTR يساراً (scaleX حول المنتصف + إزاحة تعويضية)
  const dir = isSystemRTL ? 1 : -1;
  const barStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(progress.value, [0, 1], [dir * measured * 0.5, 0]),
        },
        { scaleX: interpolate(progress.value, [0, 1], [0, 1]) },
      ],
    };
  });

  if (reduced) {
    // سلوك فوري: ظاهر/مختفٍ بدون انيميشن
    return (
      <View pointerEvents="none" style={[{ height }, style]}>
        <View
          style={{
            height,
            backgroundColor: active ? color : 'transparent',
            borderRadius: height / 2,
          }}
        />
      </View>
    );
  }

  return (
    <View
      pointerEvents="none"
      style={[{ height }, style]}
      onLayout={(e) => setMeasured(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[
          barStyle,
          {
            height,
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

/* ============================================================
 * useFloatMotion — طفو خفيف للعنصر البطل (شاشة الترحيب حصراً):
 * translateY 4→−8 و rotate ±2° بدورة 4.3s متوازنة (نصف اتجاه 2.15s).
 * مبرراته فقط: mockup الهاتف في hero شاشة الترحيب. أي استعمال آخر ممنوع
 * (PLAN §5: الحركة تخدم هدفاً).
 * ============================================================ */

export function useFloatMotion(enabled = true) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduced || !enabled) {
      t.value = 0;
      return;
    }
    t.value = withRepeat(
      withSequence(
        withTiming(1, { duration: SITE.floatHalf, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: SITE.floatHalf, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [reduced, enabled, t]);

  return useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [4, -8]) },
      { rotate: `${interpolate(t.value, [0, 1], [-2, 2])}deg` },
    ],
  }));
}
