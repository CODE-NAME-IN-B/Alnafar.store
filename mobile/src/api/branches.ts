import { api } from './client';
import type { Branch } from './types';

/** الفروع الظاهرة (عام → النشطة فقط؛ المستخدم مصرح → فرعه) */
export async function fetchBranches(): Promise<Branch[]> {
  const { data } = await api.get<{ success: boolean; branches: Branch[] }>('/branches');
  return Array.isArray(data?.branches) ? data.branches : [];
}
