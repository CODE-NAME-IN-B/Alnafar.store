import { api } from './client';
import { fetchGamesBatch } from './games';
import type { AuthUser, Branch, GameSlim, InvoiceSettings } from './types';
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

  const [summaryOut, statsOut] = await Promise.allSettled([
    api.get<{
      success: boolean;
      summary: {
        totalInvoices: number;
        totalRevenue: number;
        collectedRevenue: number;
        todayInvoices: number;
        todayRevenue: number;
        todayCollectedRevenue: number;
      };
    }>('/invoices-summary', { params }),
    api.get<{
      totalOrders?: number;
      totalGames?: number;
      topGames?: Array<{ gameId: number | null; title?: string; count: number }>;
    }>('/stats', { params }),
  ]);

  const summary =
    summaryOut.status === 'fulfilled' && summaryOut.value.data?.summary
      ? summaryOut.value.data.summary
      : {
          totalInvoices: 0,
          totalRevenue: 0,
          collectedRevenue: 0,
          todayInvoices: 0,
          todayRevenue: 0,
          todayCollectedRevenue: 0,
        };

  const stats =
    statsOut.status === 'fulfilled' && statsOut.value.data
      ? statsOut.value.data
      : { totalOrders: 0, totalGames: 0, topGames: [] };

  const rawTop = Array.isArray(stats.topGames) ? stats.topGames : [];
  const topIds = rawTop
    .map((item) => Number(item.gameId))
    .filter((n) => Number.isFinite(n) && n > 0);

  let batchList: GameSlim[] = [];
  if (topIds.length > 0) {
    try {
      batchList = await fetchGamesBatch(topIds);
    } catch {
      batchList = [];
    }
  }

  const gameMap = new Map<number, { title: string; price: number }>();
  for (const g of batchList) {
    gameMap.set(Number(g.id), { title: g.title, price: Number(g.price) || 0 });
  }

  const topGames = rawTop.map((item) => {
    const found = item.gameId != null ? gameMap.get(Number(item.gameId)) : undefined;
    const title = found?.title ?? item.title ?? `لعبة #${item.gameId ?? ''}`;
    const unitPrice = found?.price ?? 0;
    return {
      title,
      count: Number(item.count) || 0,
      revenue: (Number(item.count) || 0) * unitPrice,
    };
  });

  return {
    today: {
      orders: Number(summary.todayInvoices) || 0,
      revenue: Number(summary.todayRevenue) || 0,
      collected: Number(summary.todayCollectedRevenue) || 0,
      discounts: 0,
    },
    month: {
      orders: Number(summary.totalInvoices) || Number(stats.totalOrders) || 0,
      revenue: Number(summary.totalRevenue) || 0,
      collected: Number(summary.collectedRevenue) || 0,
    },
    pendingOrders: Math.max(
      0,
      (Number(summary.totalRevenue) || 0) - (Number(summary.collectedRevenue) || 0) > 0 ? 1 : 0
    ),
    totalGames: Number(stats.totalGames) || 0,
    totalUsers: 0,
    last7Days: [],
    ordersByStatus: [],
    topGames,
  };
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
