import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from './Icon';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { ROW } from '@/lib/rtl';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** محتوى ثابت أسفل المحتوى القابل للتمرير (زر أساسي/ملخص) — لا يُلفّ ولا يختفي */
  footer?: ReactNode;
}

export default function ModalSheet({ visible, onClose, title, children, footer }: Props) {
  const palette = usePalette();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.backdrop, { backgroundColor: palette.scrim }]}>
          <Pressable style={styles.dismissArea} onPress={onClose} />
          <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: palette.canvas }]}>
            <View style={[styles.handle, { backgroundColor: palette.surfaceLine }]} />
            {title ? (
              <View style={[styles.header, { borderBottomColor: palette.surfaceLine }]}>
                <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>
                  {title}
                </Text>
                <Pressable onPress={onClose} hitSlop={10} style={[styles.closeBtn, { backgroundColor: palette.surface }]}>
                  <Icon name="close" size={18} color={palette.textFaint} />
                </Pressable>
              </View>
            ) : null}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              {children}
            </ScrollView>
            {footer ? <View style={[styles.footer, { borderTopColor: palette.surfaceLine }]}>{footer}</View> : null}
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ملاحظة: السمة تتدفق من ThemeProvider — لا حاجة لقراءة الاسم هنا. */

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  header: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    flexShrink: 1,
    fontFamily: AR_FONT.bold,
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 24,
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
});
