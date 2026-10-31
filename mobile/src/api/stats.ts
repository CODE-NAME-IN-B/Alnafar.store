import { api } from './client';
import { fetchGamesBatch } from './games';
import type { GameSlim } from './types';

export interface TopGameEntry {
  gameId?: number | string | null;
  title?: string | null;
  count: number;
}

export interface ResolvedTopGame {
  id: number;
  title: string;
  image: string;
  price: number;
  price_ps5: number | null;
  category_id: number | null;
  size_gb: number | null;
  count: number;
}

/** جلب قائمة الألعاب الأكثر طلباً للواجهة العامة (`GET /api/stats?public=1` + `/api/games/batch`) */
export async function fetchPublicTopGames(): Promise<ResolvedTopGame[]> {
  const { data } = await api.get<{ topGames?: TopGameEntry[] }>('/stats', {
    params: { public: 1 },
  });
  const topGames = Array.isArray(data?.topGames) ? data.topGames : [];
  if (!topGames.length) return [];

  const numericIds = topGames
    .map((t) => Number(t.gameId))
    .filter((n) => Number.isFinite(n) && n > 0);

  let batchRows: GameSlim[] = [];
  if (numericIds.length > 0) {
    try {
      batchRows = await fetchGamesBatch(numericIds);
    } catch {
      batchRows = [];
    }
  }

  const byId = new Map<number, GameSlim>(batchRows.map((g) => [Number(g.id), g]));
  const byTitle = new Map<string, GameSlim>(
    batchRows.map((g) => [String(g.title ?? '').toLowerCase(), g])
  );

  const resolved: ResolvedTopGame[] = [];
  for (const entry of topGames) {
    const idNum = Number(entry.gameId);
    const titleKey = String(entry.title ?? '').toLowerCase();
    const match =
      (Number.isFinite(idNum) && idNum > 0 ? byId.get(idNum) : undefined) ??
      (titleKey ? byTitle.get(titleKey) : undefined);

    if (!match && !entry.title) continue;
    resolved.push({
      id: match?.id ?? (Number.isFinite(idNum) && idNum > 0 ? idNum : resolved.length + 1),
      title: match?.title || entry.title || `لعبة #${entry.gameId}`,
      image: match?.image || '',
      price: typeof match?.price === 'number' ? match.price : Number(match?.price ?? 0),
      price_ps5: match?.price_ps5 ?? null,
      category_id: match?.category_id ?? null,
      size_gb: match?.size_gb ?? null,
      count: Number(entry.count) || 0,
    });
  }
  return resolved;
}
