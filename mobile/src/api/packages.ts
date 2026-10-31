import { api } from './client';
import type { StorePackage } from './types';

const unwrap = (data: unknown): StorePackage[] => {
  if (data && typeof data === 'object' && 'packages' in data) {
    const list = (data as { packages: StorePackage[] }).packages;
    return Array.isArray(list) ? list : [];
  }
  return [];
};

/** الباقات النشطة لفئة معينة (لشاشة الباقات العامة) */
export async function fetchActivePackages(categoryId: number): Promise<StorePackage[]> {
  const { data } = await api.get(`/packages/active/${categoryId}`);
  return unwrap(data);
}

/** كل الباقات — للأدوار المصرح لها (مرحلة الإدارة) */
export async function fetchPackages(): Promise<StorePackage[]> {
  const { data } = await api.get('/packages');
  return unwrap(data);
}
