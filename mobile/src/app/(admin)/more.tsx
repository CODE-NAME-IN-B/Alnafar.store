import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAuditLogs,
  fetchDashboardStats,
  saveInvoiceSettings,
} from '@/api/admin';
import { fetchInvoiceSettings } from '@/api/settings';
import { apiErrorText } from '@/api/client';
import { useAppStore } from '@/stores/app';
import { isSuperAdmin, useAuthStore } from '@/stores/auth';
import UsersBranchesSection from '@/components/admin/UsersBranchesSection';
import AppInput from '@/components/ui/AppInput';
import AppButton from '@/components/ui/AppButton';
import Chip from '@/components/ui/Chip';
import KeyboardScroll from '@/components/ui/KeyboardScroll';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateView';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';
import { ROW } from '@/lib/rtl';

type TabKey = 'stats' | 'invoice-settings' | 'users' | 'branches' | 'audit';

export default function AdminMoreScreen() {
  const user = useAuthStore((s) => s.user);
  const branchScope = useAppStore((s) => s.adminScopeBranchId);
  const isAdmin = user?.role === 'admin';
  const superAdmin = isSuperAdmin(user);

  const [tab, setTab] = useState<TabKey>('stats');

  const statsQ = useQuery({
    queryKey: ['dashboard-stats', branchScope],
    queryFn: () => fetchDashboardStats(branchScope === 'all' ? undefined : branchScope),
    enabled: tab === 'stats',
  });

  const invSettingsQ = useQuery({
    queryKey: ['invoice-settings'],
    queryFn: fetchInvoiceSettings,
    enabled: tab === 'invoice-settings',
  });

  const auditQ = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => fetchAuditLogs(1, 50),
    enabled: tab === 'audit' && isAdmin,
  });

  const [storeName, setStoreName] = useState('');
  const [storeNameEn, setStoreNameEn] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [footerMsg, setFooterMsg] = useState('');
  const [paperWidth, setPaperWidth] = useState<number>(58);
  const [fontSize, setFontSize] = useState<string>('normal');
  const [busySettings, setBusySettings] = useState(false);

  useEffect(() => {
    const s = invSettingsQ.data;
    if (!s) return;
    setStoreName(s.store_name ?? 'الشارده للإلكترونيات');
    setStoreNameEn(s.store_name_english ?? 'Alnafar Store');
    setStoreAddress(s.store_address ?? '');
    setStorePhone(s.store_phone ?? '');
    setFooterMsg(s.footer_message ?? '');
    setPaperWidth(Number(s.paper_width) || 58);
    setFontSize(s.font_size ?? 'normal');
  }, [invSettingsQ.data]);

  const handleSaveInvoiceSettings = async () => {
    setBusySettings(true);
    try {
      await saveInvoiceSettings({
        store_name: storeName.trim(),
        store_name_english: storeNameEn.trim(),
        store_address: storeAddress.trim(),
        store_phone: storePhone.trim(),
        footer_message: footerMsg.trim(),
        paper_width: paperWidth,
        font_size: fontSize,
        show_store_info: 1,
        show_footer: 1,
      });
      showToast('تم حفظ إعدادات الفاتورة');
      await invSettingsQ.refetch();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    } finally {
      setBusySettings(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.tabsHeader}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          <Chip
            label="الإحصائيات"
            active={tab === 'stats'}
            onPress={() => setTab('stats')}
          />
          <Chip
            label="إعدادات الفاتورة"
            active={tab === 'invoice-settings'}
            onPress={() => setTab('invoice-settings')}
          />
          {isAdmin ? (
            <Chip
              label="المستخدمون"
              active={tab === 'users'}
              onPress={() => setTab('users')}
            />
          ) : null}
          {superAdmin ? (
            <Chip
              label="الفروع"
              active={tab === 'branches'}
              onPress={() => setTab('branches')}
            />
          ) : null}
          {isAdmin ? (
            <Chip
              label="سجل النشاط"
              active={tab === 'audit'}
              onPress={() => setTab('audit')}
            />
          ) : null}
        </ScrollView>
      </View>

      <KeyboardScroll contentStyle={{ padding: 14, gap: 12 }} extraBottomPadding={36}>
        {tab === 'stats' ? (
          statsQ.isLoading ? (
            <LoadingState message="جاري جلب الإحصائيات..." />
          ) : statsQ.isError || !statsQ.data ? (
            <ErrorState
              message="تعذر جلب الإحصائيات"
              onRetry={() => statsQ.refetch()}
            />
          ) : (
            <View style={{ gap: 10 }}>
              <View style={styles.metricsGrid}>
                <Metric
                  label="فواتير اليوم"
                  value={String(statsQ.data.today.orders)}
                />
                <Metric
                  label="مبيعات اليوم"
                  value={formatDinar(statsQ.data.today.revenue)}
                />
                <Metric
                  label="المحصّل اليوم"
                  value={formatDinar(statsQ.data.today.collected)}
                />
                <Metric
                  label="إجمالي الفواتير"
                  value={String(statsQ.data.month.orders)}
                />
                <Metric
                  label="إجمالي المبيعات"
                  value={formatDinar(statsQ.data.month.revenue)}
                />
                <Metric
                  label="المحصّل الكلي"
                  value={formatDinar(statsQ.data.month.collected)}
                />
              </View>

              <Text style={styles.sectionHeading}>أكثر الألعاب مبيعاً</Text>
              {(statsQ.data.topGames ?? []).length === 0 ? (
                <EmptyState message="لا توجد بيانات مبيعات للألعاب بعد" icon="gamepad" />
              ) : (
                (statsQ.data.topGames ?? []).map((g, i) => (
                  <View key={`${g.title}-${i}`} style={styles.cardRow}>
                    <View style={styles.rankRow}>
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>#{i + 1}</Text>
                      </View>
                      <Text style={styles.gameTitle} numberOfLines={1}>
                        {g.title}
                      </Text>
                    </View>
                    <Text style={styles.gameCount}>
                      {g.count} طلب
                      {g.revenue > 0 ? ` • ${formatDinar(g.revenue)}` : ''}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )
        ) : null}

        {tab === 'invoice-settings' ? (
          <View style={styles.settingsCard}>
            <AppInput
              label="اسم المتجر على الفاتورة"
              value={storeName}
              onChangeText={setStoreName}
            />
            <AppInput
              label="الاسم الإنجليزي"
              value={storeNameEn}
              onChangeText={setStoreNameEn}
            />
            <AppInput
              label="عنوان المتجر"
              value={storeAddress}
              onChangeText={setStoreAddress}
            />
            <AppInput
              label="هاتف المتجر"
              value={storePhone}
              onChangeText={setStorePhone}
              keyboard="phone-pad"
            />
            <AppInput
              label="رسالة أسفل الفاتورة"
              value={footerMsg}
              onChangeText={setFooterMsg}
            />

            <Text style={styles.settingLabel}>عرض ورق الطابعة الحرارية</Text>
            <View style={styles.chipsRow}>
              {[58, 80, 100].map((w) => (
                <Chip
                  key={w}
                  label={`${w} مم`}
                  active={paperWidth === w}
                  onPress={() => setPaperWidth(w)}
                />
              ))}
            </View>

            <Text style={styles.settingLabel}>حجم الخط</Text>
            <View style={styles.chipsRow}>
              <Chip
                label="صغير"
                active={fontSize === 'small'}
                onPress={() => setFontSize('small')}
              />
              <Chip
                label="عادي"
                active={fontSize === 'normal'}
                onPress={() => setFontSize('normal')}
              />
              <Chip
                label="كبير"
                active={fontSize === 'large'}
                onPress={() => setFontSize('large')}
              />
            </View>

            <AppButton
              label="حفظ إعدادات الفاتورة"
              icon="check"
              onPress={handleSaveInvoiceSettings}
              loading={busySettings}
            />
          </View>
        ) : null}

        {tab === 'users' && isAdmin ? <UsersBranchesSection mode="users" /> : null}
        {tab === 'branches' && superAdmin ? (
          <UsersBranchesSection mode="branches" />
        ) : null}

        {tab === 'audit' && isAdmin ? (
          auditQ.isLoading ? (
            <LoadingState message="جاري جلب سجل النشاط..." />
          ) : (
            <View style={{ gap: 8 }}>
              {(auditQ.data ?? []).map((log) => (
                <View key={log.id} style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.auditTitle}>
                      {log.action} • {log.entity_type ?? ''} #{log.entity_id ?? ''}
                    </Text>
                    <Text style={styles.auditSub}>
                      المستخدم: {log.username || log.user_id || 'نظام'} •{' '}
                      {log.created_at}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : null}
      </KeyboardScroll>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  tabsHeader: {
    padding: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tabsScroll: {
    flexDirection: ROW,
    gap: 8,
  },
  metricsGrid: {
    flexDirection: ROW,
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#131c2e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    alignItems: 'flex-end',
  },
  metricLabel: {
    color: '#94a3b8',
    fontFamily: FONT.medium,
    fontSize: 11.5,
    includeFontPadding: false,
  },
  metricVal: {
    color: '#2dd4bf',
    fontFamily: FONT.bold,
    fontSize: 17,
    marginTop: 4,
    includeFontPadding: false,
  },
  sectionHeading: {
    color: '#f8fafc',
    fontFamily: FONT.bold,
    fontSize: 15,
    marginTop: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  cardRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131c2e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    gap: 8,
  },
  rankRow: {
    flex: 1,
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
  },
  rankBadge: {
    backgroundColor: 'rgba(20,184,166,0.16)',
    borderWidth: 1,
    borderColor: '#14b8a6',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  rankText: {
    fontFamily: FONT.bold,
    color: '#2dd4bf',
    fontSize: 11,
    includeFontPadding: false,
  },
  gameTitle: {
    flex: 1,
    color: '#f1f5f9',
    fontFamily: FONT.bold,
    fontSize: 13.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  gameCount: {
    color: '#2dd4bf',
    fontFamily: FONT.bold,
    fontSize: 12.5,
    includeFontPadding: false,
  },
  settingsCard: {
    backgroundColor: '#131c2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    gap: 12,
  },
  settingLabel: {
    color: '#cbd5e1',
    fontFamily: FONT.bold,
    fontSize: 12.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  chipsRow: {
    flexDirection: ROW,
    gap: 8,
  },
  auditTitle: {
    color: '#f1f5f9',
    fontFamily: FONT.bold,
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  auditSub: {
    color: '#94a3b8',
    fontFamily: FONT.regular,
    fontSize: 11,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
    includeFontPadding: false,
  },
});
