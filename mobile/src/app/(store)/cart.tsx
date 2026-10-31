import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import Screen from '@/components/ui/Screen';
import AppText from '@/components/ui/AppText';
import AppButton from '@/components/ui/AppButton';
import AppInput from '@/components/ui/AppInput';
import ModalSheet from '@/components/ui/ModalSheet';
import { EmptyState } from '@/components/ui/StateView';
import CartRow from '@/components/store/CartRow';
import InvoiceFormModal from '@/components/invoice/InvoiceFormModal';
import NativeReceiptModal from '@/components/invoice/NativeReceiptModal';
import { cartTotal, cartTotalSizeGb, useCartStore, type CartItem } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import { submitOrder } from '@/api/orders';
import { fetchBranches } from '@/api/branches';
import { fetchSettings } from '@/api/settings';
import type { InvoiceRecord } from '@/api/invoices';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { estimateMinutes } from '@/lib/estimate';
import { buildOrderMessage, whatsappLink, type MessageItem } from '@/lib/whatsapp';
import { apiErrorText } from '@/api/client';
import { showToast } from '@/lib/toast';

/** شاشة السلة: بنود + إنشاء فاتورة للموظف أو إرسال طلب للزبون */
export default function CartScreen() {
  const items = useCartStore((s) => s.items);
  const editingInvoice = useCartStore((s) => s.editingInvoice);
  const removeItem = useCartStore((s) => s.removeItem);
  const decrement = useCartStore((s) => s.decrement);
  const clear = useCartStore((s) => s.clear);
  const token = useAuthStore((s) => s.token);
  const selectedBranchId = useAppStore((s) => s.selectedBranchId);

  const total = cartTotal(items);
  const totalSize = cartTotalSizeGb(items);
  const minutes = estimateMinutes(totalSize);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<InvoiceRecord | null>(null);
  const [success, setSuccess] = useState<{
    id: number;
    items: CartItem[];
    total: number;
  } | null>(null);

  const settings = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    staleTime: 10 * 60_000,
  });
  const branches = useQuery({
    queryKey: ['branches'],
    queryFn: fetchBranches,
    staleTime: 5 * 60_000,
  });

  const selectedBranch = (branches.data ?? []).find(
    (b) => Number(b.id) === Number(selectedBranchId)
  );
  const waPhone = (
    selectedBranch?.phone ||
    settings.data?.whatsapp_number ||
    '218920595447'
  ).replace(/[^\d]/g, '');

  const { control, handleSubmit } = useForm<{ name: string; phone: string }>({
    defaultValues: { name: '', phone: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    const phone = values.phone.replace(/\D/g, '');
    if (phone.length < 8) {
      setError('رقم الهاتف غير صحيح');
      return;
    }
    if (!items.length) return;

    setBusy(true);
    setError(null);
    try {
      const result = await submitOrder({
        games: items.map(toPayloadItem),
        customer_name: values.name.trim() || null,
        customer_phone: phone,
      });
      setSuccess({ id: result.id, items: [...items], total });
      clear();
    } catch (err) {
      setError(apiErrorText(err));
    } finally {
      setBusy(false);
    }
  });

  return (
    <Screen>
      <View style={headerRow}>
        <AppText style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 18 }}>السلة</AppText>
        {items.length ? (
          <Pressable
            onPress={() => {
              clear();
              showToast('فُرّغت السلة');
            }}
          >
            <Text style={{ color: '#ef4444', fontFamily: FONT.medium }}>تفريغ</Text>
          </Pressable>
        ) : null}
      </View>

      {!items.length ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            message="سلتك فارغة — تصفّح ألعابنا وأضف ما يناسبك"
            icon="🛒"
            actionLabel="تصفح المتجر"
            onAction={() => router.replace('/(store)')}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => (
            <CartRow
              key={item.key}
              item={item}
              onDecrement={() => decrement(item.key)}
              onRemove={() => removeItem(item.key)}
            />
          ))}

          <View style={summary}>
            <Row label="عدد العناصر" value={String(items.length)} />
            <Row label="الإجمالي" value={formatDinar(total)} strong />
            <Row label="إجمالي الحجم" value={`${Math.round(totalSize)} GB`} />
            <Row label="التجهيز التقديري" value={`${minutes} دقيقة`} />
          </View>

          {token ? (
            <View style={[summary, { borderColor: 'rgba(138,92,255,0.35)' }]}>
              <AppText style={{ color: '#c4b5fd', fontFamily: FONT.bold, fontSize: 14 }}>
                {editingInvoice
                  ? `تعديل الفاتورة #${editingInvoice.invoice_number}`
                  : 'خيار الموظف / الكاشير'}
              </AppText>
              <AppButton
                label={
                  editingInvoice
                    ? `حفظ التعديلات على الفاتورة #${editingInvoice.invoice_number}`
                    : '🧾 إنشاء فاتورة وطباعتها'
                }
                onPress={() => setInvoiceModalOpen(true)}
              />
            </View>
          ) : null}

          <AppText style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 16, marginTop: 6 }}>
            بيانات طلب الزبون
          </AppText>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <AppInput
                label="الاسم (اختياري)"
                placeholder="اسم الزبون"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange } }) => (
              <AppInput
                label="رقم الهاتف *"
                placeholder="09X XXX XXXX"
                value={value}
                keyboard="phone-pad"
                onChangeText={onChange}
                error={error}
              />
            )}
          />

          <View style={{ marginTop: 6, gap: 8, marginBottom: 36 }}>
            <AppButton
              label="إرسال الطلب"
              onPress={onSubmit}
              loading={busy}
              testID="order-submit"
            />
            <AppButton
              label={`إرسال عبر واتساب (${selectedBranch?.name || 'الفرع الرئيسي'})`}
              variant="secondary"
              onPress={() => {
                const msg = buildOrderMessage(items.map(toMessageItem), total);
                Linking.openURL(whatsappLink(waPhone, msg)).catch(() =>
                  showToast('تعذر فتح واتساب', 'error')
                );
              }}
            />
          </View>
        </ScrollView>
      )}

      <InvoiceFormModal
        visible={invoiceModalOpen}
        items={items}
        editingDraft={editingInvoice}
        onClose={() => setInvoiceModalOpen(false)}
        onSaved={(inv) => {
          setInvoiceModalOpen(false);
          clear();
          setSavedInvoice(inv);
        }}
      />

      <NativeReceiptModal
        visible={!!savedInvoice}
        invoice={savedInvoice}
        onClose={() => setSavedInvoice(null)}
      />

      <ModalSheet visible={!!success} onClose={() => setSuccess(null)} title="تم إرسال الطلب">
        {success ? (
          <View style={{ gap: 12 }}>
            <AppText style={{ color: '#22c55e', fontFamily: FONT.bold, fontSize: 16 }}>
              استلمنا طلبك رقم {success.id}
            </AppText>
            <AppButton
              label="تتبع حالة الطلب الآن"
              onPress={() => {
                const id = success.id;
                setSuccess(null);
                router.push(`/track/${id}`);
              }}
            />
            <AppButton
              label="متابعة عبر واتساب"
              variant="secondary"
              onPress={() => {
                const msg = buildOrderMessage(success.items.map(toMessageItem), success.total);
                Linking.openURL(whatsappLink(waPhone, msg)).catch(() =>
                  showToast('تعذر فتح واتساب', 'error')
                );
              }}
            />
          </View>
        ) : null}
      </ModalSheet>
    </Screen>
  );
}

function toPayloadItem(item: CartItem) {
  return {
    title: item.title,
    price: item.price,
    type: item.type,
    size_gb: item.type === 'game' ? item.sizeGb ?? null : null,
    quantity: item.quantity,
  };
}

function toMessageItem(item: CartItem): MessageItem {
  return {
    title: item.title,
    price: item.price * item.quantity,
    sizeGb: item.type === 'game' ? item.sizeGb ?? null : null,
    quantity: item.quantity,
  };
}

const headerRow = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  paddingHorizontal: 16,
  paddingBottom: 10,
};

const summary = {
  backgroundColor: '#141e30',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
  padding: 14,
  gap: 8,
} as const;

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <AppText style={{ color: '#94a3b8', fontFamily: FONT.regular }}>{label}</AppText>
      <AppText style={{ color: strong ? '#14b8a6' : '#f1f5f9', fontFamily: FONT.bold }}>
        {value}
      </AppText>
    </View>
  );
}
