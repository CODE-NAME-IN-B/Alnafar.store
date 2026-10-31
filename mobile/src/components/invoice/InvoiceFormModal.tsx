import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import ModalSheet from '@/components/ui/ModalSheet';
import AppInput from '@/components/ui/AppInput';
import AppButton from '@/components/ui/AppButton';
import AppText from '@/components/ui/AppText';
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
  }, [visible, editingDraft, total]);

  const handleSave = async () => {
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
          <AppInput
            label="اسم العميل *"
            placeholder="أدخل الاسم الكامل"
            value={name}
            icon="user"
            onChangeText={setName}
          />
          <AppInput
            label="رقم الهاتف *"
            placeholder="09X XXX XXXX"
            keyboard="phone-pad"
            icon="phone"
            value={phone}
            onChangeText={setPhone}
          />
          <AppInput
            label="ملاحظات (اختياري)"
            placeholder="أي ملاحظات على الطلب..."
            value={notes}
            onChangeText={setNotes}
          />

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

          {/* أزرار الدفع السريع: الكل / نصف / آجل */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <QuickPayBtn
              label="الكل (خالص)"
              active={paidAmount === finalTotal}
              color="#16a34a"
              onPress={() => setPaidText(String(finalTotal))}
            />
            <QuickPayBtn
              label="نصف القيمة"
              active={paidAmount === finalTotal / 2 && finalTotal > 0}
              color="#2563eb"
              onPress={() => setPaidText(String(finalTotal / 2))}
            />
            <QuickPayBtn
              label="آجل (0)"
              active={paidAmount === 0}
              color="#d97706"
              onPress={() => setPaidText('0')}
            />
          </View>

          {/* ملخص الأرقام */}
          <View
            style={{
              backgroundColor: '#0f1829',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
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
            <AppText style={{ color: '#f87171', fontFamily: FONT.medium }}>{error}</AppText>
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
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: active ? color : '#1b2b48',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)',
        paddingVertical: 9,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          color: '#ffffff',
          fontFamily: FONT.bold,
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </Pressable>
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
          color: warn ? '#fbbf24' : highlight ? '#2dd4bf' : '#f8fafc',
          fontFamily: FONT.bold,
          fontSize: 13,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
