/**
 * «تتبع طلباتي» — في تبويب المزيد:
 * الأوامر التي مسح الزبون QR الخاص بها تُحفظ هنا تلقائياً على الجهاز.
 * كل صف يظهر الحالة الحالية (منβαص مع الشبكة)، وعند «جاهز» يتوهج بالأخضر،
 * مع زر فتح التتبع وزر حذف.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Icon from '@/components/ui/Icon';
import { ScalePressable } from '@/components/ui/motion';
import { getSavedStatuses, getTrackedOrders, removeTrackedOrder } from '@/lib/trackedOrders';
import { ensureNotificationPermission } from '@/lib/notifications';
import { statusLabel } from '@/lib/statuses';
import { showToast } from '@/lib/toast';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';

export default function TrackedOrdersList() {
  const [removing, setRemoving] = useState<string | null>(null);
  const [notifAllowed, setNotifAllowed] = useState(true);
  const queryClient = useQueryClient();

  /* الصلاحية: إن رفضها المستخدم لاحقاً نعطيه زر تفعيل صريحاً في القائمة */
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (alive) setNotifAllowed(status === 'granted');
      } catch {
        if (alive) setNotifAllowed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const enableNotifs = async () => {
    const granted = await ensureNotificationPermission();
    setNotifAllowed(granted);
    showToast(
      granted ? 'فُعّلت الإشعارات — سيصلك تنبيه في شريط الهاتف' : 'لم تُمنح الإذن — فعّلها من إعدادات النظام',
      granted ? 'success' : 'error'
    );
  };

  const refsQ = useQuery({
    queryKey: ['tracked-orders'],
    queryFn: getTrackedOrders,
  });

  const refs = refsQ.data ?? [];

  /* الحالات تُقرأ من مخزن المراقب المحلي (لا شبكة هنا):
     TrackedOrderWatcher هو المصدر الوحيد الجالب — يفحص كل 60 ثانية
     ويحفظ في التخزين المحلي، ونحن نعرض ما هو محفوظ فقط. */
  const statusesQ = useQuery({
    queryKey: ['tracked-orders-statuses', refs.map((r) => r.invoice_number).join(',')],
    enabled: refs.length > 0,
    queryFn: getSavedStatuses,
    refetchInterval: 60_000,
  });

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      await removeTrackedOrder(id);
      await queryClient.invalidateQueries({ queryKey: ['tracked-orders'] });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <View style={styles.wrap}>
      {!notifAllowed ? (
        <ScalePressable
          onPress={() => void enableNotifs()}
          accessibilityRole="button"
          accessibilityLabel="تفعيل إشعارات جاهزية الطلبات"
          style={[styles.card, styles.notifHint]}
        >
          <Icon name="bell" size={15} color="#fbbf24" />
          <Text style={styles.notifHintText}>
            فُعّل إشعارات جاهزية طلبك — يظهر تنبيهها في شريط الهاتف
          </Text>
          <Text style={styles.notifHintBtn}>تفعيل</Text>
        </ScalePressable>
      ) : null}

      {refs.length === 0 ? (
        <View style={styles.card}>
          <View style={styles.emptyRow}>
            <Icon name="qr" size={16} color="#2dd4bf" />
            <Text style={styles.emptyText}>
              امسح رمز QR على فاتورتك (أعلى الرئيسية) — يُحفظ طلبك هنا تلقائياً
              ويصلك إشعار عند جاهزيته.
            </Text>
          </View>
        </View>
      ) : (
        refs.map((ref) => {
          const info = statusesQ.data?.[ref.invoice_number];
          const isReady = info === 'ready';
          return (
            <View
              key={ref.invoice_number}
              style={[styles.card, isReady && styles.cardReady]}
            >
              <ScalePressable
                onPress={() =>
                  router.push(`/track/${encodeURIComponent(ref.invoice_number)}`)
                }
                accessibilityRole="button"
                accessibilityLabel={` فتح تتبع الطلب ${ref.invoice_number}`}
                style={styles.row}
              >
                <Icon
                  name={isReady ? 'check' : 'invoice'}
                  size={15}
                  color={isReady ? '#34d399' : '#2dd4bf'}
                />
                <View style={styles.body}>
                  <Text style={styles.orderId}>طلب #{ref.invoice_number}</Text>
                  <Text
                    style={[styles.status, isReady && styles.statusReady]}
                  >
                    {info
                      ? statusLabel(info)
                      : 'جاري الفحص...'}
                  </Text>
                </View>
                <Icon name="chevron-left" size={14} color="#475569" />
              </ScalePressable>

              <Pressable
                onPress={() => void handleRemove(ref.invoice_number)}
                disabled={removing === ref.invoice_number}
                accessibilityRole="button"
                accessibilityLabel={`حذف الطلب ${ref.invoice_number} من قائمة التتبع`}
                hitSlop={8}
                style={styles.removeBtn}
              >
                <Icon
                  name="trash"
                  size={14}
                  color={removing === ref.invoice_number ? '#334155' : '#fda4af'}
                />
              </Pressable>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  card: {
    marginHorizontal: 14,
    flexDirection: ROW,
    alignItems: 'center',
    backgroundColor: '#0d1629',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 12,
  },
  cardReady: {
    borderColor: 'rgba(52, 211, 153, 0.45)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  row: {
    flex: 1,
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
  },
  body: { flex: 1 },
  orderId: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  status: {
    fontFamily: FONT.medium,
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  statusReady: {
    color: '#34d399',
    fontFamily: FONT.bold,
  },
  removeBtn: {
    padding: 6,
  },
  notifHint: {
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
    paddingLeft: 12,
  },
  notifHintText: {
    flex: 1,
    fontFamily: FONT.medium,
    color: '#d6c98d',
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  notifHintBtn: {
    fontFamily: FONT.bold,
    color: '#fbbf24',
    fontSize: 12,
  },
  emptyRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    flex: 1,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
