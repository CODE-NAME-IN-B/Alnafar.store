import axios, { AxiosError, AxiosResponse } from 'axios';
import { API_BASE } from '../lib/env';

/**
 * عميل الـ API الوحيد.
 * - التوكن يُرسل كـ Authorization: Bearer (لا يوجد هيدر فرع — الفرع ?branchId=).
 * - الطلبات بلا Origin مسموحة على الخادم (React Native).
 * - عند 503 (إقلاع بارد على Vercel) نعيد المحاولة مرة واحدة.
 */

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20_000,
});

/* --- خطاطيف تسجّلها الشاشات/المخازن --- */

let tokenGetter: (() => string | null) | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setTokenGetter(fn: () => string | null): void {
  tokenGetter = fn;
}

export function setUnauthorizedHandler(fn: () => void): void {
  unauthorizedHandler = fn;
}

/* --- المعترضات --- */

api.interceptors.request.use((config) => {
  const token = tokenGetter?.() ?? null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    __retried?: boolean;
  }
}

function shouldRetry(error: AxiosError): boolean {
  const status = error.response?.status;
  const config = error.config as
    | (import('axios').InternalAxiosRequestConfig & { __retried?: boolean })
    | undefined;
  return status === 503 && !!config && !config.__retried;
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const config = error.config as
      | (import('axios').InternalAxiosRequestConfig & { __retried?: boolean })
      | undefined;

    if (shouldRetry(error) && config) {
      config.__retried = true;
      await new Promise((resolve) => setTimeout(resolve, 900));
      return api.request(config);
    }

    if (error.response?.status === 401) {
      unauthorizedHandler?.();
    }

    return Promise.reject(error);
  }
);

/* --- استخراج رسالة عربية من الخطأ --- */

const STATUS_MESSAGES: Record<number, string> = {
  400: 'بيانات غير صحيحة',
  401: 'الجلسة منتهية، سجّل الدخول من جديد',
  403: 'لا تملك صلاحية لهذا الإجراء',
  404: 'العنصر غير موجود',
  429: 'عدد كبير من الطلبات، انتظر قليلاً ثم حاول',
  500: 'خطأ في الخادم، حاول لاحقاً',
  503: 'الخادم يستعد، حاول بعد لحظات',
};

export function apiErrorText(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (!error.response) return 'تعذر الاتصال بالخدمة، تحقق من الإنترنت';
    return STATUS_MESSAGES[error.response.status] ?? 'حدث خطأ غير متوقع';
  }
  return 'حدث خطأ غير متوقع';
}
