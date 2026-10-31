import { api } from './client';
import type { HealthInfo, InvoiceSettings, Service } from './types';

/** فحص حالة الخادم وقاعدة البيانات */
export async function fetchHealth(): Promise<HealthInfo> {
  const { data } = await api.get<HealthInfo>('/health');
  return data;
}

/** إعدادات الفاتورة — نقطة دخول عامة (تحمل اسم المتجر على الفواتير) */
export async function fetchInvoiceSettings(): Promise<InvoiceSettings> {
  const { data } = await api.get<{ success: true; settings: InvoiceSettings }>(
    '/invoice-settings'
  );
  return data.settings ?? {};
}

/** الخدمات الظاهرة (مهام، حسابات...) */
export async function fetchServices(): Promise<Service[]> {
  const { data } = await api.get<Service[]>('/services', { params: { active: true } });
  return Array.isArray(data) ? data : [];
}

/** إعدادات الاتصال العامة (واتساب/تيليجرام) — الرد يقتصر على حقول أقل */
export async function fetchSettings(): Promise<{
  whatsapp_number?: string;
  telegram_username?: string;
  telegram_enabled?: boolean;
  communication_method?: string;
}> {
  const { data } = await api.get('/settings');
  return (data ?? {}) as {
    whatsapp_number?: string;
    telegram_username?: string;
    telegram_enabled?: boolean;
    communication_method?: string;
  };
}
