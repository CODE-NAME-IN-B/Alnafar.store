import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import Icon from '@/components/ui/Icon';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateView';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { ScalePressable } from '@/components/ui/motion';
import DatePickerSheet from '@/components/ui/DatePickerSheet';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';
import { ROW } from '@/lib/rtl';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** تبويب الجرد اليومي وترقيم الفواتير في لوحة الإدارة — متوافق مع Modern Minimalism */
export default function AdminDailyReportScreen() {
  const palette = usePalette();
  const branchScope = useAppStore((s) => s.adminScopeBranchId);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const [date, setDate] = useState(todayIso());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
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
      style={{ flex: 1, backgroundColor: palette.canvas }}
      contentContainerStyle={{ padding: 14, gap: 12 }}
      showsVerticalScrollIndicator={false}
    >
      {/* شريط التاريخ والترقيم */}
      <View
        style={[
          styles.bentoCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.surfaceLine,
          },
        ]}
      >
        <View style={{ flexDirection: ROW, alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <ScalePressable
            onPress={() => setDatePickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="اختيار التاريخ من التقويم"
            style={[
              styles.datePickerBtn,
              {
                backgroundColor: palette.surfaceRaised,
                borderColor: palette.surfaceLine,
              },
            ]}
          >
            <Icon name="calendar" size={15} color={palette.primary} />
            <Text
              style={{
                color: palette.text,
                fontFamily: AR_FONT.bold,
                fontSize: 13,
                minWidth: 92,
                includeFontPadding: false,
              }}
            >
              {date}
            </Text>
          </ScalePressable>
          <Chip label="اليوم" compact active={date === todayIso()} onPress={() => setDate(todayIso())} />
          <Chip
            label="مع الآجل المرحّل"
            compact
            active={includeUnpaid}
            onPress={() => setIncludeUnpaid((v) => !v)}
          />
        </View>

        {numberingQuery.data ? (
          <View
            style={{
              flexDirection: ROW,
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 10,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: palette.surfaceLine,
            }}
          >
            <Text style={{ color: palette.textSub, fontFamily: AR_FONT.medium, fontSize: 12 }}>
              رقم الفاتورة التالي اليوم: #{numberingQuery.data.nextInvoiceNumber}
            </Text>
            {isAdmin ? (
              <Pressable
                onPress={() => void handleResetNumbering()}
                style={({ pressed }) => [
                  styles.resetBtn,
                  {
                    backgroundColor: pressed ? palette.warning + '25' : palette.warning + '15',
                    borderColor: palette.warning + '40',
                  },
                ]}
              >
                <Icon name="refresh" size={14} color={palette.warning} />
                <Text style={{ color: palette.warning, fontFamily: AR_FONT.bold, fontSize: 12 }}>
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
          {/* بطاقات ملخص الجرد Bento */}
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
          <View
            style={[
              styles.bentoCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.surfaceLine,
              },
            ]}
          >
            <View style={{ flexDirection: ROW, justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: palette.text, fontFamily: AR_FONT.bold, fontSize: 15 }}>
                حالة جرد {report.date}
              </Text>
              <View
                style={{
                  flexDirection: ROW,
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: report.is_closed ? palette.danger + '18' : palette.success + '18',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderWidth: 1,
                  borderColor: report.is_closed ? palette.danger + '40' : palette.success + '40',
                }}
              >
                <Icon
                  name={report.is_closed ? 'lock' : 'check'}
                  size={14}
                  color={report.is_closed ? palette.danger : palette.success}
                />
                <Text
                  style={{
                    color: report.is_closed ? palette.danger : palette.success,
                    fontFamily: AR_FONT.bold,
                    fontSize: 12,
                  }}
                >
                  {report.is_closed ? 'مغلق' : 'مفتوح للعمل'}
                </Text>
              </View>
            </View>

            {!report.is_closed && isAdmin ? (
              <View style={{ marginTop: 12, gap: 10 }}>
                <TextInput
                  value={closeNotes}
                  onChangeText={setCloseNotes}
                  placeholder="ملاحظات إغلاق اليوم (اختياري)..."
                  placeholderTextColor={palette.textFaint}
                  textAlign="right"
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: palette.surfaceRaised,
                      borderColor: palette.surfaceLine,
                      color: palette.text,
                    },
                  ]}
                />
                <AppButton
                  label={busyClose ? 'جاري الإغلاق...' : 'إغلاق وردية اليوم'}
                  variant="primary"
                  onPress={() => void handleCloseDay()}
                  disabled={busyClose}
                />
              </View>
            ) : null}
          </View>
        </>
      )}

      {/* التقويم */}
      <DatePickerSheet
        visible={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        initialFrom={date}
        onApply={(from) => {
          if (from) setDate(from);
        }}
      />
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
  const palette = usePalette();
  return (
    <View
      style={[
        styles.statBox,
        {
          backgroundColor: palette.surface,
          borderColor: palette.surfaceLine,
        },
      ]}
    >
      <Text style={{ color: palette.textSub, fontFamily: AR_FONT.regular, fontSize: 11.5, textAlign: 'right' }}>
        {label}
      </Text>
      <Text
        style={{
          color: warn ? palette.warning : highlight ? palette.primary : palette.text,
          fontFamily: AR_FONT.bold,
          fontSize: 16,
          marginTop: 4,
          textAlign: 'right',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bentoCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  datePickerBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 42,
  },
  resetBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: AR_FONT.regular,
    fontSize: 13,
  },
  statBox: {
    width: '48.5%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
});
