import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import {
  deleteInvoice,
  fetchInvoices,
  fetchInvoicesSummary,
  markInvoiceUnpaid,
  parseInvoiceItems,
  payAllUnpaidInvoices,
  recordInvoicePayment,
  type InvoiceRecord,
} from '@/api/invoices';
import { apiErrorText } from '@/api/client';
import { formatInvoiceCode } from '@/components/ui/LtrText';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useCartStore, type CartItem } from '@/stores/cart';
import AdminInvoiceCard from '@/components/admin/AdminInvoiceCard';
import NativeReceiptModal from '@/components/invoice/NativeReceiptModal';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateView';
import ModalSheet from '@/components/ui/ModalSheet';
import Chip from '@/components/ui/Chip';
import Icon from '@/components/ui/Icon';
import { ScalePressable } from '@/components/ui/motion';
import DatePickerSheet from '@/components/ui/DatePickerSheet';
import { colors } from '@/lib/colors';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';
import { ROW } from '@/lib/rtl';
import { usePalette } from '@/design/theme';
import { AR_FONT } from '@/design/fonts';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminInvoicesScreen() {
  const palette = usePalette();
  const branchScope = useAppStore((s) => s.adminScopeBranchId);
  const user = useAuthStore((s) => s.user);
  const startEditingInvoice = useCartStore((s) => s.startEditingInvoice);

  /** التاريخ الافتراضي = اليوم؛ التقويم يسمح بيوم واحد أو مدى من–إلى */
  const [dateFrom, setDateFrom] = useState<string | null>(todayIso());
  const [dateTo, setDateTo] = useState<string | null>(todayIso());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [includeUnpaid, setIncludeUnpaid] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<InvoiceRecord | null>(null);
  const [busyBulk, setBusyBulk] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  /** هل غيّر المستخدم شيئاً عن الوضع الافتراضي (اليوم) — لنقطة تنبيه على زر الخيارات */
  const optionsDirty =
    unpaidOnly || dateFrom !== todayIso() || dateTo !== todayIso();

  const invoicesQuery = useQuery({
    queryKey: ['admin-invoices', { dateFrom, dateTo, unpaidOnly, includeUnpaid, branchScope }],
    queryFn: () =>
      fetchInvoices({
        dateFrom: unpaidOnly ? undefined : (dateFrom ?? undefined),
        dateTo: unpaidOnly ? undefined : (dateTo ?? undefined),
        unpaidOnly: unpaidOnly ? '1' : '0',
        includeUnpaid: includeUnpaid ? '1' : '0',
        branchId: branchScope === 'all' ? undefined : branchScope,
      }),
  });

  const summaryQuery = useQuery({
    queryKey: ['admin-invoices-summary', { dateFrom, dateTo, branchScope }],
    queryFn: () =>
      fetchInvoicesSummary({
        dateFrom: dateFrom ?? undefined,
        dateTo: dateTo ?? dateFrom ?? undefined,
        branchId: branchScope === 'all' ? undefined : branchScope,
      }),
  });

  const filtered = (invoicesQuery.data ?? []).filter((inv) => {
    if (!searchQ.trim()) return true;
    const q = searchQ.trim().toLowerCase();
    return (
      String(inv.invoice_number ?? '').toLowerCase().includes(q) ||
      String(inv.customer_name ?? '').toLowerCase().includes(q) ||
      String(inv.customer_phone ?? '').toLowerCase().includes(q)
    );
  });

  const handleBulkPay = async () => {
    if (busyBulk) return;
    setBusyBulk(true);
    try {
      const res = await payAllUnpaidInvoices(
        unpaidOnly ? {} : { dateFrom: dateFrom ?? undefined, dateTo: dateTo ?? undefined, includeUnpaid }
      );
      showToast(`سُدّدت ${res.paidCount} فاتورة (${formatDinar(res.totalPaid)})`);
      await invoicesQuery.refetch();
      await summaryQuery.refetch();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    } finally {
      setBusyBulk(false);
    }
  };

  const handleSettleSingle = async (inv: InvoiceRecord) => {
    const finalTotal = Math.max(0, Number(inv.total) - Number(inv.discount ?? 0));
    const rem = Math.max(0, finalTotal - Number(inv.paid_amount ?? 0));
    if (rem <= 0) return;
    try {
      await recordInvoicePayment(inv.id, rem);
      showToast(`تم تسديد المتبقي للفاتورة ${formatInvoiceCode(inv.invoice_number)}`);
      await invoicesQuery.refetch();
      await summaryQuery.refetch();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    }
  };

  const handleMarkUnpaid = async (inv: InvoiceRecord) => {
    try {
      await markInvoiceUnpaid(inv.id);
      showToast(`أُعيدت الفاتورة ${formatInvoiceCode(inv.invoice_number)} إلى غير مدفوع`);
      await invoicesQuery.refetch();
      await summaryQuery.refetch();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    }
  };

  const handleEditInStore = (inv: InvoiceRecord) => {
    const rawItems = parseInvoiceItems(inv.items);
    const cartItems: CartItem[] = rawItems.map((it, idx) => ({
      key: `edit:${inv.id}:${idx}`,
      type: it.type ?? 'game',
      refId: Number(it.id ?? idx + 1),
      title: it.title,
      price: Number(it.price) || 0,
      sizeGb: it.size_gb != null ? Number(it.size_gb) : null,
      quantity: Number(it.quantity) || 1,
      platform: (it.platform as 'PS4' | 'PS5' | undefined) ?? undefined,
    }));
    startEditingInvoice(
      {
        id: inv.id,
        invoice_number: inv.invoice_number,
        customer_name: inv.customer_name,
        customer_phone: inv.customer_phone,
        customer_address: inv.customer_address,
        notes: inv.customer_notes ?? inv.notes,
        discount: inv.discount,
        paid_amount: inv.paid_amount,
        status: inv.status,
      },
      cartItems
    );
    showToast(`جاهز لتعديل الفاتورة ${formatInvoiceCode(inv.invoice_number)} في المتجر`);
    router.push('/(store)/cart');
  };

  const handleDelete = async (inv: InvoiceRecord) => {
    try {
      await deleteInvoice(inv.id);
      showToast('حُذفت الفاتورة');
      await invoicesQuery.refetch();
      await summaryQuery.refetch();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: palette.canvas }]}>
      {/* الهيدر المبسّط: سطر واحد فقط ظاهر — البحث + تسديد الكل + إعدادات الفلاتر */}
      <View
        style={[
          styles.filterHeader,
          {
            backgroundColor: palette.canvas,
            borderBottomColor: palette.surfaceLine,
          },
        ]}
      >
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: palette.surface,
                borderColor: palette.surfaceLine,
              },
            ]}
          >
            <Icon name="search" size={16} color={palette.textFaint} />
            <TextInput
              value={searchQ}
              onChangeText={setSearchQ}
              placeholder="بحث: رقم فاتورة، عميل، هاتف..."
              placeholderTextColor={palette.textFaint}
              textAlign="right"
              style={[
                styles.searchInput,
                {
                  color: palette.text,
                  fontFamily: AR_FONT.medium,
                },
              ]}
            />
            {searchQ ? (
              <Pressable onPress={() => setSearchQ('')} hitSlop={8}>
                <Icon name="close" size={15} color={palette.textFaint} />
              </Pressable>
            ) : null}
          </View>

          <ScalePressable
            onPress={() => void handleBulkPay()}
            accessibilityRole="button"
            accessibilityLabel="تسديد كل الفواتير غير المدفوعة"
            style={[
              styles.bulkPayBtn,
              {
                backgroundColor: palette.primary,
                borderColor: palette.primary,
              },
            ]}
          >
            <Icon name="cash" size={14} color={palette.onPrimary} />
            <Text style={[styles.bulkPayText, { color: palette.onPrimary, fontFamily: AR_FONT.bold }]}>
              {busyBulk ? '...' : 'تسديد الكل'}
            </Text>
          </ScalePressable>

          <ScalePressable
            onPress={() => setOptionsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="خيارات القائمة والإحصائيات"
            style={[
              styles.optionsBtn,
              {
                backgroundColor: palette.surface,
                borderColor: palette.surfaceLine,
              },
            ]}
          >
            <Icon
              name="filter"
              size={16}
              color={optionsDirty ? palette.primary : palette.textSub}
            />
            {optionsDirty ? (
              <View style={[styles.optionsDot, { backgroundColor: palette.accent }]} />
            ) : null}
          </ScalePressable>
        </View>
      </View>

      {/* درج خيارات القائمة: التاريخ + شرائح الفلترة + إحصائيات اليوم */}
      <ModalSheet visible={optionsOpen} onClose={() => setOptionsOpen(false)} title="خيارات القائمة">
        <Text style={styles.sheetSectionTitle}>التاريخ والفلترة</Text>
        <Text style={styles.dateHint}>
          اضغط لاختيار يوم واحد أو مدى (من يوم إلى يوم) من التقويم
        </Text>
        <ScalePressable
          onPress={() => setDatePickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="اختيار التاريخ من التقويم"
          style={styles.dateInputWrap}
        >
          <Icon name="calendar" size={14} color={colors.brandLight} />
          <Text style={styles.dateInput}>
            {dateFrom == null
              ? 'كل التواريخ'
              : dateTo && dateTo !== dateFrom
                ? `${dateFrom} ← ${dateTo}`
                : dateFrom}
          </Text>
        </ScalePressable>
        <View style={styles.dateChipsRow}>
          <Chip
            label="اليوم"
            compact
            active={
              !unpaidOnly && dateFrom === todayIso() && dateTo === todayIso()
            }
            onPress={() => {
              setUnpaidOnly(false);
              setDateFrom(todayIso());
              setDateTo(todayIso());
            }}
          />
          <Chip
            label="كل التواريخ"
            compact
            active={!unpaidOnly && dateFrom == null && dateTo == null}
            onPress={() => {
              setUnpaidOnly(false);
              setDateFrom(null);
              setDateTo(null);
            }}
          />
          <Chip
            label="كل الآجل"
            compact
            active={unpaidOnly}
            onPress={() => setUnpaidOnly((v) => !v)}
          />
          <Chip
            label="مع المرحّل"
            compact
            active={includeUnpaid && !unpaidOnly}
            onPress={() => setIncludeUnpaid((v) => !v)}
          />
        </View>

        <Text style={styles.sheetSectionTitle}>إحصائيات اليوم</Text>
        {summaryQuery.data ? (
          <View style={styles.statsRow}>
            <MiniStat
              label="فواتير اليوم"
              value={String(summaryQuery.data.todayInvoices)}
            />
            <MiniStat
              label="مبيعات اليوم"
              value={formatDinar(summaryQuery.data.todayRevenue)}
            />
            <MiniStat
              label="المحصّل"
              value={formatDinar(summaryQuery.data.todayCollectedRevenue)}
            />
          </View>
        ) : null}
      </ModalSheet>

      {/* التقويم: يوم واحد أو مدى من–إلى */}
      <DatePickerSheet
        visible={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        range
        initialFrom={dateFrom}
        initialTo={dateTo}
        onApply={(from, to) => {
          setDateFrom(from);
          setDateTo(to);
        }}
      />

      {invoicesQuery.isLoading ? (
        <LoadingState message="جاري جلب الفواتير..." />
      ) : invoicesQuery.isError ? (
        <ErrorState
          message="تعذر جلب الفواتير"
          onRetry={() => invoicesQuery.refetch()}
        />
      ) : !filtered.length ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            message="لا توجد فواتير مطابقة للبحث أو التاريخ"
            icon="invoice"
          />
        </View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <AdminInvoiceCard
              inv={item}
              isAdmin={user?.role === 'admin'}
              onOpenReceipt={() => setSelectedReceipt(item)}
              onSettle={() => void handleSettleSingle(item)}
              onMarkUnpaid={() => void handleMarkUnpaid(item)}
              onEditInStore={() => handleEditInStore(item)}
              onDelete={() => void handleDelete(item)}
            />
          )}
        />
      )}

      <NativeReceiptModal
        visible={!!selectedReceipt}
        invoice={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.miniStat,
        {
          backgroundColor: palette.surface,
          borderColor: palette.surfaceLine,
        },
      ]}
    >
      <Text style={[styles.miniStatLabel, { color: palette.textSub, fontFamily: AR_FONT.medium }]}>
        {label}
      </Text>
      <Text style={[styles.miniStatVal, { color: palette.money, fontFamily: AR_FONT.bold }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  filterHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  dateInputWrap: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  dateHint: {
    fontFamily: AR_FONT.regular,
    fontSize: 11.5,
    lineHeight: 17,
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dateChipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  dateInput: {
    flex: 1,
    fontFamily: AR_FONT.bold,
    fontSize: 13,
    includeFontPadding: false,
  },
  searchRow: {
    flexDirection: ROW,
    gap: 8,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: ROW,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 42,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: AR_FONT.medium,
    fontSize: 13,
    paddingVertical: 4,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  bulkPayBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  bulkPayText: {
    fontFamily: AR_FONT.bold,
    fontSize: 12,
    includeFontPadding: false,
  },
  optionsBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  optionsDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  sheetSectionTitle: {
    fontFamily: AR_FONT.bold,
    fontSize: 12,
    marginBottom: 8,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: ROW,
    gap: 6,
  },
  miniStat: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  miniStatLabel: {
    fontSize: 10.5,
    includeFontPadding: false,
  },
  miniStatVal: {
    fontSize: 13,
    includeFontPadding: false,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
});
