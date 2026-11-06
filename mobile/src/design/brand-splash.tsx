import React, { useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { EASE } from './motion';
import { AR_FONT } from './fonts';

const LOGO = require('../../assets/_brand/icon.png');

const CREAM = '#F5F1E8';
const INK = '#1F241D';
const FOREST = '#2D6A4F';
const LIME = '#C1D792';

const TOTAL_MS = 1_350;

/**
 * BrandSplash — افتتاحية الشعار الرسمية الفاخرة للتطبيق:
 * ظهور ناعم ومتدرج لأيقونة الشعار المعتمدة متبوعة باسم «الشاردة ستور»
 * والوصف «النفار للألعاب»، مع نبضة ليمونية أنيقة ثم تلاشٍ ناعم يكشف التطبيق.
 */
export function BrandSplash({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const fired = useRef(false);

  const logoScale = useSharedValue(0.84);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslate = useSharedValue(12);
  const dotScale = useSharedValue(1);
  const veilOpacity = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      if (!fired.current) {
        fired.current = true;
        onDone();
      }
      return;
    }

    // 1. الشعار يظهر ويكبر بسلاسة
    logoOpacity.value = withTiming(1, { duration: 380, easing: EASE.signature });
    logoScale.value = withTiming(1, { duration: 520, easing: EASE.signature });

    // 2. النص يصعد ويوضح
    textOpacity.value = withDelay(
      180,
      withTiming(1, { duration: 420, easing: EASE.signature })
    );
    textTranslate.value = withDelay(
      180,
      withTiming(0, { duration: 420, easing: EASE.signature })
    );

    // 3. نبضة النقطة الليمونية
    dotScale.value = withDelay(
      450,
      withSequence(
        withTiming(1.35, { duration: 220, easing: EASE.signature }),
        withTiming(1, { duration: 220, easing: EASE.signature })
      )
    );

    // 4. التلاشي الختامي ورفع الستار
    veilOpacity.value = withDelay(
      1_020,
      withTiming(0, { duration: 320, easing: EASE.signature })
    );

    const t = setTimeout(() => {
      if (!fired.current) {
        fired.current = true;
        onDone();
      }
    }, TOTAL_MS);

    return () => clearTimeout(t);
  }, [reduced, logoOpacity, logoScale, textOpacity, textTranslate, dotScale, veilOpacity, onDone]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslate.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  const veilStyle = useAnimatedStyle(() => ({
    opacity: veilOpacity.value,
  }));

  if (reduced) return null;

  return (
    <Animated.View style={[styles.veil, veilStyle]} pointerEvents="auto">
      <View style={styles.centerBox}>
        {/* إطار الشعار المعتمد */}
        <Animated.View style={[styles.logoCard, logoStyle]}>
          <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
        </Animated.View>

        {/* هوية المتجر */}
        <Animated.View style={[styles.textBlock, textStyle]}>
          <Text style={styles.title}>الشاردة ستور</Text>
          <View style={styles.subRow}>
            <Text style={styles.subtitle}>النفار للألعاب • بلايستيشن و PC</Text>
            <Animated.View style={[styles.limeDot, dotStyle]} />
          </View>
        </Animated.View>
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
    zIndex: 9999,
    elevation: 9999,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoCard: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: INK,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: INK,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontFamily: AR_FONT.bold,
    fontSize: 24,
    color: INK,
    letterSpacing: -0.3,
    includeFontPadding: false,
    textAlign: 'center',
  },
  subRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  subtitle: {
    fontFamily: AR_FONT.medium,
    fontSize: 13,
    color: FOREST,
    includeFontPadding: false,
  },
  limeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: LIME,
  },
});
