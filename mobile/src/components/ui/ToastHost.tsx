import { Text, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { registerToast, type ToastKind } from '@/lib/toast';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';

/**
 * مضيف التوست — يُثبّت في جذر التطبيق: نجاح = forest/lime معكوس، خطأ = داكن
 * أحمر. يختفي تلقائياً بعد 3 ثوان. بساطة الهوية: لوححبر واحد بلا حدود.
 */
export default function ToastHost() {
  const [state, setState] = useState<{
    message: string;
    kind: ToastKind;
    id: number;
  } | null>(null);
  // react-hooks/refs: Animated.Value ثابتة قصداً وليست قراءة ref للعرض (نمط شائع مسموح)
  // eslint-disable-next-line react-hooks/refs
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // التسجيل داخل أثر (وليس render) — الاستدعاء الفعلي يحدث من معالجات أحداث
  useEffect(() => {
    registerToast((message, kind) => {
      if (timer.current) clearTimeout(timer.current);
      setState((prev) => ({ message, kind, id: (prev?.id ?? 0) + 1 }));
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(
          (finished) => {
            if (finished) setState(null);
          }
        );
      }, 3000);
    });
  }, [opacity]);

  if (!state) return null;
  return <ToastInner state={state} opacity={opacity} />;
}

function ToastInner({
  state,
  opacity,
}: {
  state: { message: string; kind: ToastKind; id: number };
  opacity: Animated.Value;
}) {
  const palette = usePalette();
  /* الهوية: نجاح = forest بنص كريمي (أو lime بنص حبر في الداكن)، خطأ = داكن مرّ */
  const bg = state.kind === 'error'
    ? palette.name === 'dark'
      ? '#3A1712'
      : '#6B2B23'
    : palette.name === 'dark'
      ? '#C1D792'
      : '#244F43';
  const fg = state.kind === 'error' ? '#F5F1E8' : palette.name === 'dark' ? '#1F241D' : '#F5F1E8';

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
            color: fg,
            fontFamily: state.kind === 'error' ? AR_FONT.semibold : AR_FONT.medium,
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
