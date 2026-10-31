/** نص موحد: محاذاة يمين افتراضياً (التطبيق عربي بالكامل) مع خط قابل للوراثة */
import { Text, type StyleProp, type TextStyle } from 'react-native';
import type { ComponentProps } from 'react';

type TextProps = ComponentProps<typeof Text>;

export default function AppText({ style, ...rest }: TextProps) {
  const composed: StyleProp<TextStyle> = [{ textAlign: 'right' }, style];
  return <Text style={composed} {...rest} />;
}
