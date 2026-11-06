import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useQuery } from '@tanstack/react-query';
import ModalSheet from '@/components/ui/ModalSheet';
import AppButton from '@/components/ui/AppButton';
import Icon from '@/components/ui/Icon';
import { fetchInvoiceSettings } from '@/api/settings';
import { parseInvoiceItems, type InvoiceRecord } from '@/api/invoices';
import { getPrinterDriver } from '@/print/PrinterDriver';
import { FONT } from '@/lib/fonts';
import { receiptColors, colors } from '@/lib/colors';
import { formatDinar } from '@/lib/money';
import { API_BASE } from '@/lib/env';
import { showToast } from '@/lib/toast';
import { formatInvoiceCode, LtrText } from '@/components/ui/LtrText';

interface Props {
  visible: boolean;
  invoice: InvoiceRecord | null;
  onClose: () => void;
  /** فتح حوار الطباعة تلقائياً عند الفتح — تدفق الكاشير بعد إنشاء الفاتورة مباشرة */
  autoPrint?: boolean;
}

/**
 * شاشة الفاتورة الأصلية (مكونات React Native أصلية 100%).
 * تقرأ اسم المتجر والعنوان والهاتف من `/api/invoice-settings` وتعرض QR أصلياً.
 */
export default function NativeReceiptModal({ visible, invoice, onClose, autoPrint }: Props) {
  const [printing, setPrinting] = useState(false);
  const [sharing, setSharing] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ['invoice-settings'],
    queryFn: fetchInvoiceSettings,
    staleTime: 5 * 60_000,
    enabled: visible,
  });

  const autoPrintDone = useRef<string | null>(null);

  const handlePrint = async () => {
    if (!invoice) return;
    setPrinting(true);
    try {
      await getPrinterDriver().printInvoice(invoice, settingsQuery.data ?? {});
      showToast('تم إرسال الفاتورة للطباعة');
    } catch {
      showToast('تعذر الطباعة، جرّب مشاركة PDF', 'error');
    } finally {
      setPrinting(false);
    }
  };

  const handleSharePdf = async () => {
    if (!invoice) return;
    setSharing(true);
    try {
      await getPrinterDriver().shareInvoicePdf(invoice, settingsQuery.data ?? {});
    } catch {
      showToast('تعذر إنشاء ملف PDF', 'error');
    } finally {
      setSharing(false);
    }
  };

  /* طباعة فورية عند الفتح (تدفق الكاشير): مرة واحدة لكل فاتورة بعد جلب إعدادات المتجر */
  useEffect(() => {
    if (!autoPrint || !visible || !invoice || !settingsQuery.data) return;
    if (autoPrintDone.current === String(invoice.id)) return;
    autoPrintDone.current = String(invoice.id);
    void handlePrint();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- يقرأ handlePrint بما يغطيه invoice.id من الاعتماديات
  }, [autoPrint, visible, invoice?.id, settingsQuery.data]);

  if (!invoice) return null;

  const settings = settingsQuery.data ?? {};
  const storeName = (settings.store_name || '').trim() || 'الشاردة ستور';
  const storeNameEn = (settings.store_name_english || '').trim() || 'Alnafar Store';
  const storeAddr = (settings.store_address || '').trim();
  const storePhone = (settings.store_phone || '').trim();

  const items = parseInvoiceItems(invoice.items);
  const total =
    Number(invoice.total) ||
    items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
  const discount = Number(invoice.discount) || 0;
  const finalTotal = Math.max(0, total - discount);
  const paidAmount = Number(invoice.paid_amount ?? finalTotal);
  const remaining = Math.max(0, finalTotal - paidAmount);
  const isPaid = paidAmount >= finalTotal && finalTotal > 0;

  const webOrigin = API_BASE.replace(/\/api\/?$/, '');
  const trackingUrl = `${webOrigin}/#/track/${encodeURIComponent(String(invoice.invoice_number))}`;

  return (
    <ModalSheet visible={visible} onClose={onClose} title={`فاتورة ${formatInvoiceCode(invoice.invoice_number)}`}>
      <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
        {/* بطاقة إيصال حراري أصلية (مطابقة للمطبوع المضغوط — ورق أبيض دائماً) */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            gap: 5,
            borderWidth: 1,
            borderColor: '#E3DDCB',
          }}
        >
          <Text style={{ color: '#1B2A21', fontFamily: FONT.bold, fontSize: 17 }}>
            {storeName}
          </Text>
          <Text style={{ color: '#5E6F63', fontFamily: FONT.medium, fontSize: 11 }}>
            {storeNameEn}
          </Text>
          {storeAddr ? (
            <Text
              style={{
                color: '#5E6F63',
                fontFamily: FONT.regular,
                fontSize: 11,
                textAlign: 'center',
              }}
            >
              {storeAddr}
            </Text>
          ) : null}

          <View style={dashedLine} />

          <LtrText style={{ color: '#1B2A21', fontSize: 16 }}>
            {formatInvoiceCode(invoice.invoice_number)}
          </LtrText>
          <Text style={{ color: '#1B2A21', fontFamily: FONT.bold, fontSize: 14 }}>
            {invoice.customer_name || 'عميل نقدي'}
          </Text>
          {invoice.customer_phone ? (
            <Text style={{ color: '#5E6F63', fontFamily: FONT.regular, fontSize: 12 }}>
              {invoice.customer_phone}
            </Text>
          ) : null}

          <View style={dashedLine} />

          {/* السعر النهائي فقط — بلا بيانات الألعاب (مطابقة لما تظهره واجهة التتبع) */}
          <Text style={{ color: '#1B2A21', fontFamily: FONT.bold, fontSize: 19 }}>
            {formatDinar(finalTotal)}
          </Text>
          {/* المتبقي يظهر مرة واحدة داخل شارة الحالة فقط (كان يتكرر سطراً وشارة) */}

          <View
            style={{
              backgroundColor: isPaid ? '#dcfce7' : '#fee2e2',
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                color: isPaid ? '#15803d' : '#b91c1c',
                fontFamily: FONT.bold,
                fontSize: 12,
              }}
            >
              {isPaid
                ? 'مدفوع بالكامل'
                : paidAmount > 0
                  ? `المتبقي: ${formatDinar(remaining)}`
                  : 'غير مدفوع (آجل)'}
            </Text>
          </View>

          <View style={{ marginVertical: 10, alignItems: 'center', gap: 4 }}>
            <QRCode value={trackingUrl} size={132} />
            <Text style={{ color: receiptColors.muted, fontFamily: FONT.regular, fontSize: 12 }}>
              امسح الرمز لتتبع حالة الطلب
            </Text>
          </View>

          {storePhone ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Icon name="phone" size={13} color={receiptColors.muted} />
              <Text style={{ color: receiptColors.muted, fontFamily: FONT.medium, fontSize: 12, writingDirection: 'ltr' as const }}>
                {storePhone}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <View style={{ flex: 1 }}>
          <AppButton label="طباعة" icon="printer" onPress={handlePrint} loading={printing} />
        </View>
        <View style={{ flex: 1 }}>
          <AppButton
            label="مشاركة PDF"
            icon="share"
            variant="secondary"
            onPress={handleSharePdf}
            loading={sharing}
          />
        </View>
      </View>
    </ModalSheet>
  );
}

const dashedLine = {
  width: '100%' as const,
  height: 1,
  backgroundColor: receiptColors.divider,
  marginVertical: 6,
};
