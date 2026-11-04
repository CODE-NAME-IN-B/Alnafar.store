import { Pressable, Text, View } from 'react-native';
import AppText from '@/components/ui/AppText';
import Icon from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/StateView';
import TrackSteps from './TrackSteps';
import { FONT } from '@/lib/fonts';
import { colors } from '@/lib/colors';
import { formatDinar } from '@/lib/money';
import { statusLabel, type OrderStatus } from '@/lib/statuses';
import { estimateMinutes } from '@/lib/estimate';
import type { TrackedOrder } from '@/api/types';

const card = {
  backgroundColor: colors.elevated,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.borderSubtle,
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
  const fg = bad ? colors.dangerText : settled ? colors.brandLight : colors.warningText;

  return (
    <View style={card}>
      <AppText style={{ color: colors.dim, fontFamily: FONT.medium, fontSize: 13 }}>
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
        <AppText style={{ color: colors.text, fontFamily: FONT.bold, fontSize: 22, flex: 1 }}>
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
            color: colors.warningText,
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
          backgroundColor: notifEnabled ? colors.successSoft : colors.surfaceRaised,
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
        <Icon name="bell" size={16} color={notifEnabled ? colors.successBright : colors.brandLight} />
        <Text
          style={{
            color: notifEnabled ? colors.successBright : colors.text,
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
          color: colors.text,
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
                  backgroundColor: item.installed ? colors.success : colors.surfaceRaised,
                  borderWidth: 1,
                  borderColor: item.installed ? colors.successBright : colors.borderSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.installed ? <Icon name="check" size={14} color="colors.brandDark" /> : null}
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={2}
                style={{
                  color: colors.text,
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
                    color: item.installed ? colors.successBright : colors.faint,
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
            <Text style={{ color: colors.brandLight, fontFamily: FONT.bold, fontSize: 14 }}>
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
        <AppText style={{ color: colors.faint, fontFamily: FONT.regular, fontSize: 12, marginTop: 4 }}>
          العميل: {data.customer_name}
        </AppText>
      ) : null}
      {data.totalSize ? (
        <AppText style={{ color: colors.faint, fontFamily: FONT.regular, fontSize: 12 }}>
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
      <AppText style={{ color: colors.dim, fontFamily: FONT.regular, fontSize: 13 }}>{label}</AppText>
      <AppText
        style={{
          color: warn ? colors.warningText : highlight ? colors.brandLight : colors.text,
          fontFamily: FONT.bold,
          fontSize: highlight ? 15 : 14,
        }}
      >
        {value}
      </AppText>
    </View>
  );
}
