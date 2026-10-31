import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';
import { FONT } from '@/lib/fonts';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** لون نشاط مخصص (افتراضي teal) */
  accent?: string;
}

/** شريحة فلترة صغيرة (فئات، أنواع، حروف...) */
export default function Chip({ label, active = false, onPress, style, accent = '#14b8a6' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 100,
          backgroundColor: active ? accent : '#1b2740',
          borderWidth: 1,
          borderColor: active ? accent : 'rgba(255,255,255,0.08)',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: active ? '#062b27' : '#cbd5e1',
          fontFamily: active ? FONT.bold : FONT.medium,
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
