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
import { formatArabicDate } from '@/components/ui/LtrText';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';
import { ROW } from '@/lib/rtl';
import Button from '@/design/Button';
import ConfirmDialog from '@/design/ConfirmDialog';
import { router } from 'expo-router';

type TabKey = 'stats' | 'invoice-settings' | 'users' | 'branches' | 'audit';

export default function AdminMoreScreen() {
  const palette = usePalette();
  const user = useAuthStore((s) => s.user);
  const branchScope = useAppStore((s) => s.adminScopeBranchId);
  const isAdmin = user?.role === 'admin';
  const superAdmin = isSuperAdmin(user);

  const logout = useAuthStore((s) => s.logout);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
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
    /* eslint-disable react-hooks/set-state-in-effect */
    const s = invSettingsQ.data;
    if (!s) return;
    setStoreName(s.store_name ?? 'الشاردة ستور');
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
    <View style={[styles.screen, { backgroundColor: palette.canvas }]}>
      <View
        style={[
          styles.tabsHeader,
          {
            backgroundColor: palette.canvas,
            borderBottomColor: palette.surfaceLine,
          },
        ]}
      >
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
              onRetry={() => void statsQ.refetch()}
            />
          ) : (
            <>
              <View style={styles.grid2}>
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.surfaceLine,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: palette.textSub }]}>إجمالي الألعاب</Text>
                  <Text style={[styles.metricVal, { color: palette.text }]}>
                    {statsQ.data.totalGames}
                  </Text>
                </View>
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.surfaceLine,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: palette.textSub }]}>فواتير اليوم</Text>
                  <Text style={[styles.metricVal, { color: palette.text }]}>
                    {statsQ.data.today.orders}
                  </Text>
                </View>
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.surfaceLine,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: palette.textSub }]}>مبيعات اليوم</Text>
                  <Text style={[styles.metricVal, { color: palette.money }]}>
                    {formatDinar(statsQ.data.today.revenue)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.surfaceLine,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: palette.textSub }]}>الآجل المعلق</Text>
                  <Text style={[styles.metricVal, { color: palette.warning }]}>
                    {statsQ.data.pendingOrders}
                  </Text>
                </View>
              </View>

              <Text style={[styles.sectionHeading, { color: palette.text }]}>
                الأكثر طلباً (Top 5)
              </Text>
              {(statsQ.data.topGames ?? []).map((tg, idx: number) => (
                <View
                  key={String(tg.title + idx)}
                  style={[
                    styles.cardRow,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.surfaceLine,
                    },
                  ]}
                >
                  <View style={styles.rankRow}>
                    <View
                      style={[
                        styles.rankBadge,
                        {
                          backgroundColor: palette.surfaceRaised,
                          borderColor: palette.surfaceLine,
                        },
                      ]}
                    >
                      <Text style={[styles.rankText, { color: palette.primary }]}>
                        #{idx + 1}
                      </Text>
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[styles.gameTitle, { color: palette.text }]}
                    >
                      {tg.title}
                    </Text>
                  </View>
                  <Text style={[styles.gameCount, { color: palette.textSub }]}>
                    {tg.count} طلب
                  </Text>
                </View>
              ))}
            </>
          )
        ) : null}

        {tab === 'invoice-settings' ? (
          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.surfaceLine,
              },
            ]}
          >
            <AppInput
              label="اسم المتجر (عربي)"
              value={storeName}
              onChangeText={setStoreName}
            />
            <AppInput
              label="اسم المتجر (إنجليزي)"
              value={storeNameEn}
              onChangeText={setStoreNameEn}
            />
            <AppInput
              label="عنوان المحل"
              value={storeAddress}
              onChangeText={setStoreAddress}
            />
            <AppInput
              label="هاتف المحل"
              value={storePhone}
              onChangeText={setStorePhone}
              keyboard="phone-pad"
            />
            <AppInput
              label="رسالة تذييل الفاتورة"
              value={footerMsg}
              onChangeText={setFooterMsg}
              multiline
            />

            <View style={{ gap: 6 }}>
              <Text style={[styles.settingLabel, { color: palette.textSub }]}>عرض ورق الطابعة</Text>
              <View style={styles.chipsRow}>
                <Chip
                  label="58 مم (حراري قياسي)"
                  active={paperWidth === 58}
                  onPress={() => setPaperWidth(58)}
                />
                <Chip
                  label="80 مم (عريض)"
                  active={paperWidth === 80}
                  onPress={() => setPaperWidth(80)}
                />
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={[styles.settingLabel, { color: palette.textSub }]}>حجم خط الفاتورة</Text>
              <View style={styles.chipsRow}>
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
            </View>

            <AppButton
              label={busySettings ? 'جاري الحفظ...' : 'حفظ إعدادات الفاتورة'}
              onPress={() => void handleSaveInvoiceSettings()}
              disabled={busySettings}
            />
          </View>
        ) : null}

        {tab === 'users' ? <UsersBranchesSection mode="users" /> : null}
        {tab === 'branches' ? <UsersBranchesSection mode="branches" /> : null}

        {tab === 'audit' ? (
          auditQ.isLoading ? (
            <LoadingState message="جاري جلب سجل النشاط..." />
          ) : auditQ.isError ? (
            <ErrorState
              message="تعذر جلب سجل النشاط"
              onRetry={() => void auditQ.refetch()}
            />
          ) : !(auditQ.data ?? []).length ? (
            <EmptyState message="سجل النشاط فارغ" icon="info" />
          ) : (
            (auditQ.data ?? []).map((l) => (
              <View
                key={String(l.id)}
                style={[
                  styles.cardRow,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.surfaceLine,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.auditTitle, { color: palette.text }]}>
                    {l.action} • {l.username ?? 'النظام'}
                  </Text>
                  <Text style={[styles.auditSub, { color: palette.textSub }]}>
                    {l.entity_type ? `${l.entity_type} #${l.entity_id ?? ''}` : '—'}
                  </Text>
                </View>
                <Text style={{ color: palette.textFaint, fontFamily: AR_FONT.medium, fontSize: 11 }}>
                  {formatArabicDate(l.created_at)}
                </Text>
              </View>
            ))
          )
        ) : null}
        <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: palette.surfaceLine }}>
          <Button
            label="تسجيل الخروج من الحساب"
            variant="danger"
            icon="logout"
            onPress={() => setLogoutConfirmOpen(true)}
          />
        </View>
      </KeyboardScroll>

      <ConfirmDialog
        visible={logoutConfirmOpen}
        title="تسجيل الخروج"
        message="هل أنت متأكد من رغبتك في تسجيل الخروج من لوحة الإدارة؟"
        confirmLabel="نعم، خروج"
        cancelLabel="إلغاء"
        danger
        onConfirm={async () => {
          setLogoutConfirmOpen(false);
          await logout();
          router.replace('/(store)');
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  tabsHeader: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tabsScroll: {
    flexDirection: ROW,
    gap: 8,
    paddingHorizontal: 14,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '48.5%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  metricLabel: {
    fontFamily: AR_FONT.regular,
    fontSize: 11.5,
    textAlign: 'right',
    includeFontPadding: false,
  },
  metricVal: {
    fontFamily: AR_FONT.bold,
    fontSize: 17,
    marginTop: 4,
    textAlign: 'right',
    includeFontPadding: false,
  },
  sectionHeading: {
    fontFamily: AR_FONT.bold,
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
    borderRadius: 14,
    borderWidth: 1,
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
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  rankText: {
    fontFamily: AR_FONT.bold,
    fontSize: 11,
    includeFontPadding: false,
  },
  gameTitle: {
    flex: 1,
    fontFamily: AR_FONT.bold,
    fontSize: 13.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  gameCount: {
    fontFamily: AR_FONT.bold,
    fontSize: 12.5,
    includeFontPadding: false,
  },
  settingsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  settingLabel: {
    fontFamily: AR_FONT.bold,
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
    fontFamily: AR_FONT.bold,
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  auditSub: {
    fontFamily: AR_FONT.regular,
    fontSize: 11,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
    includeFontPadding: false,
  },
});
