import React, { useMemo, useState } from 'react';
import {
  Alert,
  Animated,
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
import { useScreenEntrance } from '@/components/ui/motion';
import { formatDinar } from '@/lib/money';
import { buildOrderMessage, whatsappLink } from '@/lib/whatsapp';
import { estimateMinutes } from '@/lib/estimate';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { ROW } from '@/lib/rtl';
import { triggerLightHaptic } from '@/lib/colors';

export default function CartScreen() {
  const palette = usePalette();
  const items = useCartStore((s) => s.items);
  const editingInvoice = useCartStore((s) => s.editingInvoice);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const cancelEditingInvoice = useCartStore((s) => s.cancelEditingInvoice);

  /* حياة التنقل: دخول ناعم كل مرة يعود المستخدم إلى السلة */
  const entranceStyle = useScreenEntrance({ durationMs: 240, dy: 12 });

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
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.canvas }]} edges={['top']}>
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
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.canvas }]} edges={['top']}>
      <Animated.View style={[styles.flex, entranceStyle]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { borderBottomColor: palette.surfaceLine }]}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: palette.text }]}>
              {isCashier ? 'فاتورة الكاشير' : 'سلة الطلبات'} ({items.length})
            </Text>
            {isCashier && user ? (
              <View
                style={[
                  styles.cashierPill,
                  { backgroundColor: palette.surfaceRaised, borderColor: palette.surfaceLine },
                ]}
              >
                <Icon name="printer" size={12} color={palette.primary} />
                <Text style={[styles.cashierPillText, { color: palette.primary }]}>
                  كاشير: {user.username}
                </Text>
              </View>
            ) : null}
          </View>
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              clear();
            }}
            style={[styles.clearBtn, { backgroundColor: palette.surfaceRaised }]}
          >
            <Icon name="trash" size={14} color={palette.danger} />
            <Text style={[styles.clearText, { color: palette.danger }]}>تفريغ</Text>
          </Pressable>
        </View>

        {editingInvoice ? (
          <View
            style={[
              styles.editBanner,
              { backgroundColor: palette.surfaceRaised, borderBottomColor: palette.surfaceLine },
            ]}
          >
            <View style={styles.flex1}>
              <Text style={[styles.editBannerTitle, { color: palette.primary }]}>
                تعديل الفاتورة #{editingInvoice.invoice_number}
              </Text>
              <Text style={[styles.editBannerSub, { color: palette.textSub }]}>
                عدّل العناصر ثم اضغط &quot;حفظ التعديلات على الفاتورة&quot; بالأسفل
              </Text>
            </View>
            <Pressable
              onPress={cancelEditingInvoice}
              style={[styles.cancelEditBtn, { borderColor: palette.surfaceLine }]}
            >
              <Text style={[styles.cancelEditText, { color: palette.textSub }]}>إلغاء</Text>
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
            <View
              style={[
                styles.footerCard,
                { backgroundColor: palette.surface, borderColor: palette.surfaceLine },
              ]}
            >
              {sizeGb > 0 ? (
                <View style={styles.summarySubRowBottom}>
                  <Text style={[styles.summarySubLabel, { color: palette.textFaint }]}>الحجم التقريبي</Text>
                  <Text style={[styles.summarySubValue, { color: palette.textSub }]}>
                    {Math.round(sizeGb)} GB (~{estimateMinutes(sizeGb)} دقيقة)
                  </Text>
                </View>
              ) : null}
              {isCashier ? (
                <View
                  style={[
                    styles.cashierHintBox,
                    { backgroundColor: palette.surfaceRaised, borderColor: palette.surfaceLine },
                  ]}
                >
                  <Icon name="invoice" size={16} color={palette.primary} />
                  <Text style={[styles.cashierHintText, { color: palette.textSub }]}>
                    وضع الكاشير: اضغط «إنشاء فاتورة» بالأسفل لإدخال اسم العميل أو الخصم وحالة الدفع وطباعة الفاتورة فوراً.
                  </Text>
                </View>
              ) : branches.length > 0 ? (
                <View style={styles.branchPickWrap}>
                  <Text style={[styles.sectionTitle, { color: palette.text }]}>
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
                          onPress={() => {
                            triggerLightHaptic();
                            selectBranch(b.id);
                          }}
                          style={[
                            styles.branchPill,
                            { backgroundColor: palette.surfaceRaised, borderColor: palette.surfaceLine },
                            active && { backgroundColor: palette.primary, borderColor: palette.primary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.branchPillText,
                              { color: palette.textSub },
                              active && { color: palette.onPrimary, fontFamily: AR_FONT.bold },
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
            </View>
          }
        />

        {/* شريط سفلي ثابت */}
        {items.length > 0 ? (
          <View
            style={[
              styles.bottomBar,
              { backgroundColor: palette.canvas, borderTopColor: palette.surfaceLine },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: palette.textSub }]}>الإجمالي الكلي</Text>
              <Text style={[styles.summaryValue, { color: palette.text }]}>{formatDinar(total)}</Text>
            </View>
            {isCashier ? (
              <AppButton
                label={
                  editingInvoice
                    ? `حفظ التعديلات على الفاتورة ${formatInvoiceCode(editingInvoice.invoice_number)}`
                    : 'إنشاء فاتورة وطباعتها'
                }
                icon="printer"
                onPress={() => setInvoiceOpen(true)}
              />
            ) : (
              <View style={styles.actionsCol}>
                <Pressable
                  onPress={sendWhatsApp}
                  style={[styles.waBtn, { backgroundColor: palette.accent }]}
                >
                  <Icon name="phone" size={18} color={palette.onAccent} />
                  <Text style={[styles.waBtnText, { color: palette.onAccent }]}>
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
            )}
          </View>
        ) : null}

        <InvoiceFormModal
          visible={invoiceOpen}
          onClose={() => setInvoiceOpen(false)}
          items={items}
          editingDraft={editingInvoice}
          onSaved={(inv) => {
            setInvoiceOpen(false);
            clear();
            /** سباق أندرويد: Modal يُفتح في نفس الفريم الذي يُغلق فيه Modal آخر
                يُتجاهَل صامتاً — نؤجّل فتح درج الطباعة حتى يُزال نافذة النموذج */
            setTimeout(() => setReceiptInvoice(inv), 180);
          }}
        />

        <NativeReceiptModal
          visible={Boolean(receiptInvoice)}
          invoice={receiptInvoice}
          onClose={() => setReceiptInvoice(null)}
          autoPrint
        />
      </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
  },
  headerTitleRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: AR_FONT.bold,
    fontSize: 18,
    includeFontPadding: false,
  },
  cashierPill: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  cashierPillText: {
    fontFamily: AR_FONT.bold,
    fontSize: 11,
    includeFontPadding: false,
  },
  clearBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  clearText: {
    fontFamily: AR_FONT.bold,
    fontSize: 12,
    includeFontPadding: false,
  },
  editBanner: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  editBannerTitle: {
    fontFamily: AR_FONT.bold,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  editBannerSub: {
    fontFamily: AR_FONT.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  cancelEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelEditText: {
    fontFamily: AR_FONT.bold,
    fontSize: 12,
    includeFontPadding: false,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  footerCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginTop: 6,
  },
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: AR_FONT.bold,
    fontSize: 15,
    includeFontPadding: false,
  },
  summaryValue: {
    fontFamily: AR_FONT.bold,
    fontSize: 22,
    includeFontPadding: false,
  },
  summarySubRowBottom: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summarySubLabel: {
    fontFamily: AR_FONT.regular,
    fontSize: 12,
    includeFontPadding: false,
  },
  summarySubValue: {
    fontFamily: AR_FONT.medium,
    fontSize: 12,
    includeFontPadding: false,
  },
  cashierHintBox: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  cashierHintText: {
    flex: 1,
    fontFamily: AR_FONT.medium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  guestSection: {
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
    borderWidth: 1,
  },
  branchPillText: {
    fontFamily: AR_FONT.medium,
    fontSize: 12,
    includeFontPadding: false,
  },
  sectionTitle: {
    fontFamily: AR_FONT.bold,
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
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  waBtnText: {
    fontFamily: AR_FONT.bold,
    fontSize: 15,
    includeFontPadding: false,
  },
});
