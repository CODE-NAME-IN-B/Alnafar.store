import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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
import { LoadingState } from '@/components/ui/StateView';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { showToast } from '@/lib/toast';

type TabKey = 'stats' | 'invoice-settings' | 'users' | 'branches' | 'audit';

/** تبويب الإحصائيات وإعدادات الفاتورة والمستخدمين والفروع وسجل النشاط */
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
    <View style={{ flex: 1, backgroundColor: '#0f1724' }}>
      <View style={{ padding: 12, backgroundColor: '#101929' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label="📈 الإحصائيات" active={tab === 'stats'} onPress={() => setTab('stats')} />
          <Chip
            label="🧾 إعدادات الفاتورة"
            active={tab === 'invoice-settings'}
            onPress={() => setTab('invoice-settings')}
          />
          {isAdmin ? (
            <Chip label="👥 المستخدمون" active={tab === 'users'} onPress={() => setTab('users')} />
          ) : null}
          {superAdmin ? (
            <Chip label="🏬 الفروع" active={tab === 'branches'} onPress={() => setTab('branches')} />
          ) : null}
          {isAdmin ? (
            <Chip label="📋 سجل النشاط" active={tab === 'audit'} onPress={() => setTab('audit')} />
          ) : null}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        {tab === 'stats' ? (
          statsQ.isLoading || !statsQ.data ? (
            <LoadingState message="جاري جلب الإحصائيات..." />
          ) : (
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Metric label="طلبات اليوم" value={String(statsQ.data.today.orders)} />
                <Metric label="مبيعات اليوم" value={formatDinar(statsQ.data.today.revenue)} />
                <Metric label="طلبات الشهر" value={String(statsQ.data.month.orders)} />
                <Metric label="مبيعات الشهر" value={formatDinar(statsQ.data.month.revenue)} />
                <Metric label="قيد الانتظار" value={String(statsQ.data.pendingOrders)} />
                <Metric label="إجمالي الألعاب" value={String(statsQ.data.totalGames)} />
              </View>

              <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 15, marginTop: 6 }}>
                أكثر الألعاب مبيعاً
              </Text>
              {(statsQ.data.topGames ?? []).map((g, i) => (
                <View key={`${g.title}-${i}`} style={cardRow}>
                  <Text style={{ color: '#f1f5f9', fontFamily: FONT.medium, flex: 1 }}>
                    {i + 1}. {g.title}
                  </Text>
                  <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold }}>
                    {g.count} طلب • {formatDinar(g.revenue)}
                  </Text>
                </View>
              ))}
            </View>
          )
        ) : null}

        {tab === 'invoice-settings' ? (
          <View style={[cardRow, { flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
            <AppInput label="اسم المتجر على الفاتورة" value={storeName} onChangeText={setStoreName} />
            <AppInput label="الاسم الإنجليزي" value={storeNameEn} onChangeText={setStoreNameEn} />
            <AppInput label="عنوان المتجر" value={storeAddress} onChangeText={setStoreAddress} />
            <AppInput label="هاتف المتجر" value={storePhone} onChangeText={setStorePhone} />
            <AppInput label="رسالة أسفل الفاتورة" value={footerMsg} onChangeText={setFooterMsg} />

            <Text style={{ color: '#94a3b8', fontFamily: FONT.bold, fontSize: 12 }}>
              عرض ورق الطابعة الحرارية
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[58, 80, 100].map((w) => (
                <Chip
                  key={w}
                  label={`${w} مم`}
                  active={paperWidth === w}
                  onPress={() => setPaperWidth(w)}
                />
              ))}
            </View>

            <Text style={{ color: '#94a3b8', fontFamily: FONT.bold, fontSize: 12 }}>حجم الخط</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="صغير" active={fontSize === 'small'} onPress={() => setFontSize('small')} />
              <Chip label="عادي" active={fontSize === 'normal'} onPress={() => setFontSize('normal')} />
              <Chip label="كبير" active={fontSize === 'large'} onPress={() => setFontSize('large')} />
            </View>

            <AppButton
              label="حفظ إعدادات الفاتورة"
              onPress={handleSaveInvoiceSettings}
              loading={busySettings}
            />
          </View>
        ) : null}

        {tab === 'users' && isAdmin ? <UsersBranchesSection mode="users" /> : null}
        {tab === 'branches' && superAdmin ? <UsersBranchesSection mode="branches" /> : null}

        {tab === 'audit' && isAdmin ? (
          auditQ.isLoading ? (
            <LoadingState message="جاري جلب سجل النشاط..." />
          ) : (
            <View style={{ gap: 8 }}>
              {(auditQ.data ?? []).map((log) => (
                <View key={log.id} style={cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 13 }}>
                      {log.action} • {log.entity_type ?? ''} #{log.entity_id ?? ''}
                    </Text>
                    <Text style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 11 }}>
                      المستخدم: {log.username || log.user_id || 'نظام'} • {log.created_at}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : null}
      </ScrollView>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        width: '48%',
        backgroundColor: '#141e30',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        padding: 12,
      }}
    >
      <Text style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold, fontSize: 16, marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}

const cardRow = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  backgroundColor: '#141e30',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
  padding: 12,
};
