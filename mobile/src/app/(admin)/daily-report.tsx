import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  closeDailyReport,
  fetchDailyReport,
  fetchDailyReportsHistory,
  fetchNumberingStatus,
  resetDailyNumbering,
} from '@/api/admin';
import { apiErrorText } from '@/api/client';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import Chip from '@/components/ui/Chip';
import AppButton from '@/components/ui/AppButton';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateView';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** تبويب الجرد اليومي وترقيم الفواتير في لوحة الإدارة */
export default function AdminDailyReportScreen() {
  const branchScope = useAppStore((s) => s.adminScopeBranchId);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const [date, setDate] = useState(todayIso());
  const [includeUnpaid, setIncludeUnpaid] = useState(true);
  const [closeNotes, setCloseNotes] = useState('');
  const [busyClose, setBusyClose] = useState(false);

  const reportQuery = useQuery({
    queryKey: ['daily-report', { date, includeUnpaid, branchScope }],
    queryFn: () =>
      fetchDailyReport(date, includeUnpaid, branchScope === 'all' ? undefined : branchScope),
  });

  const historyQuery = useQuery({
    queryKey: ['daily-reports-history', branchScope],
    queryFn: () =>
      fetchDailyReportsHistory(branchScope === 'all' ? undefined : branchScope),
  });

  const numberingQuery = useQuery({
    queryKey: ['numbering-status'],
    queryFn: fetchNumberingStatus,
  });

  const handleCloseDay = async () => {
    if (busyClose) return;
    setBusyClose(true);
    try {
      await closeDailyReport(date, closeNotes.trim());
      showToast('تم إغلاق الجرد اليومي بنجاح');
      setCloseNotes('');
      await reportQuery.refetch();
      await historyQuery.refetch();
      await numberingQuery.refetch();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    } finally {
      setBusyClose(false);
    }
  };

  const handleResetNumbering = async () => {
    try {
      await resetDailyNumbering(date);
      showToast('تم تصفير ترقيم الفواتير لهذا اليوم');
      await numberingQuery.refetch();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    }
  };

  const report = reportQuery.data;
  const allInvoices = [
    ...(includeUnpaid ? (report?.carriedInvoices ?? []) : []),
    ...(report?.invoices ?? []),
  ];
  const unpaidBalanceSum = allInvoices.reduce((sum, inv) => {
    const finalTotal = Math.max(0, Number(inv.total) - Number(inv.discount ?? 0));
    const rem = Math.max(0, finalTotal - Number(inv.paid_amount ?? 0));
    return sum + rem;
  }, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0f1724' }}
      contentContainerStyle={{ padding: 14, gap: 12 }}
      showsVerticalScrollIndicator={false}
    >
      {/* شريط التاريخ والترقيم */}
      <View style={card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#64748b"
            style={inputBox}
          />
          <Chip label="اليوم" active={date === todayIso()} onPress={() => setDate(todayIso())} />
          <Chip
            label="مع الآجل المرحّل"
            active={includeUnpaid}
            onPress={() => setIncludeUnpaid((v) => !v)}
          />
        </View>

        {numberingQuery.data ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ color: '#94a3b8', fontFamily: FONT.medium, fontSize: 12 }}>
              رقم الفاتورة التالي اليوم: #{numberingQuery.data.nextInvoiceNumber}
            </Text>
            {isAdmin ? (
              <Pressable onPress={() => void handleResetNumbering()}>
                <Text style={{ color: '#f59e0b', fontFamily: FONT.bold, fontSize: 12 }}>
                  تصفير الترقيم
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {reportQuery.isLoading ? (
        <LoadingState message="جاري جلب تقرير الجرد..." />
      ) : reportQuery.isError || !report ? (
        <ErrorState message="تعذر جلب التقرير اليومي" onRetry={() => reportQuery.refetch()} />
      ) : (
        <>
          {/* بطاقات ملخص الجرد */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <StatBox label="عدد الفواتير" value={String(report.total_invoices)} />
            <StatBox label="إجمالي المبيعات" value={formatDinar(report.total_revenue)} />
            <StatBox label="الخصومات" value={formatDinar(report.total_discount)} />
            <StatBox label="الصافي" value={formatDinar(report.net_revenue)} highlight />
            <StatBox
              label="المحصّل الفعلي"
              value={formatDinar(report.collected_revenue ?? report.net_revenue)}
            />
            <StatBox label="الآجل المتبقي" value={formatDinar(unpaidBalanceSum)} warn />
          </View>

          {/* حالة الجرد وإغلاقه */}
          <View style={card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 15 }}>
                حالة جرد {report.date}
              </Text>
              <View
                style={{
                  backgroundColor: report.is_closed
                    ? 'rgba(239,68,68,0.18)'
                    : 'rgba(34,197,94,0.18)',
                  borderRadius: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    color: report.is_closed ? '#fca5a5' : '#86efac',
                    fontFamily: FONT.bold,
                    fontSize: 12,
                  }}
                >
                  {report.is_closed ? 'مغلق' : 'مفتوح'}
                </Text>
              </View>
            </View>

            {report.notes ? (
              <Text style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 12, marginTop: 4 }}>
                ملاحظة الإغلاق: {report.notes}
              </Text>
            ) : null}

            {!report.is_closed ? (
              <View style={{ gap: 8, marginTop: 10 }}>
                <TextInput
                  value={closeNotes}
                  onChangeText={setCloseNotes}
                  placeholder="ملاحظات إغلاق اليوم (اختياري)..."
                  placeholderTextColor="#64748b"
                  textAlign="right"
                  style={[inputBox, { width: '100%' }]}
                />
                <AppButton
                  label="🔒 إغلاق الجرد اليومي"
                  onPress={handleCloseDay}
                  loading={busyClose}
                />
              </View>
            ) : null}
          </View>

          {/* فواتير اليوم */}
          <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 15 }}>
            فواتير الجرد ({allInvoices.length})
          </Text>
          {!allInvoices.length ? (
            <EmptyState message="لا توجد فواتير مسجلة في هذا التاريخ" icon="📊" />
          ) : (
            <View style={{ gap: 8 }}>
              {allInvoices.map((inv) => {
                const finalT = Math.max(0, Number(inv.total) - Number(inv.discount ?? 0));
                const rem = Math.max(0, finalT - Number(inv.paid_amount ?? 0));
                return (
                  <View
                    key={`${inv.id}-${inv.isCarried ? 'c' : 'd'}`}
                    style={[card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 14 }}>
                        #{inv.invoice_number} • {inv.customer_name || 'عميل نقدي'}
                        {inv.isCarried ? ' (آجل مرحّل)' : ''}
                      </Text>
                      <Text style={{ color: rem > 0 ? '#f59e0b' : '#22c55e', fontFamily: FONT.regular, fontSize: 12 }}>
                        {rem > 0 ? `متبقي: ${formatDinar(rem)}` : 'خالص'}
                      </Text>
                    </View>
                    <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold, fontSize: 14 }}>
                      {formatDinar(finalT)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}

      {/* سجل تقارير الأيام السابقة */}
      {historyQuery.data && historyQuery.data.length ? (
        <View style={{ gap: 8, marginTop: 8 }}>
          <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 15 }}>
            الأيام السابقة
          </Text>
          {historyQuery.data.slice(0, 10).map((r) => (
            <Pressable
              key={r.date}
              onPress={() => setDate(r.date)}
              style={[
                card,
                {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderColor: r.date === date ? '#14b8a6' : 'rgba(255,255,255,0.06)',
                },
              ]}
            >
              <View>
                <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 14 }}>
                  {r.date} {r.is_closed ? '🔒' : ''}
                </Text>
                <Text style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 12 }}>
                  {r.total_invoices} فاتورة
                </Text>
              </View>
              <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold }}>
                {formatDinar(r.net_revenue)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function StatBox({
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
    <View
      style={{
        width: '48%',
        backgroundColor: '#141e30',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        padding: 10,
      }}
    >
      <Text style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 11 }}>{label}</Text>
      <Text
        style={{
          color: warn ? '#f59e0b' : highlight ? '#14b8a6' : '#f1f5f9',
          fontFamily: FONT.bold,
          fontSize: 15,
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const card = {
  backgroundColor: '#141e30',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
  padding: 12,
} as const;

const inputBox = {
  backgroundColor: '#0b1220',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  color: '#f1f5f9',
  fontFamily: FONT.regular,
  paddingHorizontal: 10,
  paddingVertical: 6,
  minWidth: 115,
} as const;
