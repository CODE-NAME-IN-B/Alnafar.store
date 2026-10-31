import { Text, View } from 'react-native';
import { useRef, useState } from 'react';
import { Animated } from 'react-native';
import { registerToast, type ToastKind } from '@/lib/toast';

/**
 * مضيف التوست — يُثبّت في جذر التطبيق، وعرض الرسائل:
 * success (teal) وerror (أحمر)، تختفي تلقائياً بعد 3 ثوان (مثل الواجهة).
 */
export default function ToastHost() {
  const [state, setState] = useState<{
    message: string;
    kind: ToastKind;
    id: number;
  } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  registerToast((message, kind) => {
    if (timer.current) clearTimeout(timer.current);
    setState({ message, kind, id: Date.now() });
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    timer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
        setState(null)
      );
    }, 3000);
  });

  if (!state) return null;

  const bg = state.kind === 'error' ? '#7f1d1d' : '#0e7f74';

  return (
    <View pointerEvents="none" style={host}>
      <Animated.View
        style={[
          { backgroundColor: bg, opacity, borderRadius: 10 },
          { alignSelf: 'center' },
        ]}
      >
        <Text
          style={{
            color: '#fff',
            fontFamily: state.kind === 'error' ? 'Cairo_600SemiBold' : 'Cairo_500Medium',
            paddingVertical: 10,
            paddingHorizontal: 16,
            textAlign: 'center',
          }}
        >
          {state.message}
        </Text>
      </Animated.View>
    </View>
  );
}

const host = {
  position: 'absolute' as const,
  left: 16,
  right: 16,
  bottom: 96,
  alignItems: 'center' as const,
};
