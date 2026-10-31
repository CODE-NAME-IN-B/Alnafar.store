import { Pressable, Text } from 'react-native';
import { FONT } from '@/lib/fonts';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const LOOK: Record<Variant, { bg: string; fg: string; inactive: string; inactiveFg: string }> = {
  primary: { bg: '#14b8a6', fg: '#062b27', inactive: '#115e59', inactiveFg: '#8fd8cf' },
  secondary: { bg: '#1b2740', fg: '#f1f5f9', inactive: '#16202e', inactiveFg: '#94a3b8' },
  danger: { bg: '#ef4444', fg: '#fff', inactive: '#7f1d1d', inactiveFg: '#fca5a5' },
  ghost: { bg: 'transparent', fg: '#14b8a6', inactive: 'transparent', inactiveFg: '#475569' },
};

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}

/** زر أساسي بنمط النفار (teal على داكن) */
export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  testID,
}: Props) {
  const busy = loading || disabled;
  const look = LOOK[variant];

  return (
    <Pressable
      testID={testID}
      onPress={busy ? undefined : onPress}
      disabled={busy}
      android_ripple={{ color: look.fg, borderless: false, foreground: true }}
      style={{
        backgroundColor: busy ? look.inactive : look.bg,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 18,
        opacity: busy ? 0.85 : 1,
      }}
    >
      <Text
        style={{ color: busy ? look.inactiveFg : look.fg, fontFamily: FONT.bold, fontSize: 15 }}
      >
        {busy ? 'جاري...' : label}
      </Text>
    </Pressable>
  );
}
