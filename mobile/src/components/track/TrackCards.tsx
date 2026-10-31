import { Pressable, Text, View } from 'react-native';
import AppText from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/StateView';
import TrackSteps from './TrackSteps';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { statusLabel, type OrderStatus } from '@/lib/statuses';
import { estimateMinutes } from '@/lib/estimate';
import type { TrackedOrder } from '@/api/types';

const card = {
  backgroundColor: '#141e30',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
  padding: 14,
} as const;

export function StatusCard({
  data,
  notifEnabled,
  onEnableNotif,
}: {
  data: TrackedOrder;
  notifEnabled: boolean;
  onEnableNotif: () => void;
}) {
  const bad = data.status === 'cancelled' || data.status === 'refunded';
  const settled = data.status === 'completed' || data.status === 'ready';
  const bg = bad
    ? 'rgba(239,68,68,0.15)'
    : settled
      ? 'rgba(20,184,166,0.15)'
      : 'rgba(245,158,11,0.15)';
  const fg = bad ? '#fca5a5' : settled ? '#2dd4bf' : '#fbbf24';

  return (
    <View style={card}>
      <AppText style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 13 }}>
        رقم الفاتورة
      </AppText>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 22, flex: 1 }}>
          #{data.invoice_number}
        </AppText>
        <View style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ color: fg, fontFamily: FONT.bold, fontSize: 13 }}>
            {statusLabel(data.status)}
          </Text>
        </View>
      </View>
      <TrackSteps status={data.status as OrderStatus} />
      {data.estimatedMinutes ? (
        <AppText style={{ color: '#f59e0b', fontFamily: FONT.medium, fontSize: 13, textAlign: 'center' }}>
          زمن التجهيز التقديري: {Math.round(Number(data.estimatedMinutes))} دقيقة
        </AppText>
      ) : null}
      <Pressable
        onPress={onEnableNotif}
        style={{
          marginTop: 10,
          backgroundColor: notifEnabled ? 'rgba(34,197,94,0.15)' : '#1b2740',
          borderRadius: 8,
          paddingVertical: 8,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: notifEnabled ? '#86efac' : '#2dd4bf',
            fontFamily: FONT.bold,
            fontSize: 12,
          }}
        >
          {notifEnabled ? '🔔 الإشعارات مفعّلة لهذا الطلب' : '🔔 نبّهني عند جاهزية الطلب'}
        </Text>
      </Pressable>
    </View>
  );
}

export function ItemSection({
  data,
  canToggle,
  onToggle,
}: {
  data: TrackedOrder;
  canToggle: boolean;
  onToggle: (idx: number, next: boolean) => Promise<void>;
}) {
  const items = data.items ?? [];
  return (
    <>
      <AppText style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 16, marginTop: 16, marginBottom: 10 }}>
        بنود الطلب
      </AppText>
      <View style={{ gap: 8 }}>
        {items.map((item, index) => (
          <Pressable
            key={`${item.title}-${index}`}
            disabled={!canToggle}
            onPress={() => {
              void onToggle(index, !item.installed);
            }}
            style={[card, { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }]}
          >
            {canToggle ? (
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  backgroundColor: item.installed ? '#22c55e' : '#1b2740',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#062b27', fontFamily: FONT.bold, fontSize: 12 }}>
                  {item.installed ? '✓' : ''}
                </Text>
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text numberOfLines={2} style={{ color: '#f1f5f9', fontFamily: FONT.medium }}>
                {item.title}
                {item.type === 'service' ? '  •خدمة' : item.type === 'package' ? '  •باقة' : ''}
              </Text>
              {Number(item.size_gb) > 0 || item.installed ? (
                <Text style={{ color: '#64748b', fontFamily: FONT.regular, fontSize: 12 }}>
                  {Number(item.size_gb) > 0 ? `الحجم: ${Math.round(Number(item.size_gb))} GB` : ''}
                  {item.installed ? '  • ✅ تم التركيب' : ''}
                </Text>
              ) : null}
            </View>
            <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold }}>
              {formatDinar(Number(item.price))}
              {item.quantity && item.quantity > 1 ? ` × ${item.quantity}` : ''}
            </Text>
          </Pressable>
        ))}
        {!items.length ? <EmptyState message="لا توجد بنود على الفاتورة" icon="📄" /> : null}
      </View>
    </>
  );
}

export function TotalsCard({ data }: { data: TrackedOrder }) {
  const paid = Number(data.paid_amount ?? 0);
  const final = Number(data.final_total ?? data.total);
  const remaining = Math.max(0, final - paid);

  return (
    <View style={[card, { marginTop: 16, gap: 8 }]}>
      <TotalRow label="المجموع" value={formatDinar(Number(data.total))} />
      {Number(data.discount) > 0 ? (
        <TotalRow label="الخصم" value={formatDinar(Number(data.discount))} />
      ) : null}
      <TotalRow label="المطلوب" value={formatDinar(final)} />
      <TotalRow label="المدفوع" value={formatDinar(paid)} />
      {remaining > 0 ? <TotalRow label="الباقي" value={formatDinar(remaining)} /> : null}
      {data.customer_name ? (
        <AppText style={{ color: '#64748b', fontFamily: FONT.regular, fontSize: 12 }}>
          العميل: {data.customer_name}
        </AppText>
      ) : null}
      {data.totalSize ? (
        <AppText style={{ color: '#64748b', fontFamily: FONT.regular, fontSize: 12 }}>
          إجمالي الحجم: {Math.round(Number(data.totalSize))} GB — تقديراً{' '}
          {estimateMinutes(Number(data.totalSize))} دقيقة
        </AppText>
      ) : null}
    </View>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <AppText style={{ color: '#94a3b8', fontFamily: FONT.regular }}>{label}</AppText>
      <AppText style={{ color: '#f1f5f9', fontFamily: FONT.medium }}>{value}</AppText>
    </View>
  );
}
