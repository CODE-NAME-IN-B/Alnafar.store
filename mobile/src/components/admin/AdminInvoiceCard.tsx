import { Pressable, StyleSheet, Text, View } from 'react-native';
import { parseInvoiceItems, type InvoiceRecord } from '@/api/invoices';
import Icon, { type IconName } from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { statusLabel } from '@/lib/statuses';
import { formatArabicDate } from '@/components/ui/LtrText';
import { ROW } from '@/lib/rtl';

interface Props {
  inv: InvoiceRecord;
  isAdmin: boolean;
  onOpenReceipt: () => void;
  onSettle: () => void;
  onMarkUnpaid: () => void;
  onEditInStore: () => void;
  onDelete: () => void;
}

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
      style={[
        styles.card,
        { borderColor: rem > 0 ? 'rgba(245,158,11,0.4)' : '#1e293b' },
      ]}
    >
      {/* الرأس: رقم الفاتورة + شارة الترحيل + المبلغ */}
      <View style={styles.headerRow}>
        <View style={styles.numberRow}>
          <Text style={styles.invoiceNum}>#{inv.invoice_number}</Text>
          {inv.isCarried ? (
            <View style={styles.carriedBadge}>
              <Text style={styles.carriedText}>آجل مرحّل</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.totalAmount}>{formatDinar(finalTotal)}</Text>
      </View>

      {/* بيانات العميل */}
      <Text style={styles.customerText}>
        {inv.customer_name || 'عميل نقدي'}{' '}
        {inv.customer_phone ? `• ${inv.customer_phone}` : ''}
      </Text>

      {/* الألعاب والبنود */}
      <Text numberOfLines={2} style={styles.itemsText}>
        {items.map((i) => i.title).join('، ') || 'بدون بنود'}
      </Text>

      {/* حالة الدفع والتاريخ */}
      <View style={styles.statusRow}>
        <Text
          style={[
            styles.statusText,
            { color: rem > 0 ? '#fbbf24' : '#4ade80' },
          ]}
        >
          {rem > 0 ? `المتبقي: ${formatDinar(rem)}` : 'مدفوعة بالكامل'} (
          {statusLabel(inv.status)})
        </Text>
        <Text style={styles.dateText}>
          {formatArabicDate(inv.created_at)}
        </Text>
      </View>

      {/* شريط أزرار الإجراءات الأفقي الموحد */}
      <View style={styles.actionsRow}>
        <ActionChip
          icon="printer"
          label="طباعة / QR"
          color="#2dd4bf"
          bg="rgba(20,184,166,0.14)"
          border="rgba(45,212,191,0.4)"
          onPress={onOpenReceipt}
        />
        {rem > 0 ? (
          <ActionChip
            icon="cash"
            label="تسديد المتبقي"
            color="#4ade80"
            bg="rgba(34,197,94,0.14)"
            border="rgba(74,222,128,0.4)"
            onPress={onSettle}
          />
        ) : (
          <ActionChip
            icon="undo"
            label="إرجاع آجل"
            color="#fbbf24"
            bg="rgba(245,158,11,0.14)"
            border="rgba(251,191,36,0.4)"
            onPress={onMarkUnpaid}
          />
        )}
        <ActionChip
          icon="edit"
          label="تعديل"
          color="#e2e8f0"
          bg="#1e293b"
          border="#334155"
          onPress={onEditInStore}
        />
        {isAdmin ? (
          <ActionChip
            icon="trash"
            label="حذف"
            color="#fca5a5"
            bg="rgba(239,68,68,0.14)"
            border="rgba(248,113,113,0.4)"
            onPress={onDelete}
          />
        ) : null}
      </View>
    </View>
  );
}

function ActionChip({
  icon,
  label,
  color,
  border,
  bg,
  onPress,
}: {
  icon: IconName;
  label: string;
  color: string;
  border: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionChip,
        { backgroundColor: bg, borderColor: border },
      ]}
    >
      <Icon name={icon} size={13} color={color} />
      <Text numberOfLines={1} style={[styles.actionChipText, { color }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#131c2e',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  headerRow: {
    flexDirection: ROW,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numberRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
  },
  invoiceNum: {
    color: '#f8fafc',
    fontFamily: FONT.bold,
    fontSize: 15,
    includeFontPadding: false,
  },
  carriedBadge: {
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
  },
  carriedText: {
    color: '#fbbf24',
    fontFamily: FONT.bold,
    fontSize: 10.5,
    includeFontPadding: false,
  },
  totalAmount: {
    color: '#2dd4bf',
    fontFamily: FONT.bold,
    fontSize: 16,
    includeFontPadding: false,
  },
  customerText: {
    color: '#f1f5f9',
    fontFamily: FONT.bold,
    fontSize: 13.5,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  itemsText: {
    color: '#94a3b8',
    fontFamily: FONT.regular,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  statusRow: {
    flexDirection: ROW,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  statusText: {
    fontFamily: FONT.bold,
    fontSize: 12,
    includeFontPadding: false,
  },
  dateText: {
    color: '#94a3b8',
    fontFamily: FONT.medium,
    fontSize: 11,
    includeFontPadding: false,
  },
  actionsRow: {
    flexDirection: ROW,
    gap: 6,
    marginTop: 4,
  },
  actionChip: {
    flex: 1,
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  actionChipText: {
    fontFamily: FONT.bold,
    fontSize: 11,
    includeFontPadding: false,
  },
});
