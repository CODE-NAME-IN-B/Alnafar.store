import { Pressable, Text, View } from 'react-native';
import { parseInvoiceItems, type InvoiceRecord } from '@/api/invoices';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { statusLabel } from '@/lib/statuses';

interface Props {
  inv: InvoiceRecord;
  isAdmin: boolean;
  onOpenReceipt: () => void;
  onSettle: () => void;
  onMarkUnpaid: () => void;
  onEditInStore: () => void;
  onDelete: () => void;
}

/** بطاقة فاتورة في تبويب الفواتير بلوحة الإدارة */
export default function AdminInvoiceCard({
  inv,
  isAdmin,
  onOpenReceipt,
  onSettle,
  onMarkUnpaid,
  onEditInStore,
  onDelete,
}: Props) {
  const items = parseInvoiceItems(inv.items);
  const finalTotal = Math.max(0, Number(inv.total) - Number(inv.discount ?? 0));
  const paid = Number(inv.paid_amount ?? 0);
  const rem = Math.max(0, finalTotal - paid);

  return (
    <View
      style={{
        backgroundColor: '#141e30',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: rem > 0 ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.06)',
        padding: 12,
        marginBottom: 10,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 16 }}>
            #{inv.invoice_number}
          </Text>
          {inv.isCarried ? (
            <View
              style={{
                backgroundColor: 'rgba(245,158,11,0.2)',
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: '#fbbf24', fontFamily: FONT.bold, fontSize: 10 }}>
                آجل مرحّل
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold, fontSize: 15 }}>
          {formatDinar(finalTotal)}
        </Text>
      </View>

      <Text style={{ color: '#cbd5e1', fontFamily: FONT.medium, fontSize: 13 }}>
        {inv.customer_name || 'عميل نقدي'} {inv.customer_phone ? `• ${inv.customer_phone}` : ''}
      </Text>

      <Text numberOfLines={2} style={{ color: '#94a3b8', fontFamily: FONT.regular, fontSize: 12 }}>
        {items.map((i) => i.title).join('، ') || 'بدون بنود'}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{
            color: rem > 0 ? '#f59e0b' : '#22c55e',
            fontFamily: FONT.bold,
            fontSize: 12,
          }}
        >
          {rem > 0 ? `المتبقي: ${formatDinar(rem)}` : 'مدفوعة بالكامل'} ({statusLabel(inv.status)})
        </Text>
        <Text style={{ color: '#64748b', fontFamily: FONT.regular, fontSize: 11 }}>
          {inv.created_at ? inv.created_at.slice(0, 10) : ''}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
        <ActionChip label="🧾 طباعة / QR" color="#14b8a6" onPress={onOpenReceipt} />
        {rem > 0 ? (
          <ActionChip label="💵 تسديد المتبقي" color="#22c55e" onPress={onSettle} />
        ) : (
          <ActionChip label="↩️ إرجاع لآجل" color="#f59e0b" onPress={onMarkUnpaid} />
        )}
        <ActionChip label="✏️ تعديل" color="#8a5cff" onPress={onEditInStore} />
        {isAdmin ? <ActionChip label="🗑️ حذف" color="#ef4444" onPress={onDelete} /> : null}
      </View>
    </View>
  );
}

function ActionChip({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#0b1220',
        borderWidth: 1,
        borderColor: color,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
      }}
    >
      <Text style={{ color, fontFamily: FONT.bold, fontSize: 11 }}>{label}</Text>
    </Pressable>
  );
}
