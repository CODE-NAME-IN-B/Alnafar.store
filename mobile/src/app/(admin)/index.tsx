import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
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
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useCartStore, type CartItem } from '@/stores/cart';
import AdminInvoiceCard from '@/components/admin/AdminInvoiceCard';
import NativeReceiptModal from '@/components/invoice/NativeReceiptModal';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateView';
import Chip from '@/components/ui/Chip';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** تبويب الفواتير في لوحة الإدارة: بطاقات، تسديد مفرد ومجمّع، طباعة وتعديل */
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
      showToast(`تم تسديد المتبقي للفاتورة #${inv.invoice_number}`);
      await invoicesQuery.refetch();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    }
  };

  const handleMarkUnpaid = async (inv: InvoiceRecord) => {
    try {
      await markInvoiceUnpaid(inv.id);
      showToast(`أُعيدت الفاتورة #${inv.invoice_number} إلى غير مدفوع`);
      await invoicesQuery.refetch();
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
    showToast(`جاهز لتعديل الفاتورة #${inv.invoice_number} في المتجر`);
    router.push('/(store)');
  };

  const handleDelete = async (inv: InvoiceRecord) => {
    try {
      await deleteInvoice(inv.id);
      showToast('حُذفت الفاتورة');
      await invoicesQuery.refetch();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f1724' }}>
      <View style={{ padding: 12, gap: 8, backgroundColor: '#101929' }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#64748b"
            style={inputBox}
          />
          <Chip
            label="اليوم"
            active={!unpaidOnly && date === todayIso()}
            onPress={() => {
              setUnpaidOnly(false);
              setDate(todayIso());
            }}
          />
          <Chip label="كل الآجل" active={unpaidOnly} onPress={() => setUnpaidOnly((v) => !v)} />
          <Chip
            label="مع المرحّل"
            active={includeUnpaid && !unpaidOnly}
            onPress={() => setIncludeUnpaid((v) => !v)}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={searchQ}
            onChangeText={setSearchQ}
            placeholder="بحث برقم الفاتورة أو اسم العميل أو الهاتف..."
            placeholderTextColor="#64748b"
            textAlign="right"
            style={[inputBox, { flex: 1 }]}
          />
          <Pressable
            onPress={() => void handleBulkPay()}
            style={{
              backgroundColor: '#22c55e',
              borderRadius: 8,
              paddingHorizontal: 12,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#052e16', fontFamily: FONT.bold, fontSize: 12 }}>
              {busyBulk ? '...' : 'تسديد الكل'}
            </Text>
          </Pressable>
        </View>

        {summaryQuery.data ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <MiniStat label="فواتير اليوم" value={String(summaryQuery.data.todayInvoices)} />
            <MiniStat label="مبيعات اليوم" value={formatDinar(summaryQuery.data.todayRevenue)} />
            <MiniStat label="المحصّل" value={formatDinar(summaryQuery.data.todayCollectedRevenue)} />
          </View>
        ) : null}
      </View>

      {invoicesQuery.isLoading ? (
        <LoadingState message="جاري جلب الفواتير..." />
      ) : invoicesQuery.isError ? (
        <ErrorState message="تعذر جلب الفواتير" onRetry={() => invoicesQuery.refetch()} />
      ) : !filtered.length ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState message="لا توجد فواتير مطابقة للبحث أو التاريخ" icon="🧾" />
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
    <View style={{ flex: 1, backgroundColor: '#141e30', borderRadius: 8, padding: 8, alignItems: 'center' }}>
      <Text style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 10 }}>{label}</Text>
      <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold, fontSize: 12 }}>{value}</Text>
    </View>
  );
}

const inputBox = {
  backgroundColor: '#141e30',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  color: '#f1f5f9',
  fontFamily: FONT.regular,
  paddingHorizontal: 10,
  paddingVertical: 6,
  minWidth: 110,
} as const;
