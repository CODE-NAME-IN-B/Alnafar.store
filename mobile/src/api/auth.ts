import { api } from './client';
import type { AuthUser } from './types';

/** المصادقة: تسجيل الدخول وبيانات المستخدم الحالي */
export async function login(username: string, password: string): Promise<string> {
  const { data } = await api.post<{ token: string }>('/auth/login', { username, password });
  return data.token;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<{ user: AuthUser }>('/auth/me');
  return data.user;
}

export async function healthCheck() {
  const { data } = await api.get<import('./types').HealthInfo>('/health');
  return data;
}
