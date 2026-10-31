import { api } from './client';
import type { Game, GameSlim } from './types';

export interface GamesQuery {
  q?: string;
  category?: number | null;
  minPrice?: number;
  maxPrice?: number;
  /** الخادم يعيد آخر 500 افتراضياً — نطلب المكتبة الحرجة دفعة واحدة */
  limit?: number;
}

export async function fetchGames(query: GamesQuery = {}): Promise<Game[]> {
  const params: Record<string, string | number> = {};
  if (query.q) params.q = query.q;
  if (query.category) params.category = query.category;
  if (query.minPrice != null) params.minPrice = query.minPrice;
  if (query.maxPrice != null) params.maxPrice = query.maxPrice;
  params.limit = query.limit ?? 1000;
  const { data } = await api.get<Game[]>('/games', { params });
  return Array.isArray(data) ? data : [];
}

export async function fetchGame(id: number): Promise<Game> {
  const { data } = await api.get<Game>(`/games/${id}`);
  return data;
}

export async function fetchGamesBatch(ids: number[]): Promise<GameSlim[]> {
  if (!ids.length) return [];
  const { data } = await api.get<GameSlim[]>('/games/batch', { params: { ids: ids.join(',') } });
  return Array.isArray(data) ? data : [];
}
