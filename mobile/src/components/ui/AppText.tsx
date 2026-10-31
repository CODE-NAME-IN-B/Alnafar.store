import React from 'react';
import { StyleSheet, Text as RNText, TextProps } from 'react-native';
import { FONT } from '@/lib/fonts';
import { colors, tokens } from '@/lib/colors';

export type TextVariant = 'pageTitle' | 'cardTitle' | 'body' | 'secondary' | 'caption';

interface Props extends TextProps {
  variant?: TextVariant;
  tabular?: boolean;
}

export function AppText({ variant = 'body', tabular, style, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      style={[
        styles.base,
        VARIANT_STYLES[variant],
        tabular && styles.tabular,
        style,
      ]}
    />
  );
}

export { AppText as Text };
export default AppText;

const styles = StyleSheet.create({
  base: {
    fontFamily: FONT.regular,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    letterSpacing: 0,
    includeFontPadding: false,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});

const VARIANT_STYLES = StyleSheet.create({
  pageTitle: {
    fontFamily: FONT.bold,
    fontSize: tokens.type.pageTitle.fontSize,
    lineHeight: tokens.type.pageTitle.lineHeight,
    color: colors.text,
  },
  cardTitle: {
    fontFamily: FONT.bold,
    fontSize: tokens.type.cardTitle.fontSize,
    lineHeight: tokens.type.cardTitle.lineHeight,
    color: colors.text,
  },
  body: {
    fontFamily: FONT.regular,
    fontSize: tokens.type.body.fontSize,
    lineHeight: tokens.type.body.lineHeight,
    color: colors.text,
  },
  secondary: {
    fontFamily: FONT.medium,
    fontSize: tokens.type.secondary.fontSize,
    lineHeight: tokens.type.secondary.lineHeight,
    color: colors.dim,
  },
  caption: {
    fontFamily: FONT.medium,
    fontSize: tokens.type.caption.fontSize,
    lineHeight: tokens.type.caption.lineHeight,
    color: colors.faint,
  },
});
