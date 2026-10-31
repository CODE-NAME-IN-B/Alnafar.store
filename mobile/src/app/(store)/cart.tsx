import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { fetchBranches } from '@/api/branches';
import { formatInvoiceCode } from '@/components/ui/LtrText';
import { fetchInvoiceSettings } from '@/api/settings';
import { submitOrder, trackOrder } from '@/api/orders';
import { InvoiceRecord } from '@/api/invoices';
import {
  cartTotal,
  cartTotalSizeGb,
  useCartStore,
} from '@/stores/cart';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import CartRow from '@/components/store/CartRow';
import InvoiceFormModal from '@/components/invoice/InvoiceFormModal';
import NativeReceiptModal from '@/components/invoice/NativeReceiptModal';
import AppButton from '@/components/ui/AppButton';
import Icon from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/StateView';
import { formatDinar } from '@/lib/money';
import { buildOrderMessage, whatsappLink } from '@/lib/whatsapp';
import { estimateMinutes } from '@/lib/estimate';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';

export default function CartScreen() {
  const items = useCartStore((s) => s.items);
  const editingInvoice = useCartStore((s) => s.editingInvoice);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const cancelEditingInvoice = useCartStore((s) => s.cancelEditingInvoice);

  const selectedBranchId = useAppStore((s) => s.selectedBranchId);
  const selectBranch = useAppStore((s) => s.selectBranch);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [receiptInvoice, setReceiptInvoice] = useState<InvoiceRecord | null>(null);

  const settingsQ = useQuery({
    queryKey: ['invoice-settings'],
    queryFn: fetchInvoiceSettings,
  });
  const branchesQ = useQuery({
    queryKey: ['branches'],
    queryFn: fetchBranches,
  });

  const branches = useMemo(() => branchesQ.data ?? [], [branchesQ.data]);
  const branch = useMemo(
    () =>
      branches.find((b) => b.id === selectedBranchId) ??
      branches.find((b) => b.is_main) ??
      branches[0] ??
      null,
    [branches, selectedBranchId]
  );

  const total = cartTotal(items);
  const sizeGb = cartTotalSizeGb(items);
  const isCashier = Boolean(token);

  /* مثل الموقع: بعد إنشاء الفاتورة تفتح واجهة الطباعة مباشرة مع رقمها من التتبع */
  const openReceiptAfterSubmit = async (orderId: number) => {
    try {
      const tracked = await trackOrder(orderId);
      setReceiptInvoice({
        id: orderId,
        invoice_number: tracked.invoice_number,
        customer_name: tracked.customer_name ?? null,
        customer_phone: tracked.customer_phone ?? null,
        status: tracked.status,
        total: tracked.total,
        discount: tracked.discount ?? null,
        final_total: tracked.final_total ?? null,
        paid_amount: tracked.paid_amount ?? null,
        items: (tracked.items ?? []).map((it) => ({
          title: it.title,
          price: it.price,
          type: 'game' as const,
          size_gb: it.size_gb ?? null,
          quantity: it.quantity ?? 1,
        })),
      });
    } catch {
      Alert.alert(
        'تم إصدار الفاتورة',
        `رقم الطلب: #${orderId}\nيمكنك متابعة حالة الطلب من شاشة التتبع.`,
        [
          {
            text: 'فتح التتبع',
            onPress: () => router.push(`/track/${encodeURIComponent(String(orderId))}`),
          },
          { text: 'حسناً' },
        ]
      );
    }
  };

  const orderM = useMutation({
    mutationFn: () =>
      submitOrder({
        games: items.map((it) => ({
          title: it.title,
          price: it.price,
          type: it.type,
          size_gb: it.sizeGb ?? null,
          quantity: it.quantity,
        })),
        customer_phone:
          branch?.phone?.split('-')[0]?.trim() ||
          settingsQ.data?.store_phone ||
          '0910683599',
      }),
    onSuccess: (res) => {
      clear();
      void openReceiptAfterSubmit(res.id);
    },
    onError: (e: unknown) => {
      Alert.alert('خطأ', e instanceof Error ? e.message : 'فشل إرسال الطلب');
    },
  });

  const sendWhatsApp = () => {
    const rawPhone =
      branch?.phone?.split('-')[0]?.trim() ||
      settingsQ.data?.store_phone ||
      '0910683599';
    const msg = buildOrderMessage(
      items.map((it) => ({
        title: `${it.title}${it.platform ? ` (${it.platform === 'PS5' ? 'فايف' : 'فور'})` : ''}`,
        price: it.price * it.quantity,
        sizeGb: it.sizeGb,
        quantity: it.quantity,
      })),
      total
    );
    const url = whatsappLink(rawPhone, msg);
    Linking.openURL(url).catch(() =>
      Alert.alert('خطأ', 'تعذر فتح تطبيق واتساب')
    );
  };

  if (!items.length) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          message={
            isCashier
              ? 'قائمة الفاتورة فارغة — اختر الألعاب من المتجر لإصدار فاتورة كاشير جديدة'
              : 'السلة فارغة — أضف ألعاباً أو باقات من المتجر للبدء في طلبك'
          }
          icon="cart"
          actionLabel="تصفح الألعاب"
          onAction={() => router.navigate('/(store)')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>
              {isCashier ? 'فاتورة الكاشير' : 'سلة الطلبات'} ({items.length})
            </Text>
            {isCashier && user ? (
              <View style={styles.cashierPill}>
                <Icon name="printer" size={12} color="#042f2e" />
                <Text style={styles.cashierPillText}>كاشير: {user.username}</Text>
              </View>
            ) : null}
          </View>
          <Pressable onPress={clear} style={styles.clearBtn}>
            <Icon name="trash" size={14} color="#fda4af" />
            <Text style={styles.clearText}>تفريغ</Text>
          </Pressable>
        </View>

        {editingInvoice ? (
          <View style={styles.editBanner}>
            <View style={styles.flex1}>
              <Text style={styles.editBannerTitle}>
                تعديل الفاتورة #{editingInvoice.invoice_number}
              </Text>
              <Text style={styles.editBannerSub}>
                عدّل العناصر ثم اضغط &quot;حفظ التعديلات على الفاتورة&quot; بالأسفل
              </Text>
            </View>
            <Pressable
              onPress={cancelEditingInvoice}
              style={styles.cancelEditBtn}
            >
              <Text style={styles.cancelEditText}>إلغاء</Text>
            </Pressable>
          </View>
        ) : null}

        <FlatList
          data={items}
          keyExtractor={(it) => it.key}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <CartRow
              item={item}
              onDecrement={() => decrement(item.key)}
              onRemove={() => removeItem(item.key)}
            />
          )}
          ListFooterComponent={
            <View style={styles.footerCard}>
              {/* Totals Summary */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>الإجمالي الكلي</Text>
                <Text style={styles.summaryValue}>{formatDinar(total)}</Text>
              </View>
              {sizeGb > 0 ? (
                <View style={styles.summarySubRow}>
                  <Text style={styles.summarySubLabel}>الحجم التقريبي</Text>
                  <Text style={styles.summarySubValue}>
                    {Math.round(sizeGb)} GB (~{estimateMinutes(sizeGb)} دقيقة)
                  </Text>
                </View>
              ) : null}

              {/* CASHIER ONLY VIEW vs GUEST ONLY VIEW */}
              {isCashier ? (
                <View style={styles.cashierSection}>
                  <View style={styles.cashierHintBox}>
                    <Icon name="invoice" size={16} color="#2dd4bf" />
                    <Text style={styles.cashierHintText}>
                      وضع الكاشير: اضغط بالأسفل لإدخال اسم العميل أو الخصم وحالة الدفع وطباعة الفاتورة فوراً.
                    </Text>
                  </View>

                  <AppButton
                    label={
                      editingInvoice
                        ? `حفظ التعديلات على الفاتورة ${formatInvoiceCode(editingInvoice.invoice_number)}`
                        : 'إنشاء فاتورة وطباعتها'
                    }
                    icon="printer"
                    onPress={() => setInvoiceOpen(true)}
                  />
                </View>
              ) : (
                <View style={styles.guestSection}>
                  {/* Branch selector for Guest order */}
                  {branches.length > 0 ? (
                    <View style={styles.branchPickWrap}>
                      <Text style={styles.sectionTitle}>
                        أرسل الطلب إلى الفرع:
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.branchPillsRow}
                      >
                        {branches.map((b) => {
                          const active = (branch?.id ?? selectedBranchId) === b.id;
                          return (
                            <Pressable
                              key={b.id}
                              onPress={() => selectBranch(b.id)}
                              style={[
                                styles.branchPill,
                                active && styles.branchPillActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.branchPillText,
                                  active && styles.branchPillTextActive,
                                ]}
                              >
                                {b.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  ) : null}

                  <View style={styles.actionsCol}>
                    <Pressable onPress={sendWhatsApp} style={styles.waBtn}>
                      <Icon name="phone" size={18} color="#052e16" />
                      <Text style={styles.waBtnText}>
                        إرسال الطلب عبر واتساب
                      </Text>
                    </Pressable>

                    <AppButton
                      label="إرسال الطلب للمتجر (مع تتبع QR)"
                      icon="qr"
                      variant="secondary"
                      loading={orderM.isPending}
                      onPress={() => orderM.mutate()}
                    />
                  </View>
                </View>
              )}
            </View>
          }
        />

        <InvoiceFormModal
          visible={invoiceOpen}
          onClose={() => setInvoiceOpen(false)}
          items={items}
          editingDraft={editingInvoice}
          onSaved={(inv) => {
            setInvoiceOpen(false);
            clear();
            setReceiptInvoice(inv);
          }}
        />

        <NativeReceiptModal
          visible={Boolean(receiptInvoice)}
          invoice={receiptInvoice}
          onClose={() => setReceiptInvoice(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#090f1d',
  },
  flex: { flex: 1 },
  flex1: { flex: 1 },
  header: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitleRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 18,
    includeFontPadding: false,
  },
  cashierPill: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2dd4bf',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  cashierPillText: {
    fontFamily: FONT.bold,
    color: '#042f2e',
    fontSize: 11,
    includeFontPadding: false,
  },
  clearBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#2a1215',
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  clearText: {
    fontFamily: FONT.bold,
    color: '#fda4af',
    fontSize: 12,
    includeFontPadding: false,
  },
  editBanner: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2e1065',
    borderBottomWidth: 1,
    borderBottomColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  editBannerTitle: {
    fontFamily: FONT.bold,
    color: '#ddd6fe',
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  editBannerSub: {
    fontFamily: FONT.regular,
    color: '#c4b5fd',
    fontSize: 11,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  cancelEditBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#4c1d95',
  },
  cancelEditText: {
    fontFamily: FONT.bold,
    color: '#f5f3ff',
    fontSize: 11,
    includeFontPadding: false,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  footerCard: {
    backgroundColor: '#131d31',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 6,
  },
  summaryRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontFamily: FONT.bold,
    color: '#cbd5e1',
    fontSize: 15,
    includeFontPadding: false,
  },
  summaryValue: {
    fontFamily: FONT.bold,
    color: '#2dd4bf',
    fontSize: 22,
    includeFontPadding: false,
  },
  summarySubRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summarySubLabel: {
    fontFamily: FONT.regular,
    color: '#94a3b8',
    fontSize: 12,
    includeFontPadding: false,
  },
  summarySubValue: {
    fontFamily: FONT.semibold,
    color: '#cbd5e1',
    fontSize: 12,
    includeFontPadding: false,
  },
  cashierSection: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 14,
    gap: 12,
  },
  cashierHintBox: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#072a28',
    borderWidth: 1,
    borderColor: '#14b8a6',
    borderRadius: 12,
    padding: 12,
  },
  cashierHintText: {
    flex: 1,
    fontFamily: FONT.medium,
    color: '#ccfbf1',
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  guestSection: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 14,
    gap: 14,
  },
  branchPickWrap: {
    gap: 8,
  },
  branchPillsRow: {
    flexDirection: ROW,
    gap: 8,
  },
  branchPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#0b1324',
    borderWidth: 1.5,
    borderColor: '#1e293b',
  },
  branchPillActive: {
    backgroundColor: '#082f2d',
    borderColor: '#14b8a6',
  },
  branchPillText: {
    fontFamily: FONT.semibold,
    color: '#cbd5e1',
    fontSize: 12,
    includeFontPadding: false,
  },
  branchPillTextActive: {
    fontFamily: FONT.bold,
    color: '#5eead4',
  },
  sectionTitle: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  actionsCol: {
    gap: 10,
    marginTop: 4,
  },
  waBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#22c55e',
    borderWidth: 1,
    borderColor: '#4ade80',
    paddingHorizontal: 16,
  },
  waBtnText: {
    fontFamily: FONT.bold,
    color: '#052e16',
    fontSize: 15,
    includeFontPadding: false,
  },
});
