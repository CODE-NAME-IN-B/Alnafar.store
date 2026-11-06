import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon, { IconName } from '@/components/ui/Icon';
import { triggerLightHaptic } from '@/lib/colors';
import { AR_FONT } from './fonts';
import { usePalette } from './theme';

interface Props {
  visible: boolean;
  title: string;
  /** وصف يحمل الاسم/الرقم بخط bold داخل هذا النص نفسه */
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** تأكيد الحذف/الإرجاع = danger، التأكيد العادي = primary */
  danger?: boolean;
  icon?: IconName;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmDialog — تأكيد (§5): يُفعَّل لعناصر الحذف/الإرجاع
 * مع ذكر اسم العنصر/رقمه داخل نص التأكيد. مفعّل باللمس والمفاتيح.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  danger,
  icon,
  onConfirm,
  onCancel,
}: Props) {
  const palette = usePalette();
  const accentColor = danger ? palette.danger : palette.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.scrim, { backgroundColor: palette.scrim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View
          style={[
            styles.card,
            { backgroundColor: palette.canvas, borderColor: palette.surfaceLine },
          ]}
          accessibilityRole="alert"
        >
          {icon ? (
            <View
              style={[
                styles.iconSlot,
                { borderColor: palette.surfaceLine, backgroundColor: palette.surface },
              ]}
            >
              <Icon name={icon} size={22} color={accentColor} />
            </View>
          ) : null}
          <Text numberOfLines={1} style={[styles.title, { color: palette.text }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: palette.textSub }]}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                onCancel();
              }}
              accessibilityRole="button"
              style={[styles.btn, { borderColor: palette.surfaceLine }]}
            >
              <Text style={[styles.btnTxt, { color: palette.textSub }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                onConfirm();
              }}
              accessibilityRole="button"
              style={[styles.btn, styles.btnPrimary, { backgroundColor: accentColor }]}
            >
              <Text
                style={[
                  styles.btnTxt,
                  { color: danger ? '#F5F1E8' : palette.onPrimary, fontFamily: AR_FONT.bold },
                ]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default ConfirmDialog;

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  iconSlot: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  title: {
    fontFamily: AR_FONT.bold,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  message: {
    fontFamily: AR_FONT.regular,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
    marginTop: 6,
  },
  btn: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    borderWidth: 0,
  },
  btnTxt: {
    fontFamily: AR_FONT.semibold,
    fontSize: 14,
    letterSpacing: 0,
    includeFontPadding: false,
  },
});
