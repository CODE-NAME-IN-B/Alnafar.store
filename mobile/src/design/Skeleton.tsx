import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { EASE } from './motion';
import { usePalette } from './theme';

/**
 * Skeleton — هيكل عظمي للاستدلال التحميل:
 * شرائح سطحية بشريط لمعة ينزلق من اليمين (1200ms، منحنى توقيعي).
 * reduced motion: أسطح ثابتة بلا لمعة.
 */
export function Skeleton({
  width,
  height = 14,
  radius = 8,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.block,
        {
          width: width ?? '100%',
          height,
          borderRadius: radius,
          backgroundColor: palette.surfaceRaised,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Shimmer />
    </View>
  );
}

function Shimmer() {
  const palette = usePalette();
  const x = useSharedValue(1.0);
  useEffect(() => {
    /* الانزلاق من اليمين xy=1 → إلى 0 سحيقاً (RTL) — أومرة 1200ms */
    x.value = withRepeat(
      withTiming(0, { duration: 1200, easing: EASE.signature }),
      -1,
      false,
    );
  }, [x]);

  const st = useAnimatedStyle(() => ({
    opacity: 0.6,
    transform: [{ translateX: x.value * 220 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.shimmer,
        { backgroundColor: palette.surfaceLine },
        st,
      ]}
    />
  );
}

export default Skeleton;

const styles = StyleSheet.create({
  block: {
    justifyContent: 'center',
  },
  shimmer: {
    position: 'absolute',
    left: -120,
    right: -120,
    top: 0,
    bottom: 0,
  },
});
