import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { InvoiceSettings } from '@/api/types';
import { markInvoicePrinted, type InvoiceRecord } from '@/api/invoices';
import { fetchInvoiceSettings } from '@/api/settings';
import { buildReceiptHtml, paperWidthPx } from './receiptHtml';
import { buildTrackQrSvg } from './receiptQr';
import { loadPrintImageAssets } from './printAssets';

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

/** قراءة الإعدادات مرة واحدة، وبناء HTML الفاتورة مع الشعار ورمز QR (U7) */
async function composeReceiptHtml(invoice: InvoiceRecord, settings?: InvoiceSettings) {
  const resolvedSettings = (await fetchInvoiceSettings()) as InvoiceSettings;
  if (settings) Object.assign(resolvedSettings, settings);
  const [assets, qrSvg] = await Promise.all([
    loadPrintImageAssets(),
    Promise.resolve(buildTrackQrSvg(invoice.invoice_number)),
  ]);
  return {
    html: buildReceiptHtml(invoice, resolvedSettings, { assets, qrSvg }),
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
