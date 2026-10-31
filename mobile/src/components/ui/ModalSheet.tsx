import { Modal, Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { FONT } from '@/lib/fonts';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * ورقة سفليّة موحدة — تُستخدم لاختيار النسخة، تفاصيل الباقة، الفلاتر، النجاح...
 * (بدون أي HTML أو WebView — Modal أصلية)
 */
export default function ModalSheet({ visible, onClose, title, children }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={backdrop} onPress={onClose} accessible accessibilityLabel="إغلاق النافذة">
        <Pressable style={sheet} onPress={() => undefined}>
          {title ? (
            <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 18, textAlign: 'right', marginBottom: 14 }}>
              {title}
            </Text>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const backdrop = {
  flex: 1,
  justifyContent: 'flex-end',
  backgroundColor: 'rgba(2,6,23,0.6)',
} as const;

const sheet = {
  backgroundColor: '#141e30',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 18,
  paddingBottom: 30,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  maxHeight: '80%' as `${number}%`,
} as const;
