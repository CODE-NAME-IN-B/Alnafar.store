import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { InvoiceSettings } from '@/api/types';
import { markInvoicePrinted, type InvoiceRecord } from '@/api/invoices';
import { fetchInvoiceSettings } from '@/api/settings';
import { buildReceiptHtml } from './receiptHtml';

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

/** السائق الافتراضي المدمج: طباعة عبر نظام أندرويد أو تصدير ومشاركة PDF عبر expo-print */
export class ExpoPrintDriver implements PrinterDriver {
  readonly id = 'expo-print' as const;
  readonly label = 'طباعة النظام / PDF';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async printInvoice(invoice: InvoiceRecord, settings?: InvoiceSettings): Promise<void> {
    const resolvedSettings = settings ?? (await fetchInvoiceSettings());
    const html = buildReceiptHtml(invoice, resolvedSettings);
    await Print.printAsync({ html });
    if (invoice.invoice_number) {
      await markInvoicePrinted(invoice.invoice_number);
    }
  }

  async shareInvoicePdf(invoice: InvoiceRecord, settings?: InvoiceSettings): Promise<void> {
    const resolvedSettings = settings ?? (await fetchInvoiceSettings());
    const html = buildReceiptHtml(invoice, resolvedSettings);
    const { uri } = await Print.printToFileAsync({ html });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `فاتورة #${invoice.invoice_number}`,
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
