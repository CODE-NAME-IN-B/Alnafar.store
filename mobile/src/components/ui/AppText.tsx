import React from 'react';
import { StyleSheet, Text as RNText, TextProps } from 'react-native';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';

export type TextVariant = 'pageTitle' | 'cardTitle' | 'body' | 'secondary' | 'caption';

interface Props extends TextProps {
  variant?: TextVariant;
  tabular?: boolean;
}

export function AppText({ variant = 'body', tabular, style, ...rest }: Props) {
  const palette = usePalette();
  const color =
    variant === 'secondary' ? palette.textSub : variant === 'caption' ? palette.textFaint : palette.text;
  return (
    <RNText
      {...rest}
      style={[
        styles.base,
        VARIANT_STYLES[variant],
        { color },
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
    fontFamily: AR_FONT.regular,
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
    fontFamily: AR_FONT.bold,
    fontSize: 22,
    lineHeight: 30,
  },
  cardTitle: {
    fontFamily: AR_FONT.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: AR_FONT.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  secondary: {
    fontFamily: AR_FONT.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  caption: {
    fontFamily: AR_FONT.medium,
    fontSize: 12,
    lineHeight: 18,
  },
});
