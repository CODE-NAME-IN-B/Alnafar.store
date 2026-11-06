import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { FONT } from '@/lib/fonts';
import { tokens, triggerLightHaptic } from '@/lib/colors';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';

interface Props {
  label: string;
  active?: boolean;
  /** حجم مدمج لأشرطة الفلاتر الكثيفة (لوحة الإدارة) */
  compact?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

const AnimatedChip = Animated.createAnimatedComponent(Pressable);

export function Chip({ label, active, compact, onPress, style }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const palette = usePalette();

  const animate = (to: number, speed: number) => {
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed }).start();
  };

  const handlePress = () => {
    if (!onPress) return;
    triggerLightHaptic();
    onPress();
  };

  return (
    <AnimatedChip
      onPressIn={() => animate(0.94, 26)}
      onPressOut={() => animate(1, 18)}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
      style={[
        styles.chip,
        compact ? styles.compact : null,
        {
          backgroundColor: active ? palette.primary : palette.surface,
          borderColor: active ? 'transparent' : palette.surfaceLine,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          compact ? styles.textCompact : null,
          {
            color: active ? palette.onPrimary : palette.textSub,
            fontFamily: active ? FONT.bold : FONT.semibold,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedChip>
  );
}

export default Chip;

const styles = StyleSheet.create({
  chip: {
    minHeight: 38,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    minHeight: 30,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  text: {
    fontSize: 13,
    letterSpacing: 0,
    includeFontPadding: false,
    textAlign: 'center',
  },
  textCompact: {
    fontSize: 12,
  },
});
