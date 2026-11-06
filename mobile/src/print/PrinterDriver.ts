import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { InvoiceSettings } from '@/api/types';
import { markInvoicePrinted, type InvoiceRecord } from '@/api/invoices';
import { fetchInvoiceSettings } from '@/api/settings';
import { buildReceiptHtml, paperWidthPx } from './receiptHtml';
import { buildTrackQrSvg } from './receiptQr';

/**
 * واجهة موحدة للطباعة الحرارية والـ PDF (القسم 5 من الخطة).
 * تجعل الشاشات مستقلة تماماً عن نوع الطابعة (PDF / Sunmi مدمجة / Bluetooth ESC-POS).
 */
export interface PrinterDriver {
  readonly id: 'expo-print' | 'sunmi' | 'bluetooth-escpos';
  readonly label: string;
  isAvailable(): Promise<boolean>;
  printInvoice(invoice: InvoiceRecord, settings?: InvoiceSettings): Promise<void>;
  shareInvoicePdf(invoice: InvoiceRecord, settings?: InvoiceSettings): Promise<void>;
}

let cachedSettings: InvoiceSettings | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 دقائق

async function getCachedInvoiceSettings(): Promise<InvoiceSettings> {
  const now = Date.now();
  if (cachedSettings && now - lastFetchTime < CACHE_TTL) {
    return cachedSettings;
  }
  try {
    const fetched = (await fetchInvoiceSettings()) as InvoiceSettings;
    cachedSettings = fetched;
    lastFetchTime = now;
    return fetched;
  } catch {
    return cachedSettings ?? ({} as InvoiceSettings);
  }
}

/** قراءة الإعدادات بذاكرة تخزين مؤقتة سريعة (<300ms)، وبناء HTML الفاتورة المضغوطة مع رمز QR */
async function composeReceiptHtml(invoice: InvoiceRecord, settings?: InvoiceSettings) {
  const resolvedSettings = { ...(await getCachedInvoiceSettings()) };
  if (settings) Object.assign(resolvedSettings, settings);
  const qrSvg = buildTrackQrSvg(invoice.invoice_number);
  return {
    html: buildReceiptHtml(invoice, resolvedSettings, { qrSvg }),
    paperMM: Number(resolvedSettings.paper_width) || 58,
  };
}

/** السائق الافتراضي المدمج: طباعة عبر نظام أندرويد أو تصدير ومشاركة PDF عبر expo-print */
export class ExpoPrintDriver implements PrinterDriver {
  readonly id = 'expo-print' as const;
  readonly label = 'طباعة النظام / PDF';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async printInvoice(invoice: InvoiceRecord, settings?: InvoiceSettings): Promise<void> {
    const { html, paperMM } = await composeReceiptHtml(invoice, settings);
    await Print.printAsync({ html, width: paperWidthPx(paperMM) });
    if (invoice.invoice_number) {
      await markInvoicePrinted(invoice.invoice_number);
    }
  }

  async shareInvoicePdf(invoice: InvoiceRecord, settings?: InvoiceSettings): Promise<void> {
    const { html, paperMM } = await composeReceiptHtml(invoice, settings);
    const { uri } = await Print.printToFileAsync({ html, width: paperWidthPx(paperMM) });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `فاتورة رقم ${invoice.invoice_number ?? ''}`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      await Print.printAsync({ uri });
    }
    if (invoice.invoice_number) {
      await markInvoicePrinted(invoice.invoice_number);
    }
  }
}

let activeDriver: PrinterDriver = new ExpoPrintDriver();

export function getPrinterDriver(): PrinterDriver {
  return activeDriver;
}

export function setPrinterDriver(driver: PrinterDriver): void {
  activeDriver = driver;
}
