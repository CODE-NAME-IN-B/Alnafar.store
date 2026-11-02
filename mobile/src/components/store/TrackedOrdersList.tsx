/**
 * «تتبع طلباتي» — في تبويب المزيد:
 * الأوامر التي مسح الزبون QR الخاص بها تُحفظ هنا تلقائياً على الجهاز.
 * كل صف يظهر الحالة الحالية (منβαص مع الشبكة)، وعند «جاهز» يتوهج بالأخضر،
 * مع زر فتح التتبع وزر حذف.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { trackOrder } from '@/api/orders';
import Icon from '@/components/ui/Icon';
import { ScalePressable } from '@/components/ui/motion';
import { getTrackedOrders, removeTrackedOrder } from '@/lib/trackedOrders';
import { statusLabel } from '@/lib/statuses';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';

export default function TrackedOrdersList() {
  const [removing, setRemoving] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const refsQ = useQuery({
    queryKey: ['tracked-orders'],
    queryFn: getTrackedOrders,
  });

  const refs = refsQ.data ?? [];

  const ordersQ = useQuery({
    queryKey: ['tracked-orders-statuses', refs.map((r) => r.invoice_number).join(',')],
    enabled: refs.length > 0,
    queryFn: async () => {
      const results: Record<string, { status: string; ready: boolean }> = {};
      await Promise.all(
        refs.map(async (ref) => {
          try {
            const order = await trackOrder(ref.invoice_number);
            results[ref.invoice_number] = {
              status: order.status,
              ready: order.status === 'ready',
            };
          } catch {
            results[ref.invoice_number] = { status: 'unknown', ready: false };
          }
        })
      );
      return results;
    },
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
          const info = ordersQ.data?.[ref.invoice_number];
          const isReady = info?.ready;
          const isUnknown = info?.status === 'unknown';
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
                    style={[
                      styles.status,
                      isReady && styles.statusReady,
                      isUnknown && styles.statusUnknown,
                    ]}
                  >
                    {info
                      ? isUnknown
                        ? 'غير متوفر حالياً'
                        : statusLabel(info.status)
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
  statusUnknown: {
    color: '#64748b',
  },
  removeBtn: {
    padding: 6,
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
