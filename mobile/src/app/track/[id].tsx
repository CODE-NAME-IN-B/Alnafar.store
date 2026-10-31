import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Screen from '@/components/ui/Screen';
import AppText from '@/components/ui/AppText';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/StateView';
import QrScannerModal from '@/components/track/QrScannerModal';
import { ItemSection, StatusCard, TotalsCard } from '@/components/track/TrackCards';
import { toggleOrderItemInstalled, trackOrder, updateOrderStatus } from '@/api/orders';
import { apiErrorText } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { FONT } from '@/lib/fonts';
import { statusLabel, type OrderStatus } from '@/lib/statuses';
import { notifyOrderStatusChanged, registerForOrderNotifications } from '@/lib/notifications';
import { showToast } from '@/lib/toast';

const STAFF_STATUSES: OrderStatus[] = [
  'pending',
  'paid',
  'processing',
  'ready',
  'completed',
  'cancelled',
];

/** تتبع الطلب: يُحدَّث تلقائياً كل 30 ثانية + إشعارات الحالة + تحكم مباشر للموظف */
export default function TrackScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const trackingKey = params.id ?? '';
  const token = useAuthStore((s) => s.token);

  const [qrOpen, setQrOpen] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);
  const lastStatusRef = useRef<string | null>(null);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['track', trackingKey],
    queryFn: () => trackOrder(trackingKey),
    enabled: !!trackingKey,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!data?.status) return;
    if (lastStatusRef.current && lastStatusRef.current !== data.status) {
      void notifyOrderStatusChanged(data.invoice_number, data.status);
    }
    lastStatusRef.current = data.status;
  }, [data?.invoice_number, data?.status]);

  const handleEnableNotif = async () => {
    if (!trackingKey) return;
    const res = await registerForOrderNotifications(trackingKey);
    if (res.granted) {
      setNotifEnabled(true);
      showToast('تم تفعيل إشعارات حالة الطلب');
    } else {
      showToast('يرجى السماح بالإشعارات من إعدادات الجهاز', 'error');
    }
  };

  const handleStatusChange = async (next: OrderStatus) => {
    if (!trackingKey || busyStatus) return;
    setBusyStatus(true);
    try {
      await updateOrderStatus(trackingKey, next);
      showToast(`حُدّثت الحالة إلى: ${statusLabel(next)}`);
      await refetch();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    } finally {
      setBusyStatus(false);
    }
  };

  const handleToggleItem = async (idx: number, nextInstalled: boolean) => {
    if (!trackingKey) return;
    try {
      await toggleOrderItemInstalled(trackingKey, idx, nextInstalled);
      await refetch();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    }
  };

  return (
    <Screen>
      <View style={headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.replace('/(store)')} accessibilityLabel="عودة للمتجر">
            <Text style={{ color: '#14b8a6', fontFamily: FONT.bold, fontSize: 14 }}>← المتجر</Text>
          </Pressable>
          <AppText style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 18 }}>
            تتبع الطلب
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => setQrOpen(true)} accessibilityLabel="مسح QR آخر">
            <Text style={{ color: '#a78bfa', fontFamily: FONT.bold, fontSize: 13 }}>📷 QR</Text>
          </Pressable>
          <Pressable onPress={() => refetch()} accessible accessibilityLabel="تحديث الحالة">
            <Text style={{ color: '#14b8a6', fontFamily: FONT.medium, fontSize: 14 }}>تحديث ⟲</Text>
          </Pressable>
        </View>
      </View>

      {!trackingKey ? (
        <EmptyState
          message="لا يوجد رقم طلب — امسح رمز QR أو أدخل الرقم"
          icon="🔍"
          actionLabel="إدخال رقم أو مسح QR"
          onAction={() => setQrOpen(true)}
        />
      ) : isLoading ? (
        <LoadingState message="جاري جلب حالة الطلب..." />
      ) : isError || !data ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'تعذر جلب الطلب'}
          hint="تأكد من رقم الطلب أو امسح رمز QR من الفاتورة"
          onRetry={() => refetch()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor="#14b8a6"
            />
          }
        >
          <StatusCard
            data={data}
            notifEnabled={notifEnabled}
            onEnableNotif={() => void handleEnableNotif()}
          />

          {token ? (
            <View style={staffCard}>
              <AppText style={{ color: '#94a3b8', fontFamily: FONT.bold, fontSize: 13 }}>
                تحكم الموظف: تغيير حالة الطلب
              </AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {STAFF_STATUSES.map((st) => {
                  const active = data.status === st;
                  return (
                    <Pressable
                      key={st}
                      disabled={busyStatus || active}
                      onPress={() => void handleStatusChange(st)}
                      style={{
                        backgroundColor: active ? '#14b8a6' : '#1b2740',
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: active ? '#062b27' : '#f1f5f9',
                          fontFamily: FONT.bold,
                          fontSize: 12,
                        }}
                      >
                        {statusLabel(st)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <ItemSection data={data} canToggle={!!token} onToggle={handleToggleItem} />
          <TotalsCard data={data} />
          <AppText style={footnote}>التحديث تلقائي كل 30 ثانية حتى إغلاق الشاشة</AppText>
        </ScrollView>
      )}

      <QrScannerModal
        visible={qrOpen}
        onClose={() => setQrOpen(false)}
        onResolved={(orderId) => {
          setQrOpen(false);
          router.replace(`/track/${encodeURIComponent(orderId)}`);
        }}
      />
    </Screen>
  );
}

const headerRow = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  paddingHorizontal: 16,
  paddingTop: 8,
  paddingBottom: 6,
};

const staffCard = {
  backgroundColor: '#141e30',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
  padding: 14,
  marginTop: 12,
  gap: 8,
} as const;

const footnote = {
  color: '#64748b',
  fontFamily: FONT.regular,
  fontSize: 12,
  textAlign: 'center' as const,
  marginTop: 22,
};
