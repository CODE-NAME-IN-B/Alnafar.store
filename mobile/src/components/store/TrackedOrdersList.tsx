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
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { ROW } from '@/lib/rtl';

export default function TrackedOrdersList() {
  const palette = usePalette();
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

      {refsQ.isError && !refsQ.data ? (
        <View style={styles.card}>
          <View style={styles.emptyRow}>
            <Icon name="close" size={16} color={palette.danger} />
            <Text style={styles.emptyText}>
              تعذّر قراءة قائمة التتبع من الجهاز — اسحب للأسفل لإعادة المحاولة
              أو أعد فتح التبويب.
            </Text>
          </View>
        </View>
      ) : refs.length === 0 ? (
        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.surfaceLine },
          ]}
        >
          <View style={styles.emptyRow}>
            <Icon name="qr" size={16} color={palette.primary} />
            <Text style={[styles.emptyText, { color: palette.textSub }]}>
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
              style={[
                styles.card,
                { backgroundColor: palette.surface, borderColor: palette.surfaceLine },
                isReady && { borderColor: palette.success, backgroundColor: palette.surfaceRaised },
              ]}
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
                  color={isReady ? palette.success : palette.primary}
                />
                <View style={styles.body}>
                  <Text style={[styles.orderId, { color: palette.text }]}>طلب #{ref.invoice_number}</Text>
                  <Text
                    style={[
                      styles.status,
                      { color: palette.textSub },
                      isReady && { color: palette.success, fontFamily: AR_FONT.bold },
                    ]}
                  >
                    {info
                      ? statusLabel(info)
                      : 'جاري الفحص...'}
                  </Text>
                </View>
                <Icon name="chevron-left" size={14} color={palette.textFaint} />
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
                  color={
                    removing === ref.invoice_number
                      ? palette.textFaint
                      : palette.danger
                  }
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
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 12,
  },
  cardReady: {
    borderWidth: 1,
  },
  row: {
    flex: 1,
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
  },
  body: { flex: 1 },
  orderId: {
    fontFamily: AR_FONT.bold,
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  status: {
    fontFamily: AR_FONT.medium,
    fontSize: 11,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  statusReady: {},
  removeBtn: {
    padding: 6,
  },
  notifHint: {
    paddingLeft: 12,
  },
  notifHintText: {
    flex: 1,
    fontFamily: AR_FONT.medium,
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  notifHintBtn: {
    fontFamily: AR_FONT.bold,
    fontSize: 12,
  },
  emptyRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    flex: 1,
    fontFamily: AR_FONT.regular,
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
