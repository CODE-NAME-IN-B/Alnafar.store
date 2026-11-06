import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Screen from '@/components/ui/Screen';
import AppText from '@/components/ui/AppText';
import Icon from '@/components/ui/Icon';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/StateView';
import QrScannerModal from '@/components/track/QrScannerModal';
import { ItemSection, StatusCard, TotalsCard } from '@/components/track/TrackCards';
import { toggleOrderItemInstalled, trackOrder, updateOrderStatus } from '@/api/orders';
import { apiErrorText } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { statusLabel, type OrderStatus } from '@/lib/statuses';
import { notifyOrderStatusChanged, registerForOrderNotifications } from '@/lib/notifications';
import { addTrackedOrder, saveTrackedStatus } from '@/lib/trackedOrders';
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
  const palette = usePalette();
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

  /* حفظ الطلب محلياً بمجرد فتح تتبعه (عبر QR) */
  useEffect(() => {
    if (!trackingKey || !data?.invoice_number) return;
    void addTrackedOrder(trackingKey);
    void saveTrackedStatus(trackingKey, data.status);
  }, [trackingKey, data?.invoice_number, data?.status]);

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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: palette.canvas,
          borderBottomWidth: 1,
          borderBottomColor: palette.surfaceLine,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={() => router.replace('/(store)')}
            accessibilityLabel="عودة للمتجر"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: palette.surface,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: palette.surfaceLine,
              paddingHorizontal: 10,
              paddingVertical: 8,
              minHeight: 38,
            }}
          >
            <Icon name="store" size={15} color={palette.textSub} />
            <Text style={{ color: palette.textSub, fontFamily: AR_FONT.bold, fontSize: 13 }}>
              المتجر
            </Text>
          </Pressable>
          <AppText style={{ color: palette.text, fontFamily: AR_FONT.bold, fontSize: 18 }}>
            تتبع الطلب
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={() => setQrOpen(true)}
            accessibilityLabel="مسح QR آخر"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: palette.surfaceRaised,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: palette.primary,
              paddingHorizontal: 10,
              paddingVertical: 8,
              minHeight: 38,
            }}
          >
            <Icon name="qr" size={15} color={palette.primary} />
            <Text style={{ color: palette.primary, fontFamily: AR_FONT.bold, fontSize: 12 }}>
              مسح QR
            </Text>
          </Pressable>
          <Pressable
            onPress={() => refetch()}
            accessible
            accessibilityLabel="تحديث الحالة"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: palette.surface,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: palette.surfaceLine,
              paddingHorizontal: 10,
              paddingVertical: 8,
              minHeight: 38,
            }}
          >
            <Icon name="refresh" size={15} color={palette.textSub} />
            <Text style={{ color: palette.textSub, fontFamily: AR_FONT.bold, fontSize: 12 }}>
              تحديث
            </Text>
          </Pressable>
        </View>
      </View>

      {!trackingKey ? (
        <EmptyState
          message="لا يوجد رقم طلب — امسح رمز QR من الفاتورة أو أدخل الرقم"
          icon="qr"
          actionLabel="إدخال رقم أو مسح QR"
          onAction={() => setQrOpen(true)}
        />
      ) : isLoading ? (
        <LoadingState message="جاري جلب حالة الطلب..." />
      ) : isError || !data ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'تعذر جلب الطلب'}
          onRetry={() => refetch()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={palette.primary}
            />
          }
        >
          <StatusCard
            data={data}
            notifEnabled={notifEnabled}
            onEnableNotif={() => void handleEnableNotif()}
          />

          {token ? (
            <View
              style={{
                backgroundColor: palette.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: palette.surfaceLine,
                padding: 14,
                marginTop: 12,
                gap: 10,
              }}
            >
              <AppText style={{ color: palette.textSub, fontFamily: AR_FONT.bold, fontSize: 13 }}>
                تحكم الموظف: تغيير حالة الطلب
              </AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {STAFF_STATUSES.map((st) => {
                  const active = data.status === st;
                  return (
                    <Pressable
                      key={st}
                      disabled={busyStatus || active}
                      onPress={() => void handleStatusChange(st)}
                      style={{
                        backgroundColor: active ? palette.primary : palette.surfaceRaised,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: active ? palette.primary : palette.surfaceLine,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                      }}
                    >
                      <Text
                        style={{
                          color: active ? palette.onPrimary : palette.text,
                          fontFamily: AR_FONT.bold,
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
          <AppText
            style={{
              color: palette.textFaint,
              fontFamily: AR_FONT.regular,
              fontSize: 12,
              textAlign: 'center',
              marginTop: 22,
            }}
          >
            التحديث تلقائي كل 30 ثانية حتى إغلاق الشاشة
          </AppText>
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
