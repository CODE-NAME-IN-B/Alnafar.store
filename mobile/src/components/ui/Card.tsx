import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, tokens, triggerLightHaptic } from '@/lib/colors';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  /** شريط حالة جانبي بسمك 4px في بداية البطاقة بدلاً من تلوين الإطار الكامل */
  statusColor?: string | null;
  style?: ViewStyle;
}

export function Card({ children, onPress, statusColor, style }: Props) {
  const content = (
    <>
      {statusColor ? (
        <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />
      ) : null}
      <View style={[styles.inner, statusColor ? styles.innerWithStrip : null]}>
        {children}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          triggerLightHaptic();
          onPress();
        }}
        style={[styles.card, style]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{content}</View>;
}

export default Card;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.elevated,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    position: 'relative',
  },
  statusStrip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 4,
    zIndex: 2,
  },
  inner: {
    padding: 14,
  },
  innerWithStrip: {
    paddingRight: 18,
  },
});
