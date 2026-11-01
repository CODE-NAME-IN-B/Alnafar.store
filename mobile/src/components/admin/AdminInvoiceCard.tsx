import { Pressable, StyleSheet, Text, View } from 'react-native';
import { parseInvoiceItems, type InvoiceRecord } from '@/api/invoices';
import Icon, { type IconName } from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import { statusLabel } from '@/lib/statuses';
import { formatArabicDate, formatInvoiceCode, LtrText } from '@/components/ui/LtrText';
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

/**
 * بطاقة فاتورة لوحة الإدارة — نسخة مرتبة:
 * لون محايد واحد للبطاقة، شريط جانبي رفيع فقط يعبّر عن حالة الدفع،
 * زر أساسي واحد للإجراء الأهم، وبقية الإجراءات بأيقونات مقتطعة.
 */
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
  const unpaid = rem > 0;

  return (
    <View style={styles.card}>
      {/* شريط الحالة: كهرماني للآجل، أخضر للمدفوعة */}
      <View style={[styles.statusStrip, { backgroundColor: unpaid ? '#f59e0b' : '#22c55e' }]} />

      {/* الرأس: رقم الفاتورة + شارة الترحيل + المبلغ */}
      <View style={styles.headerRow}>
        <View style={styles.numberRow}>
          <LtrText style={styles.invoiceNum}>
            {formatInvoiceCode(inv.invoice_number)}
          </LtrText>
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
        {inv.customer_name || 'عميل نقدي'}
        {inv.customer_phone ? ` • ${inv.customer_phone}` : ''}
      </Text>

      {/* البنود — سطر واحد هادئ يعطي فكرة سريعة دون تشتيت */}
      <Text numberOfLines={1} style={styles.itemsText}>
        {items.map((i) => i.title).join('، ') || 'بدون بنود'}
      </Text>

      {/* حالة الدفع والتاريخ */}
      <View style={styles.statusRow}>
        <Text
          style={[
            styles.statusText,
            { color: unpaid ? '#fbbf24' : '#4ade80' },
          ]}
        >
          {unpaid ? `المتبقي: ${formatDinar(rem)}` : 'مدفوعة بالكامل'} (
          {statusLabel(inv.status)})
        </Text>
        <Text style={styles.dateText}>{formatArabicDate(inv.created_at)}</Text>
      </View>

      {/* الإجراءات: زر أساسي واحد صلب + ثانوية هادئة + أيقونات */}
      <View style={styles.actionsRow}>
        {unpaid ? (
          <Pressable
            onPress={onSettle}
            style={styles.primaryBtn}
            accessibilityRole="button"
            accessibilityLabel={`تسديد المتبقي ${formatDinar(rem)}`}
          >
            <Icon name="cash" size={14} color="#042f2e" />
            <Text numberOfLines={1} style={styles.primaryText}>
              تسديد المتبقي
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onOpenReceipt}
            style={styles.primaryBtn}
            accessibilityRole="button"
            accessibilityLabel="طباعة الفاتورة أو عرض QR"
          >
            <Icon name="printer" size={14} color="#042f2e" />
            <Text numberOfLines={1} style={styles.primaryText}>
              طباعة / QR
            </Text>
          </Pressable>
        )}

        {unpaid ? (
          <Pressable
            onPress={onOpenReceipt}
            style={styles.softChip}
            accessibilityRole="button"
            accessibilityLabel="عرض الفاتورة ورمز QR"
          >
            <Icon name="printer" size={13} color="#2dd4bf" />
            <Text numberOfLines={1} style={styles.softChipText}>
              طباعة / QR
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onMarkUnpaid}
            style={styles.warnChip}
            accessibilityRole="button"
            accessibilityLabel="إرجاع الفاتورة إلى غير مدفوعة"
          >
            <Icon name="undo" size={13} color="#fbbf24" />
            <Text numberOfLines={1} style={[styles.softChipText, { color: '#fbbf24' }]}>
              إرجاع آجل
            </Text>
          </Pressable>
        )}

        <IconButton icon="edit" label="تعديل الفاتورة" onPress={onEditInStore} />
        {isAdmin ? (
          <IconButton icon="trash" label="حذف الفاتورة" danger onPress={onDelete} />
        ) : null}
      </View>
    </View>
  );
}

function IconButton({
  icon,
  label,
  danger,
  onPress,
}: {
  icon: IconName;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={[styles.iconBtn, danger ? styles.iconBtnDanger : null]}
    >
      <Icon name={icon} size={15} color={danger ? '#fca5a5' : '#94a3b8'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141e30',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingLeft: 14 + 4,
    marginBottom: 10,
    gap: 7,
  },
  statusStrip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 4,
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
    flexShrink: 1,
  },
  invoiceNum: {
    color: '#f8fafc',
    fontFamily: FONT.bold,
    fontSize: 14.5,
    includeFontPadding: false,
  },
  carriedBadge: {
    backgroundColor: 'rgba(245,158,11,0.14)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
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
    flexShrink: 0,
    includeFontPadding: false,
  },
  customerText: {
    color: '#f1f5f9',
    fontFamily: FONT.bold,
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  itemsText: {
    color: '#94a3b8',
    fontFamily: FONT.regular,
    fontSize: 11.5,
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
    fontSize: 11.5,
    includeFontPadding: false,
    flexShrink: 1,
  },
  dateText: {
    color: '#94a3b8',
    fontFamily: FONT.medium,
    fontSize: 11,
    flexShrink: 0,
    includeFontPadding: false,
  },
  actionsRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#14b8a6',
    borderWidth: 1,
    borderColor: '#2dd4bf',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  primaryText: {
    color: '#042f2e',
    fontFamily: FONT.bold,
    fontSize: 12,
    includeFontPadding: false,
  },
  softChip: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(20,184,166,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.35)',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  warnChip: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  softChipText: {
    color: '#2dd4bf',
    fontFamily: FONT.bold,
    fontSize: 12,
    includeFontPadding: false,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconBtnDanger: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(248,113,113,0.35)',
  },
});
