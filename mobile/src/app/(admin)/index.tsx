import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import Chip from '@/components/ui/Chip';
import Icon from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';
import { ROW } from '@/lib/rtl';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminInvoicesScreen() {
  const branchScope = useAppStore((s) => s.adminScopeBranchId);
  const user = useAuthStore((s) => s.user);
  const startEditingInvoice = useCartStore((s) => s.startEditingInvoice);

  const [date, setDate] = useState(todayIso());
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [includeUnpaid, setIncludeUnpaid] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<InvoiceRecord | null>(null);
  const [busyBulk, setBusyBulk] = useState(false);

  const invoicesQuery = useQuery({
    queryKey: ['admin-invoices', { date, unpaidOnly, includeUnpaid, branchScope }],
    queryFn: () =>
      fetchInvoices({
        date: unpaidOnly ? undefined : date,
        unpaidOnly: unpaidOnly ? '1' : '0',
        includeUnpaid: includeUnpaid ? '1' : '0',
        branchId: branchScope === 'all' ? undefined : branchScope,
      }),
  });

  const summaryQuery = useQuery({
    queryKey: ['admin-invoices-summary', { date, branchScope }],
    queryFn: () =>
      fetchInvoicesSummary({
        dateFrom: date,
        dateTo: date,
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
        unpaidOnly ? {} : { dateFrom: date, dateTo: date, includeUnpaid }
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
    <View style={styles.screen}>
      <View style={styles.filterHeader}>
        {/* شريط التاريخ والفلاتر */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScroll}
        >
          <View style={styles.dateInputWrap}>
            <Icon name="calendar" size={14} color="#2dd4bf" />
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              style={styles.dateInput}
            />
          </View>
          <Chip
            label="اليوم"
            active={!unpaidOnly && date === todayIso()}
            onPress={() => {
              setUnpaidOnly(false);
              setDate(todayIso());
            }}
          />
          <Chip
            label="كل الآجل"
            active={unpaidOnly}
            onPress={() => setUnpaidOnly((v) => !v)}
          />
          <Chip
            label="مع المرحّل"
            active={includeUnpaid && !unpaidOnly}
            onPress={() => setIncludeUnpaid((v) => !v)}
          />
        </ScrollView>

        {/* شريط البحث وزر تسديد الكل */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color="#94a3b8" />
            <TextInput
              value={searchQ}
              onChangeText={setSearchQ}
              placeholder="بحث برقم الفاتورة أو اسم العميل أو الهاتف..."
              placeholderTextColor="#94a3b8"
              textAlign="right"
              style={styles.searchInput}
            />
            {searchQ ? (
              <Pressable onPress={() => setSearchQ('')} hitSlop={8}>
                <Icon name="close" size={15} color="#94a3b8" />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => void handleBulkPay()}
            style={styles.bulkPayBtn}
          >
            <Icon name="cash" size={15} color="#042f2e" />
            <Text style={styles.bulkPayText}>
              {busyBulk ? '...' : 'تسديد الكل'}
            </Text>
          </Pressable>
        </View>

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
      </View>

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
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={styles.miniStatVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  filterHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  dateScroll: {
    flexDirection: ROW,
    gap: 6,
    alignItems: 'center',
  },
  dateInputWrap: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#131c2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 10,
    height: 36,
  },
  dateInput: {
    color: '#f8fafc',
    fontFamily: FONT.bold,
    fontSize: 12.5,
    minWidth: 88,
    paddingVertical: 2,
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
    backgroundColor: '#131c2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 10,
    height: 42,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontFamily: FONT.medium,
    fontSize: 13,
    paddingVertical: 4,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  bulkPayBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#34d399',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
  },
  bulkPayText: {
    color: '#042f2e',
    fontFamily: FONT.bold,
    fontSize: 12.5,
    includeFontPadding: false,
  },
  statsRow: {
    flexDirection: ROW,
    gap: 6,
  },
  miniStat: {
    flex: 1,
    backgroundColor: '#131c2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  miniStatLabel: {
    color: '#94a3b8',
    fontFamily: FONT.medium,
    fontSize: 10.5,
    includeFontPadding: false,
  },
  miniStatVal: {
    color: '#2dd4bf',
    fontFamily: FONT.bold,
    fontSize: 13,
    includeFontPadding: false,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
});
