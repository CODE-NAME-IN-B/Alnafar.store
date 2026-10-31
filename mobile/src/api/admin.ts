import { api } from './client';
import type { AuthUser, Branch, InvoiceSettings } from './types';
import type { InvoiceRecord } from './invoices';

export * from './adminCatalog';

/* --- 1. الجرد اليومي والترقيم --- */

export interface DailyReportData {
  id?: number;
  date: string;
  total_invoices: number;
  total_revenue: number;
  total_discount: number;
  net_revenue: number;
  collected_revenue?: number;
  last_invoice_number?: number;
  is_closed: number | boolean;
  closed_at?: string | null;
  notes?: string | null;
  invoices: InvoiceRecord[];
  carriedInvoices?: InvoiceRecord[];
}

export interface NumberingStatus {
  today: string;
  currentCount: number;
  nextInvoiceNumber: number;
  totalInvoicesToday: number;
  totalRevenueToday: number;
  isClosed: boolean;
}

export async function fetchDailyReport(
  date: string,
  includeUnpaid = true,
  branchId?: number | 'all' | null
): Promise<DailyReportData> {
  const params: Record<string, string | number> = {
    includeUnpaid: includeUnpaid ? '1' : '0',
  };
  if (branchId != null) params.branchId = branchId;
  const { data } = await api.get<{ success: boolean; report: DailyReportData }>(
    `/daily-report/${encodeURIComponent(date)}`,
    { params }
  );
  return data.report;
}

export async function fetchDailyReportsHistory(
  branchId?: number | 'all' | null
): Promise<DailyReportData[]> {
  const params: Record<string, string | number> = { limit: 30, offset: 0 };
  if (branchId != null) params.branchId = branchId;
  const { data } = await api.get<{ success: boolean; reports: DailyReportData[] }>(
    '/daily-reports',
    { params }
  );
  return Array.isArray(data?.reports) ? data.reports : [];
}

export async function closeDailyReport(date: string, notes?: string): Promise<void> {
  await api.post(`/daily-report/${encodeURIComponent(date)}/close`, { notes: notes ?? '' });
}

export async function fetchNumberingStatus(): Promise<NumberingStatus> {
  const { data } = await api.get<NumberingStatus & { success: boolean }>(
    '/invoice-numbering-status'
  );
  return data;
}

export async function resetDailyNumbering(date?: string): Promise<void> {
  await api.post('/reset-daily-numbering', date ? { date } : {});
}

/* --- 2. المستخدمون والفروع --- */

export interface AdminUserRecord extends AuthUser {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  is_active?: number | boolean;
  last_login?: string | null;
}

export async function fetchUsers(): Promise<AdminUserRecord[]> {
  const { data } = await api.get<{ users?: AdminUserRecord[] }>('/users');
  return Array.isArray(data?.users) ? data.users : [];
}

export async function createUser(payload: {
  username: string;
  password: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'staff';
  branch_id: number | null;
}): Promise<void> {
  await api.post('/users', payload);
}

export async function updateUser(
  id: number,
  payload: {
    full_name?: string;
    phone?: string;
    role?: 'admin' | 'staff';
    is_active?: number | boolean;
    password?: string;
    branch_id?: number | null;
  }
): Promise<void> {
  await api.put(`/users/${id}`, payload);
}

export async function deactivateUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function createBranch(payload: {
  name: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
}): Promise<Branch> {
  const { data } = await api.post<{ branch: Branch }>('/branches', payload);
  return data.branch;
}

export async function updateBranch(
  id: number,
  payload: { name?: string; address?: string; phone?: string; is_active?: boolean | number }
): Promise<void> {
  await api.put(`/branches/${id}`, payload);
}

export async function deleteBranch(id: number): Promise<void> {
  await api.delete(`/branches/${id}`);
}

/* --- 3. الإحصائيات، سجل النشاط، وإعدادات الفاتورة --- */

export interface DashboardStats {
  today: { orders: number; revenue: number; collected: number; discounts: number };
  month: { orders: number; revenue: number; collected: number };
  pendingOrders: number;
  totalGames: number;
  totalUsers: number;
  last7Days: Array<{ date: string; orders: number; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  topGames: Array<{ title: string; count: number; revenue: number }>;
}

export interface AuditLogEntry {
  id: number;
  user_id?: number;
  username?: string;
  action: string;
  entity_type?: string;
  entity_id?: number | string;
  created_at: string;
}

export async function fetchDashboardStats(
  branchId?: number | 'all' | null
): Promise<DashboardStats> {
  const params: Record<string, string | number> = {};
  if (branchId != null) params.branchId = branchId;
  const { data } = await api.get<{ stats: DashboardStats }>('/stats/dashboard', { params });
  return data.stats;
}

export async function fetchAuditLogs(page = 1, limit = 50): Promise<AuditLogEntry[]> {
  const { data } = await api.get<{ logs?: AuditLogEntry[] }>('/audit-logs', {
    params: { page, limit },
  });
  return Array.isArray(data?.logs) ? data.logs : [];
}

export async function saveInvoiceSettings(settings: InvoiceSettings): Promise<void> {
  await api.post('/invoice-settings', settings);
}
