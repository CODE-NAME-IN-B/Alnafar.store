import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { usePalette } from './theme';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
}

export function Card({ children, onPress, style, elevated }: Props) {
  const palette = usePalette();

  const containerStyle = [
    styles.card,
    {
      backgroundColor: elevated ? palette.surfaceRaised : palette.surface,
      borderColor: palette.surfaceLine,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          containerStyle,
          pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

export default Card;

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
});
