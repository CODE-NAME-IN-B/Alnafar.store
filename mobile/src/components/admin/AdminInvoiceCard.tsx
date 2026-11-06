import { Pressable, StyleSheet, Text, View } from 'react-native';
import { parseInvoiceItems, type InvoiceRecord } from '@/api/invoices';
import Icon, { type IconName } from '@/components/ui/Icon';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
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
 * بطاقة فاتورة لوحة الإدارة — متوافقة بالكامل مع Modern Minimalism ورموز tokens:
 * شريط جانبي دلالي رفيع (4px)، رقم فاتورة معزول LTR، زر أساسي واحد متباين،
 * وخلو كامل من التيل القديم #14b8a6.
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
  const palette = usePalette();
  const items = parseInvoiceItems(inv.items);
  const finalTotal = Math.max(0, Number(inv.total) - Number(inv.discount ?? 0));
  const paid = Number(inv.paid_amount ?? 0);
  const rem = Math.max(0, finalTotal - paid);
  const unpaid = rem > 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.surfaceLine,
        },
      ]}
    >
      {/* شريط الحالة الجانبي */}
      <View
        style={[
          styles.statusStrip,
          { backgroundColor: unpaid ? palette.warning : palette.success },
        ]}
      />

      {/* الرأس: رقم الفاتورة + شارة الترحيل + المبلغ */}
      <View style={styles.headerRow}>
        <View style={styles.numberRow}>
          <LtrText style={[styles.invoiceNum, { color: palette.text }]}>
            {formatInvoiceCode(inv.invoice_number)}
          </LtrText>
          {inv.isCarried ? (
            <View
              style={[
                styles.carriedBadge,
                {
                  backgroundColor: palette.warning + '18',
                  borderColor: palette.warning + '40',
                },
              ]}
            >
              <Text style={[styles.carriedText, { color: palette.warning }]}>آجل مرحّل</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.totalAmount, { color: palette.money }]}>
          {formatDinar(finalTotal)}
        </Text>
      </View>

      {/* بيانات العميل */}
      <Text numberOfLines={1} style={[styles.customerText, { color: palette.text }]}>
        {inv.customer_name || 'عميل نقدي'}
        {inv.customer_phone ? ` • ${inv.customer_phone}` : ''}
      </Text>

      {/* البنود */}
      <Text numberOfLines={1} style={[styles.itemsText, { color: palette.textSub }]}>
        {items.map((i) => i.title).join('، ') || 'بدون بنود'}
      </Text>

      {/* حالة الدفع والتاريخ */}
      <View style={[styles.statusRow, { borderTopColor: palette.surfaceLine }]}>
        <Text
          style={[
            styles.statusText,
            { color: unpaid ? palette.warning : palette.success },
          ]}
        >
          {unpaid ? `المتبقي: ${formatDinar(rem)} (قيد الانتظار)` : `مدفوعة بالكامل (${statusLabel(inv.status)})`}
        </Text>
        <Text style={[styles.dateText, { color: palette.textFaint }]}>
          {formatArabicDate(inv.created_at)}
        </Text>
      </View>

      {/* الإجراءات: تسلسل هرمي واضح */}
      <View style={styles.actionsRow}>
        {unpaid ? (
          <Pressable
            onPress={onSettle}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: pressed ? palette.primaryPressed : palette.primary,
                borderColor: palette.primary,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`تسديد المتبقي ${formatDinar(rem)}`}
          >
            <Icon name="cash" size={15} color={palette.onPrimary} />
            <Text numberOfLines={1} style={[styles.primaryText, { color: palette.onPrimary }]}>
              تسديد المتبقي
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onOpenReceipt}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: pressed ? palette.surfaceLine : palette.surfaceRaised,
                borderColor: palette.surfaceLine,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="طباعة الفاتورة أو عرض QR"
          >
            <Icon name="printer" size={15} color={palette.text} />
            <Text numberOfLines={1} style={[styles.primaryText, { color: palette.text }]}>
              طباعة / QR
            </Text>
          </Pressable>
        )}

        {unpaid ? (
          <Pressable
            onPress={onOpenReceipt}
            style={({ pressed }) => [
              styles.softChip,
              {
                backgroundColor: pressed ? palette.surfaceLine : palette.surfaceRaised,
                borderColor: palette.surfaceLine,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="عرض الفاتورة ورمز QR"
          >
            <Icon name="printer" size={14} color={palette.text} />
            <Text numberOfLines={1} style={[styles.softChipText, { color: palette.text }]}>
              طباعة / QR
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onMarkUnpaid}
            style={({ pressed }) => [
              styles.warnChip,
              {
                backgroundColor: pressed ? palette.warning + '25' : palette.warning + '15',
                borderColor: palette.warning + '40',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="إرجاع الفاتورة إلى غير مدفوعة"
          >
            <Icon name="undo" size={14} color={palette.warning} />
            <Text numberOfLines={1} style={[styles.softChipText, { color: palette.warning }]}>
              إرجاع آجل
            </Text>
          </Pressable>
        )}

        <IconButton
          icon="edit"
          label="تعديل الفاتورة"
          onPress={onEditInStore}
        />
        {isAdmin ? (
          <IconButton
            icon="trash"
            label="حذف الفاتورة"
            danger
            onPress={onDelete}
          />
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
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [
        styles.iconBtn,
        {
          backgroundColor: danger
            ? pressed ? palette.danger + '25' : palette.danger + '14'
            : pressed ? palette.surfaceLine : palette.surfaceRaised,
          borderColor: danger ? palette.danger + '40' : palette.surfaceLine,
        },
      ]}
    >
      <Icon name={icon} size={15} color={danger ? palette.danger : palette.textSub} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingLeft: 16 + 4,
    marginBottom: 12,
    gap: 8,
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
    fontFamily: AR_FONT.bold,
    fontSize: 15,
    includeFontPadding: false,
  },
  carriedBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
  },
  carriedText: {
    fontFamily: AR_FONT.bold,
    fontSize: 11,
    includeFontPadding: false,
  },
  totalAmount: {
    fontFamily: AR_FONT.bold,
    fontSize: 16,
    flexShrink: 0,
    includeFontPadding: false,
  },
  customerText: {
    fontFamily: AR_FONT.bold,
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  itemsText: {
    fontFamily: AR_FONT.regular,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  statusRow: {
    flexDirection: ROW,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  statusText: {
    fontFamily: AR_FONT.bold,
    fontSize: 12,
    includeFontPadding: false,
    flexShrink: 1,
  },
  dateText: {
    fontFamily: AR_FONT.medium,
    fontSize: 11,
    flexShrink: 0,
    includeFontPadding: false,
  },
  actionsRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  primaryText: {
    fontFamily: AR_FONT.bold,
    fontSize: 12.5,
    includeFontPadding: false,
  },
  softChip: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  warnChip: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  softChipText: {
    fontFamily: AR_FONT.bold,
    fontSize: 12.5,
    includeFontPadding: false,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
