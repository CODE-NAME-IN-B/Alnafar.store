import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Icon, { IconName } from './Icon';
import { FONT } from '@/lib/fonts';
import { colors, tokens, triggerLightHaptic } from '@/lib/colors';
import { ROW } from '@/lib/rtl';

interface Props {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  onMorePress?: () => void;
  showChevron?: boolean;
  style?: ViewStyle;
}

export function ListRow({
  title,
  subtitle,
  meta,
  leading,
  trailing,
  onPress,
  onMorePress,
  showChevron,
  style,
}: Props) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={() => {
        if (!onPress) return;
        triggerLightHaptic();
        onPress();
      }}
      style={[styles.row, style]}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}

      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text numberOfLines={1} style={styles.meta}>
            {meta}
          </Text>
        ) : null}
      </View>

      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}

      {onMorePress ? (
        <Pressable
          onPress={() => {
            triggerLightHaptic();
            onMorePress();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`خيارات ${title}`}
          style={styles.moreBtn}
        >
          <Icon name="more" size={20} color={colors.dim} />
        </Pressable>
      ) : showChevron ? (
        <Icon name="chevron-left" size={18} color={colors.faint} />
      ) : null}
    </Pressable>
  );
}

export default ListRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.elevated,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 68,
  },
  leading: {
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 2,
    alignItems: 'stretch',
  },
  title: {
    fontFamily: FONT.bold,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
    letterSpacing: 0,
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: FONT.bold,
    color: colors.brandLight,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  meta: {
    fontFamily: FONT.medium,
    color: colors.faint,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  trailing: {
    flexShrink: 0,
  },
  moreBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
