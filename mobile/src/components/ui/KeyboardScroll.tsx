import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';

export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setHeight(e.endCoordinates?.height ?? 280);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}

interface Props extends ScrollViewProps {
  children: ReactNode;
  centerWhenClosed?: boolean;
  contentStyle?: ViewStyle;
  extraBottomPadding?: number;
}

/**
 * حاوية تمرير ذكية تتفاعل مع لوحة المفاتيح على أندرويد وiOS وExpo Go:
 * - ترفع الحقول تلقائياً فوق لوحة المفاتيح.
 * - تسمح بالتمرير السلس والنقر على الأزرار دون إغلاق إجباري للوحة المفاتيح.
 */
export default function KeyboardScroll({
  children,
  centerWhenClosed = false,
  contentStyle,
  extraBottomPadding = 24,
  ...rest
}: Props) {
  const kbHeight = useKeyboardHeight();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    if (kbHeight > 0 && centerWhenClosed) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 90, animated: true });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [kbHeight, centerWhenClosed]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          {
            flexGrow: 1,
            justifyContent: centerWhenClosed && kbHeight === 0 ? 'center' : 'flex-start',
            paddingBottom: kbHeight > 0 ? kbHeight + extraBottomPadding : extraBottomPadding,
          },
          contentStyle,
        ]}
        {...rest}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
