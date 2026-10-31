import { api } from './client';
import type { InvoiceItemInput, InvoiceStatus } from './types';

export interface InvoiceRecord {
  id: number;
  invoice_number: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_notes?: string | null;
  notes?: string | null;
  items: InvoiceItemInput[] | string;
  total: number;
  total_size_gb?: number | null;
  discount?: number | null;
  final_total?: number | null;
  paid_amount?: number | null;
  status: InvoiceStatus | string;
  branch_id?: number | null;
  print_count?: number;
  printed_at?: string | null;
  created_at?: string;
  has_balance?: number | boolean;
  isCarried?: number | boolean;
}

export interface InvoicesQuery {
  page?: number;
  limit?: number;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  includeUnpaid?: '1' | '0';
  unpaidOnly?: '1' | '0';
  branchId?: number | 'all' | null;
}

export interface InvoicesSummary {
  totalInvoices: number;
  totalRevenue: number;
  collectedRevenue: number;
  averageInvoice: number;
  highestInvoice: number;
  lowestInvoice: number;
  todayInvoices: number;
  todayRevenue: number;
  todayCollectedRevenue: number;
  rangeInvoices: number;
  rangeRevenue: number;
  rangeCollectedRevenue: number;
}

export interface CreateInvoicePayload {
  customerInfo: {
    name: string;
    phone: string;
    address?: string;
    notes?: string;
  };
  items: InvoiceItemInput[];
  total: number;
  totalSize: number;
  estimatedMinutes: number;
  discount: number;
  finalTotal: number;
  paidAmount: number;
  date: string;
  status: InvoiceStatus;
  branch_id?: number | null;
}

/** تطبيع حقل items في الفاتورة سواء أكان مصفوفة أو نص JSON */
export function parseInvoiceItems(raw: InvoiceItemInput[] | string | undefined): InvoiceItemInput[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** جلب قائمة الفواتير مع فلاتر التاريخ والآجل والفرع */
export async function fetchInvoices(query: InvoicesQuery = {}): Promise<InvoiceRecord[]> {
  const params: Record<string, string | number> = {
    page: query.page ?? 1,
    limit: query.limit ?? 300,
  };
  if (query.date) params.date = query.date;
  if (query.dateFrom) params.dateFrom = query.dateFrom;
  if (query.dateTo) params.dateTo = query.dateTo;
  if (query.includeUnpaid) params.includeUnpaid = query.includeUnpaid;
  if (query.unpaidOnly) params.unpaidOnly = query.unpaidOnly;
  if (query.branchId != null) params.branchId = query.branchId;

  const { data } = await api.get<{ invoices?: InvoiceRecord[] }>('/invoices', { params });
  return Array.isArray(data?.invoices) ? data.invoices : [];
}

/** جلب فاتورة مفردة برقمها الكامل */
export async function fetchInvoice(invoiceNumber: string): Promise<InvoiceRecord> {
  const { data } = await api.get<InvoiceRecord>(
    `/invoices/${encodeURIComponent(invoiceNumber)}`
  );
  return data;
}

/** جلب ملخص إحصائيات الفواتير */
export async function fetchInvoicesSummary(params?: {
  dateFrom?: string;
  dateTo?: string;
  branchId?: number | 'all' | null;
}): Promise<InvoicesSummary | null> {
  const query: Record<string, string | number> = {};
  if (params?.dateFrom) query.dateFrom = params.dateFrom;
  if (params?.dateTo) query.dateTo = params.dateTo;
  if (params?.branchId != null) query.branchId = params.branchId;
  const { data } = await api.get<{ success: boolean; summary: InvoicesSummary }>(
    '/invoices-summary',
    { params: query }
  );
  return data?.summary ?? null;
}

/** إنشاء فاتورة جديدة (موظف/مدير) */
export async function createInvoice(
  payload: CreateInvoicePayload
): Promise<{ invoice: InvoiceRecord; dailyNumber?: number }> {
  const { data } = await api.post<{
    success: boolean;
    invoice: InvoiceRecord;
    dailyNumber?: number;
  }>('/invoices', payload);
  return { invoice: data.invoice, dailyNumber: data.dailyNumber };
}

/** تعديل فاتورة قائمة */
export async function updateInvoice(
  id: number,
  payload: Partial<CreateInvoicePayload> & Record<string, unknown>
): Promise<InvoiceRecord> {
  const { data } = await api.put<{ success: boolean; invoice: InvoiceRecord }>(
    `/invoices/${id}`,
    payload
  );
  return data.invoice;
}

/** تسجيل دفعة جزئية أو تسوية كامل المتبقي على فاتورة */
export async function recordInvoicePayment(
  id: number,
  amount: number
): Promise<InvoiceRecord> {
  const { data } = await api.put<{ success: boolean; invoice: InvoiceRecord }>(
    `/invoices/${id}/payment`,
    { amount }
  );
  return data.invoice;
}

/** تسديد جماعي لكل الفواتير غير المدفوعة ضمن النطاق */
export async function payAllUnpaidInvoices(payload: {
  dateFrom?: string;
  dateTo?: string;
  includeUnpaid?: boolean;
}): Promise<{ paidCount: number; totalPaid: number; message?: string }> {
  const { data } = await api.post<{
    success: boolean;
    paidCount: number;
    totalPaid: number;
    message?: string;
  }>('/invoices/pay-all', payload);
  return data;
}

/** إرجاع الفاتورة إلى غير مدفوعة (تصفير المدفوع) */
export async function markInvoiceUnpaid(id: number): Promise<InvoiceRecord> {
  const { data } = await api.put<{ success: boolean; invoice: InvoiceRecord }>(
    `/invoices/${id}/mark-unpaid`,
    {}
  );
  return data.invoice;
}

/** تعليم الفاتورة كمطبوعة */
export async function markInvoicePrinted(invoiceNumber: string): Promise<void> {
  try {
    await api.post(`/invoices/${encodeURIComponent(invoiceNumber)}/mark-printed`);
  } catch {
    // غير حرج إن فشل تحديث عداد الطباعة
  }
}

/** حذف فاتورة مفردة (مدير فقط) */
export async function deleteInvoice(id: number): Promise<void> {
  await api.delete(`/invoices/${id}`);
}
