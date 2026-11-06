import React from 'react';
import { Text, TextProps } from 'react-native';
import { AR_FONT } from '@/design/fonts';
import { usePalette, useThemeName } from '@/design/theme';

type Tone = 'primary' | 'secondary' | 'faint' | 'danger' | 'success' | 'warning' | 'onPrimary';

interface Props extends TextProps {
  tone?: Tone;
  /** خط الهوية العربي مباشرة — بديل FONT القديم بنفس المفاتيح */
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  tabular?: boolean;
}

const useColor = (tone: Tone): string => {
  const p = usePalette();
  switch (tone) {
    case 'secondary':
      return p.textSub;
    case 'faint':
      return p.textFaint;
    case 'danger':
      return p.danger;
    case 'success':
      return p.success;
    case 'warning':
      return p.warning;
    case 'onPrimary':
      return p.onPrimary;
    default:
      return p.text;
  }
};

/** T — النص الأساسي للشاشات: لون من السمة + خط الهوية العربي */
export function T({ tone = 'primary', weight = 'regular', tabular, style, ...rest }: Props) {
  const color = useColor(tone);
  return (
    <Text
      {...rest}
      style={[
        { color, fontFamily: AR_FONT[weight], textAlign: 'right' },
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
    />
  );
}

export default T;
