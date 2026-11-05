/**
 * motion-library.tsx — مكتبة الحركة المنقولة من الموقع (00b-web-reference §D)
 *
 * قاعدة PLAN §5: كل worklets على خيط الواجهة (transform/opacity فقط)،
 * واحترام reduced motion بالتحول إلى سلوك فوري، والانضباط:
 * الحركات الدورية (طفو/هالة/أوربت) للشاشات الترحيبية فقط — لا شيء في قوائم الكاشير.
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
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { PRIM } from './tokens';
import { DUR, EASE, SITE } from './motion';
import { isSystemRTL } from '../lib/rtl';

/* ============================================================
 * EntryIn — نمط دخول الموقع (copy-arrive):
 * fade + slide-up بسلسلة stagger: delay = i * DUR.stagger
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
 * EdgeSweep — خط edge lime (3px) أسفل الحاوية مع مسح ضوئي 8s
 * مستخرج حرفياً: linear-gradient(transparent→lime→green→transparent)
 * translateY داخل مسح span. في reduced motion: ثابت بلا مسح.
 * ============================================================ */

export function EdgeSweep({ style }: { style?: ViewStyle }) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    if (reduced || width === 0) {
      sweep.value = 0;
      return;
    }
    sweep.value = withRepeat(
      withTiming(1, { duration: SITE.sweepPeriod, easing: Easing.linear }),
      -1,
      true,
    );
  }, [reduced, width, sweep]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(sweep.value, [0, 1], [-width, width / 4]) },
    ],
  }));

  return (
    <View
      pointerEvents="none"
      style={[{ height: 3, overflow: 'hidden', opacity: 0.62 }, style]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Svg width="100%" height={3} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="alnafarEdge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={PRIM.lime} stopOpacity={0} />
            <Stop offset="0.25" stopColor={PRIM.lime} stopOpacity={1} />
            <Stop offset="0.7" stopColor={PRIM.forest} stopOpacity={1} />
            <Stop offset="1" stopColor={PRIM.forest} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="alnafarEdgeSweep" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={PRIM.white} stopOpacity={0} />
            <Stop offset="0.5" stopColor={PRIM.white} stopOpacity={0.35} />
            <Stop offset="1" stopColor={PRIM.white} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width || 1} height={3} fill="url(#alnafarEdge)" />
      </Svg>
      {/* عنصر المسح — طبقة بيضاء شبه شفافة تمر على الخط */}
      <Animated.View
        style={[
          sweepStyle,
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: Math.max(120, width * 0.3),
          },
        ]}
      >
        <Svg width="100%" height={3} preserveAspectRatio="none">
          <Rect x={0} y={0} width="100%" height={3} fill="url(#alnafarEdgeSweep)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/* ============================================================
 * SignalBeacon — نقطة الحالة بنبضة الموقع (signal-beacon 2.4s):
 * نقطة + هالة تتقلص/تنتفخ (scale .94→1.08، opacity .72→1)
 * ============================================================ */

export function SignalBeacon({
  color = PRIM.forest,
  size = 8,
  style,
}: {
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
    transform: [
      { scale: interpolate(pulse.value, [0, 1], [0.94, 1.08]) },
    ],
  }));

  const ring = Math.round(size * 2.6);
  const dot = Math.round(size);

  return (
    <View
      pointerEvents="none"
      style={[{ width: ring, height: ring, alignItems: 'center', justifyContent: 'center' }, style]}
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
 * AnimatedUnderline — خط تعريف تفاعلي (نمط حلقة الأوربت):
 * يمتد تنازلياً من حده: LTR من اليسار، RTL من اليمين، 200ms، signature easing.
 * ============================================================ */

export function AnimatedUnderline({
  active,
  color = PRIM.lime,
  height = 2,
  style,
}: {
  active: boolean;
  color?: string;
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

  const dir = isSystemRTL ? 1 : -1; // يثبت حده: RTL من اليمين، LTR من اليسار
  const barStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX:
            interpolate(progress.value, [0, 1], [dir * measured * 0.5, 0]),
        },
        { scaleX: interpolate(progress.value, [0, 1], [0, 1]) },
      ],
    };
  });

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
            opacity: reduced ? (active ? 1 : 0) : undefined,
          },
        ]}
      />
    </View>
  );
}

/* ============================================================
 * useFloatMotion — طفو الهاتف العائم (phone-float من الموقع، مخفّض):
 * translateY 4→-8 و rotate ±2° بمتتالية 4.3s ودوران تنفس.
 * استعماله بالشاشات الترحيبية فقط (السلوك الحساس يبقى ثابتاً).
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
