import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from 'react-native';
import ModalSheet from '@/components/ui/ModalSheet';
import AppInput from '@/components/ui/AppInput';
import AppButton from '@/components/ui/AppButton';
import { ScalePressable } from '@/components/ui/motion';
import {
  createInvoice,
  updateInvoice,
  type InvoiceRecord,
} from '@/api/invoices';
import { apiErrorText } from '@/api/client';
import {
  cartTotal,
  cartTotalSizeGb,
  type CartItem,
  type EditingInvoiceDraft,
} from '@/stores/cart';
import { useAppStore } from '@/stores/app';
import { estimateMinutes } from '@/lib/estimate';
import { formatDinar } from '@/lib/money';
import { formatInvoiceCode } from '@/components/ui/LtrText';
import { usePalette } from '@/design/theme';
import { AR_FONT, LAT_FONT } from '@/design/fonts';
import { showToast } from '@/lib/toast';
import { ROW } from '@/lib/rtl';
import type { InvoiceItemInput } from '@/api/types';

interface Props {
  visible: boolean;
  items: CartItem[];
  editingDraft: EditingInvoiceDraft | null;
  onClose: () => void;
  onSaved: (invoice: InvoiceRecord) => void;
}

/**
 * نافذة إنشاء أو تعديل فاتورة للكاشير (المرحلة F3):
 * ترتيب محكم: بطاقة العميل ← بطاقة الدفع السريع والخصم ← بطاقة الملخص المالي
 * ← تذييل ثابت يحوي فقط زر الإجراء الرئيسي للطباعة دون تغطية المدخلات.
 */
export default function InvoiceFormModal({
  visible,
  items,
  editingDraft,
  onClose,
  onSaved,
}: Props) {
  const palette = usePalette();
  const selectedBranchId = useAppStore((s) => s.selectedBranchId);
  const total = cartTotal(items);
  const totalSize = cartTotalSizeGb(items);
  const minutes = estimateMinutes(totalSize);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [discountText, setDiscountText] = useState('0');
  const [paidText, setPaidText] = useState(String(total));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const discount = Math.max(0, Math.min(total, Number(discountText) || 0));
  const finalTotal = Math.max(0, total - discount);
  const paidAmount = Math.max(0, Number(paidText) || 0);
  const remaining = Math.max(0, finalTotal - paidAmount);

  const nameRef = useRef<TextInputInstance | null>(null);
  const phoneRef = useRef<TextInputInstance | null>(null);

  useEffect(() => {
    if (!visible) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(editingDraft?.customer_name ?? '');
    setPhone(editingDraft?.customer_phone ?? '');
    setNotes(editingDraft?.notes ?? '');
    const initDisc = Number(editingDraft?.discount ?? 0);
    setDiscountText(initDisc > 0 ? String(initDisc) : '0');
    const initPaid =
      editingDraft?.paid_amount != null
        ? Number(editingDraft.paid_amount)
        : Math.max(0, total - initDisc);
    setPaidText(String(initPaid));
    setError(null);
    setAttempted(false);
  }, [visible, editingDraft, total]);

  const handleSave = async () => {
    setAttempted(true);
    if (!name.trim() || !phone.trim()) {
      setError('يرجى إدخال اسم العميل ورقم الهاتف');
      return;
    }
    if (!items.length) {
      setError('السلة فارغة — أضف ألعاباً أولاً');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const payloadItems: InvoiceItemInput[] = items.map((it) => ({
        id: it.refId,
        title: it.title,
        price: it.price,
        type: it.type === 'package' ? 'package' : 'game',
        size_gb: it.sizeGb ?? null,
        quantity: it.quantity,
        platform: it.platform,
      }));

      let inv: InvoiceRecord;
      if (editingDraft) {
        inv = await updateInvoice(editingDraft.id, {
          customerInfo: {
            name: name.trim(),
            phone: phone.trim(),
            notes: notes.trim() || undefined,
          },
          discount,
          paid_amount: paidAmount,
          items: payloadItems,
        });
        showToast('تم تعديل الفاتورة بنجاح', 'success');
      } else {
        const res = await createInvoice({
          customerInfo: {
            name: name.trim(),
            phone: phone.trim(),
            notes: notes.trim() || undefined,
          },
          discount,
          paidAmount,
          items: payloadItems,
          total,
          totalSize,
          estimatedMinutes: minutes,
          finalTotal,
          date: new Date().toISOString(),
          status: 'pending',
          branch_id: selectedBranchId ?? 1,
        });
        inv = res.invoice;
        showToast('تم إنشاء الفاتورة بنجاح', 'success');
      }

      onSaved(inv);
      onClose();
    } catch (err) {
      setError(apiErrorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={
        editingDraft
          ? `تعديل الفاتورة ${formatInvoiceCode(editingDraft.invoice_number)}`
          : 'إنشاء فاتورة جديدة'
      }
      footer={
        <View style={styles.footerWrap}>
          {error ? (
            <Text style={[styles.errText, { color: palette.danger }]}>{error}</Text>
          ) : null}
          <AppButton
            label={
              editingDraft
                ? 'حفظ التعديلات والمعاينة'
                : 'إنشاء الفاتورة والمعاينة للطباعة'
            }
            icon="printer"
            onPress={handleSave}
            loading={busy}
          />
        </View>
      }
    >
      <View style={styles.formContainer}>
        {/* 1. ملخص سريع للبنود في السلة */}
        <View
          style={[
            styles.banner,
            {
              backgroundColor: `${palette.primary}12`,
              borderColor: `${palette.primary}35`,
            },
          ]}
        >
          <Text style={[styles.bannerText, { color: palette.primary }]}>
            {items.length} {items.length === 1 ? 'بند' : 'بنود'} في الفاتورة
          </Text>
          <Text style={[styles.bannerTotal, { color: palette.primary }]}>
            {formatDinar(total)}
          </Text>
        </View>

        {/* 2. بطاقة العميل */}
        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.surfaceLine },
          ]}
        >
          <Text style={[styles.cardHeader, { color: palette.text }]}>بيانات العميل</Text>
          <View style={styles.cardFields}>
            <AppInput
              label="اسم العميل *"
              placeholder="الاسم الكامل"
              value={name}
              icon="user"
              error={attempted && !name.trim() ? 'الاسم مطلوب' : null}
              onChangeText={setName}
              autoFocus={!editingDraft}
              inputRef={(t) => {
                nameRef.current = t;
              }}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            <AppInput
              label="رقم الهاتف *"
              placeholder="09X XXX XXXX"
              keyboard="phone-pad"
              icon="phone"
              value={phone}
              error={attempted && !phone.trim() ? 'رقم الهاتف مطلوب' : null}
              onChangeText={setPhone}
              inputRef={(t) => {
                phoneRef.current = t;
              }}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            <AppInput
              label="ملاحظات (اختياري)"
              placeholder="أي تفاصيل خاصة بالجهاز أو التسليم..."
              value={notes}
              multiline
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* 3. بطاقة الدفع والتسديد */}
        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.surfaceLine },
          ]}
        >
          <Text style={[styles.cardHeader, { color: palette.text }]}>خيارات الدفع</Text>

          {/* مفاتيح الدفع السريع */}
          <View style={styles.quickPayRow}>
            <QuickPayBtn
              label="الكل (خالص)"
              active={paidAmount === finalTotal && finalTotal > 0}
              onPress={() => setPaidText(String(finalTotal))}
              palette={palette}
            />
            <QuickPayBtn
              label="نصف القيمة"
              active={paidAmount === Math.round(finalTotal / 2) && finalTotal > 0}
              onPress={() => setPaidText(String(Math.round(finalTotal / 2)))}
              palette={palette}
            />
            <QuickPayBtn
              label="آجل (0)"
              active={paidAmount === 0}
              onPress={() => setPaidText('0')}
              palette={palette}
            />
          </View>

          {/* حقلا الخصم والمدفوع جنباً إلى جنب */}
          <View style={styles.inputsRow}>
            <View style={styles.flex1}>
              <AppInput
                label="الخصم (د.ل)"
                placeholder="0"
                keyboard="numeric"
                value={discountText}
                onChangeText={(v) => {
                  setDiscountText(v);
                  const nextFinal = Math.max(0, total - (Number(v) || 0));
                  setPaidText(String(nextFinal));
                }}
              />
            </View>
            <View style={styles.flex1}>
              <AppInput
                label="المدفوع حالياً (د.ل)"
                placeholder="0"
                keyboard="numeric"
                value={paidText}
                onChangeText={setPaidText}
              />
            </View>
          </View>
        </View>

        {/* 4. بطاقة الملخص المالي */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: palette.surfaceRaised,
              borderColor: palette.surfaceLine,
            },
          ]}
        >
          <SummaryLine label="الإجمالي قبل الخصم" value={formatDinar(total)} palette={palette} />
          {discount > 0 ? (
            <SummaryLine label="الخصم الممنوح" value={`-${formatDinar(discount)}`} palette={palette} />
          ) : null}
          <SummaryLine
            label="الصافي المطلوب"
            value={formatDinar(finalTotal)}
            highlight
            palette={palette}
          />
          <SummaryLine
            label="المبلغ المسدد"
            value={formatDinar(paidAmount)}
            palette={palette}
          />
          {remaining > 0 ? (
            <SummaryLine
              label="المتبقي (آجل)"
              value={formatDinar(remaining)}
              warn
              palette={palette}
            />
          ) : (
            <View style={styles.paidBadge}>
              <Text style={[styles.paidBadgeText, { color: palette.success }]}>
                ✓ الفاتورة مدفوعة بالكامل
              </Text>
            </View>
          )}
        </View>
      </View>
    </ModalSheet>
  );
}

function QuickPayBtn({
  label,
  active,
  onPress,
  palette,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.quickBtn,
        {
          backgroundColor: active ? palette.primary : palette.surfaceRaised,
          borderColor: active ? palette.primary : palette.surfaceLine,
        },
      ]}
    >
      <Text
        style={[
          styles.quickBtnText,
          {
            color: active ? palette.onPrimary : palette.text,
            fontFamily: AR_FONT.bold,
          },
        ]}
      >
        {label}
      </Text>
    </ScalePressable>
  );
}

function SummaryLine({
  label,
  value,
  highlight,
  warn,
  palette,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text
        style={[
          styles.summaryLabel,
          {
            color: warn ? palette.danger : highlight ? palette.text : palette.textSub,
            fontFamily: highlight || warn ? AR_FONT.bold : AR_FONT.medium,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.summaryValue,
          {
            color: warn ? palette.danger : highlight ? palette.primary : palette.text,
            fontFamily: highlight || warn ? LAT_FONT.bold : LAT_FONT.medium,
            fontSize: highlight ? 15 : 13,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    gap: 12,
    paddingBottom: 16,
  },
  banner: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bannerText: {
    fontFamily: AR_FONT.bold,
    fontSize: 13,
  },
  bannerTotal: {
    fontFamily: LAT_FONT.bold,
    fontSize: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    fontFamily: AR_FONT.bold,
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardFields: {
    gap: 10,
  },
  quickPayRow: {
    flexDirection: ROW,
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
  },
  quickBtnText: {
    fontSize: 12,
    includeFontPadding: false,
  },
  inputsRow: {
    flexDirection: ROW,
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  summaryRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12.5,
    includeFontPadding: false,
  },
  summaryValue: {
    includeFontPadding: false,
  },
  paidBadge: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#22c55e30',
    alignItems: 'center',
  },
  paidBadgeText: {
    fontFamily: AR_FONT.bold,
    fontSize: 12,
  },
  footerWrap: {
    gap: 8,
  },
  errText: {
    fontFamily: AR_FONT.medium,
    fontSize: 12,
    textAlign: 'right',
  },
});
