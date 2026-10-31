import { api } from './client';
import type { Category } from './types';

/** الفئات الظاهرة للزبائن فقط (`?public=1` يفرض الإظهار على الخادم) */
export async function fetchCategories(onlyVisible = true): Promise<Category[]> {
  const { data } = await api.get<Category[]>('/categories',
    onlyVisible ? { params: { public: 1 } } : {});
  return Array.isArray(data) ? data : [];
}

/** قائمة الأنواع (رعب، أكشن، تقسيم الشاشة...) */
export async function fetchGenres(): Promise<string[]> {
  const { data } = await api.get<string[]>('/genres');
  return Array.isArray(data) ? data : [];
}

/** قائمة السلاسل (Resident Evil، FIFA...) */
export async function fetchSeries(): Promise<string[]> {
  const { data } = await api.get<string[]>('/series');
  return Array.isArray(data) ? data : [];
}
