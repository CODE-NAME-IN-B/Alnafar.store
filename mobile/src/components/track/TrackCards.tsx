import { Pressable, Text, View } from 'react-native';
import AppText from '@/components/ui/AppText';
import Icon from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/StateView';
import TrackSteps from './TrackSteps';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { statusLabel, type OrderStatus } from '@/lib/statuses';
import { estimateMinutes } from '@/lib/estimate';
import type { TrackedOrder } from '@/api/types';

const card = {
  backgroundColor: '#141e30',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  padding: 16,
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
    ? 'rgba(239,68,68,0.16)'
    : settled
      ? 'rgba(20,184,166,0.16)'
      : 'rgba(245,158,11,0.16)';
  const fg = bad ? '#fca5a5' : settled ? '#2dd4bf' : '#fbbf24';

  return (
    <View style={card}>
      <AppText style={{ color: '#cbd5e1', fontFamily: FONT.medium, fontSize: 13 }}>
        رقم الفاتورة / الطلب
      </AppText>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 4,
        }}
      >
        <AppText style={{ color: '#f8fafc', fontFamily: FONT.bold, fontSize: 22, flex: 1 }}>
          #{data.invoice_number}
        </AppText>
        <View
          style={{
            backgroundColor: bg,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text style={{ color: fg, fontFamily: FONT.bold, fontSize: 13 }}>
            {statusLabel(data.status)}
          </Text>
        </View>
      </View>
      <TrackSteps status={data.status as OrderStatus} />
      {data.estimatedMinutes ? (
        <AppText
          style={{
            color: '#fbbf24',
            fontFamily: FONT.bold,
            fontSize: 13,
            textAlign: 'center',
            marginBottom: 4,
          }}
        >
          زمن التجهيز التقديري: {Math.round(Number(data.estimatedMinutes))} دقيقة
        </AppText>
      ) : null}
      <Pressable
        onPress={onEnableNotif}
        style={{
          marginTop: 10,
          backgroundColor: notifEnabled ? 'rgba(34,197,94,0.18)' : '#1b2b48',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: notifEnabled ? 'rgba(34,197,94,0.4)' : 'rgba(45,212,191,0.35)',
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Icon name="bell" size={16} color={notifEnabled ? '#86efac' : '#2dd4bf'} />
        <Text
          style={{
            color: notifEnabled ? '#86efac' : '#f8fafc',
            fontFamily: FONT.bold,
            fontSize: 13,
          }}
        >
          {notifEnabled ? 'الإشعارات مفعّلة لهذا الطلب' : 'نبّهني عند جاهزية الطلب'}
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
      <AppText
        style={{
          color: '#f8fafc',
          fontFamily: FONT.bold,
          fontSize: 16,
          marginTop: 16,
          marginBottom: 10,
        }}
      >
        بنود الطلب ({items.length})
      </AppText>
      <View style={{ gap: 8 }}>
        {items.map((item, index) => (
          <Pressable
            key={`${item.title}-${index}`}
            disabled={!canToggle}
            onPress={() => {
              void onToggle(index, !item.installed);
            }}
            style={[
              card,
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 14,
                gap: 10,
              },
            ]}
          >
            {canToggle ? (
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  backgroundColor: item.installed ? '#22c55e' : '#1b2b48',
                  borderWidth: 1,
                  borderColor: item.installed ? '#4ade80' : 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.installed ? <Icon name="check" size={14} color="#ffffff" /> : null}
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={2}
                style={{
                  color: '#f8fafc',
                  fontFamily: FONT.bold,
                  fontSize: 14,
                  textAlign: 'right',
                }}
              >
                {item.title}
                {item.type === 'service'
                  ? '  • خدمة'
                  : item.type === 'package'
                    ? '  • باقة'
                    : ''}
              </Text>
              {Number(item.size_gb) > 0 || item.installed ? (
                <Text
                  style={{
                    color: item.installed ? '#4ade80' : '#94a3b8',
                    fontFamily: FONT.medium,
                    fontSize: 12,
                    textAlign: 'right',
                    marginTop: 2,
                  }}
                >
                  {Number(item.size_gb) > 0 ? `الحجم: ${Math.round(Number(item.size_gb))} GB` : ''}
                  {item.installed ? '  • تم التركيب' : ''}
                </Text>
              ) : null}
            </View>
            <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold, fontSize: 14 }}>
              {formatDinar(Number(item.price))}
              {item.quantity && item.quantity > 1 ? ` × ${item.quantity}` : ''}
            </Text>
          </Pressable>
        ))}
        {!items.length ? <EmptyState message="لا توجد بنود على الفاتورة" icon="invoice" /> : null}
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
      <TotalRow label="المطلوب" value={formatDinar(final)} highlight />
      <TotalRow label="المدفوع" value={formatDinar(paid)} />
      {remaining > 0 ? <TotalRow label="الباقي" value={formatDinar(remaining)} warn /> : null}
      {data.customer_name ? (
        <AppText style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 12, marginTop: 4 }}>
          العميل: {data.customer_name}
        </AppText>
      ) : null}
      {data.totalSize ? (
        <AppText style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 12 }}>
          إجمالي الحجم: {Math.round(Number(data.totalSize))} GB — تقديراً{' '}
          {estimateMinutes(Number(data.totalSize))} دقيقة
        </AppText>
      ) : null}
    </View>
  );
}

function TotalRow({
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
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <AppText style={{ color: '#cbd5e1', fontFamily: FONT.regular, fontSize: 13 }}>{label}</AppText>
      <AppText
        style={{
          color: warn ? '#fbbf24' : highlight ? '#2dd4bf' : '#f8fafc',
          fontFamily: FONT.bold,
          fontSize: highlight ? 15 : 14,
        }}
      >
        {value}
      </AppText>
    </View>
  );
}
