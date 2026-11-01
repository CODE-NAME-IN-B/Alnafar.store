import { useCallback, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  useAnimatedValue,
  type PressableProps,
  type StyleProp,
  ViewStyle,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

/**
 * حِزم الحياة المتحركة المشتركة — أدوات RN الأصلية فقط (بلا مكتبات جديدة).
 * كل الحركات على المحرك الأصلي (useNativeDriver) صامتة على خيط JS.
 */

/** قيمة توسيع مرن لإجابة اللمس — تُستعمل داخل البطاقات والشرائح */
export function usePressScale(pressed: 0.94 | 0.955 = 0.955) {
  const scale = useAnimatedValue(1);

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: pressed,
      useNativeDriver: true,
      speed: 26,
    }).start();
  }, [scale, pressed]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  }, [scale]);

  return { scale, handlePressIn, handlePressOut };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ScalePressableProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/** زر قابل للضغط بإجابة مرنة وكل سلوكيات Pressable الأصلية */
export function ScalePressable({ children, style, ...rest }: ScalePressableProps) {
  const { scale, handlePressIn, handlePressOut } = usePressScale();
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        handlePressIn();
        void rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        handlePressOut();
        void rest.onPressOut?.(e);
      }}
      style={StyleSheet.flatten([style, { transform: [{ scale }] }])}
    >
      {children}
    </AnimatedPressable>
  );
}

/** حركة دخول لمرة واحدة (شفافية + انزلاق خفيف من الأسفل) */
export function useEntrance({ durationMs = 260, dy = 12, delayMs = 0 }: {
  durationMs?: number;
  dy?: number;
  delayMs?: number;
} = {}) {
  const v = useAnimatedValue(0);
  const start = useCallback(() => {
    v.stopAnimation();
    v.setValue(0);
    Animated.timing(v, {
      toValue: 1,
      duration: durationMs,
      delay: delayMs,
      useNativeDriver: true,
    }).start();
  }, [v, durationMs, delayMs]);

  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] });
  const style: Animated.WithAnimatedValue<ViewStyle> = {
    opacity: v,
    transform: [{ translateY }],
  };
  return { start, style };
}

/** حركة دخول تعاد كل مرة يعود سلوًا إلى الشاشة (تبويب ↔ سلة ↔ الرئيسية) */
export function useScreenEntrance(opts?: { durationMs?: number; dy?: number }) {
  const { start, style } = useEntrance(opts);
  useFocusEffect(
    useCallback(() => {
      start();
    }, [start])
  );
  return style;
}
