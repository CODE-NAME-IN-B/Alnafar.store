import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import ModalSheet from '@/components/ui/ModalSheet';
import AppInput from '@/components/ui/AppInput';
import AppButton from '@/components/ui/AppButton';
import AppText from '@/components/ui/AppText';
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
import { colors } from '@/lib/colors';
import { FONT } from '@/lib/fonts';
import { showToast } from '@/lib/toast';
import type { InvoiceItemInput } from '@/api/types';

interface Props {
  visible: boolean;
  items: CartItem[];
  editingDraft: EditingInvoiceDraft | null;
  onClose: () => void;
  onSaved: (invoice: InvoiceRecord) => void;
}

/** نافذة إنشاء أو تعديل فاتورة للموظف/المدير (مطابقة لمنطق Invoice.jsx) */
export default function InvoiceFormModal({
  visible,
  items,
  editingDraft,
  onClose,
  onSaved,
}: Props) {
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
  /** يُفعِّل عرض خطأ حقل-بحقل بعد أول محاولة إرسال فقط (لا نغرِس المستخدم مبكراً) */
  const [attempted, setAttempted] = useState(false);

  const discount = Math.max(0, Math.min(total, Number(discountText) || 0));
  const finalTotal = Math.max(0, total - discount);
  const paidAmount = Math.max(0, Number(paidText) || 0);
  const remaining = Math.max(0, finalTotal - paidAmount);

  useEffect(() => {
    if (!visible) return;
    // إعادة تهيئة استمارة الفاتورة عند فتح النافذة أو تغيّر الهدف (نموذج نافذة مقصود، وليس حالة مشتقة للعرض)
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
      setError('السلة فارغة');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const payloadItems: InvoiceItemInput[] = items.flatMap((item) => {
        const count = Math.max(1, item.quantity);
        return Array.from({ length: count }, () => ({
          ...(item.type === 'game' ? { id: item.refId } : {}),
          title: item.title,
          price: item.price,
          type: item.type,
          size_gb: item.sizeGb ?? 0,
          ...(item.platform ? { platform: item.platform } : {}),
        }));
      });

      const payload = {
        customerInfo: {
          name: name.trim(),
          phone: phone.trim(),
          address: editingDraft?.customer_address ?? '',
          notes: notes.trim(),
        },
        items: payloadItems,
        total,
        totalSize,
        estimatedMinutes: minutes,
        discount,
        finalTotal,
        paidAmount,
        date: new Date().toISOString(),
        status: (paidAmount >= finalTotal ? 'completed' : 'pending') as 'completed' | 'pending',
        ...(selectedBranchId != null ? { branch_id: Number(selectedBranchId) } : {}),
      };

      let saved: InvoiceRecord;
      if (editingDraft?.id) {
        saved = await updateInvoice(editingDraft.id, payload);
        showToast('تم حفظ تعديلات الفاتورة');
      } else {
        const res = await createInvoice(payload);
        saved = res.invoice;
        showToast('تم إنشاء الفاتورة بنجاح');
      }
      saved.items = payloadItems;
      onSaved(saved);
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
      title={editingDraft ? `تعديل الفاتورة ${formatInvoiceCode(editingDraft.invoice_number)}` : 'إنشاء فاتورة جديدة'}
    >
      <ScrollView
        style={{ maxHeight: 450 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={{ gap: 10 }}>
          {/* ملخص سريع لما في السلة */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: colors.brandSoft,
              borderColor: colors.brandBorder,
              borderWidth: 1,
              borderRadius: 12,
              paddingVertical: 9,
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ color: colors.brandBright, fontFamily: FONT.bold, fontSize: 12.5 }}>
              {items.length} {items.length === 1 ? 'بند' : 'بنود'} في الفاتورة
            </Text>
            <Text style={{ color: colors.brandLight, fontFamily: FONT.bold, fontSize: 13 }}>
              {formatDinar(total)}
            </Text>
          </View>

          <SectionTitle>بيانات الزبون</SectionTitle>
          <AppInput
            label="اسم العميل *"
            placeholder="أدخل الاسم الكامل"
            value={name}
            icon="user"
            error={attempted && !name.trim() ? 'الاسم مطلوب' : null}
            onChangeText={setName}
          />
          <AppInput
            label="رقم الهاتف *"
            placeholder="09X XXX XXXX"
            keyboard="phone-pad"
            icon="phone"
            value={phone}
            error={attempted && !phone.trim() ? 'رقم الهاتف مطلوب' : null}
            onChangeText={setPhone}
          />
          <AppInput
            label="ملاحظات (اختياري)"
            placeholder="أي ملاحظات على الطلب..."
            value={notes}
            multiline
            onChangeText={setNotes}
          />

          <SectionTitle>الدفع</SectionTitle>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
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
            <View style={{ flex: 1 }}>
              <AppInput
                label="المبلغ المدفوع (د.ل)"
                placeholder="0"
                keyboard="numeric"
                value={paidText}
                onChangeText={setPaidText}
              />
            </View>
          </View>

          {/* أزرار الدفع السريع: الكل / نصف / آجل — الأكتف يميّز الاختيار،
              والتسمية هي من تحمل المعنى (لا لون لكل خيار) */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <QuickPayBtn
              label="الكل (خالص)"
              active={paidAmount === finalTotal}
              onPress={() => setPaidText(String(finalTotal))}
            />
            <QuickPayBtn
              label="نصف القيمة"
              active={paidAmount === finalTotal / 2 && finalTotal > 0}
              onPress={() => setPaidText(String(finalTotal / 2))}
            />
            <QuickPayBtn
              label="آجل (0)"
              active={paidAmount === 0}
              onPress={() => setPaidText('0')}
            />
          </View>

          {/* ملخص الأرقام */}
          <View
            style={{
              backgroundColor: colors.elevatedRaised,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              padding: 12,
              gap: 6,
            }}
          >
            <SummaryLine label="الإجمالي قبل الخصم" value={formatDinar(total)} />
            {discount > 0 ? <SummaryLine label="الخصم" value={formatDinar(discount)} /> : null}
            <SummaryLine label="الصافي المطلوب" value={formatDinar(finalTotal)} highlight />
            {remaining > 0 ? (
              <SummaryLine label="المتبقي (آجل)" value={formatDinar(remaining)} warn />
            ) : null}
          </View>

          {error ? (
            <AppText style={{ color: colors.dangerStrong, fontFamily: FONT.medium }}>{error}</AppText>
          ) : null}

          <AppButton
            label={editingDraft ? 'حفظ التعديلات وفتح الفاتورة' : 'إنشاء الفاتورة والمعاينة للطباعة'}
            icon="printer"
            onPress={handleSave}
            loading={busy}
          />
        </View>
      </ScrollView>
    </ModalSheet>
  );
}

function QuickPayBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        flex: 1,
        minHeight: 44,
        justifyContent: 'center',
        backgroundColor: active ? colors.brand : colors.surfaceRaised,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: active ? colors.brandBorder : colors.borderSubtle,
        paddingVertical: 9,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          color: active ? colors.brandDark : colors.text,
          fontFamily: FONT.bold,
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </ScalePressable>
  );
}

/** عنوان قسم صغير داخل النافذة */
function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        color: '#94a3b8',
        fontFamily: FONT.bold,
        fontSize: 11.5,
        marginTop: 2,
        marginBottom: -2,
      }}
    >
      {children}
    </Text>
  );
}

function SummaryLine({
  label,
  value,
  highlight,
  warn,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: '#cbd5e1', fontFamily: FONT.regular, fontSize: 12 }}>{label}</Text>
      <Text
        style={{
          color: warn ? colors.warningText : highlight ? colors.brandLight : colors.text,
          fontFamily: FONT.bold,
          fontSize: 13,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
