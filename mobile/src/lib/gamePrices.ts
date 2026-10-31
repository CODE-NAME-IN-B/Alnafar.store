import type { Category, Game } from '@/api/types';

/**
 * أسعار النسختين كما في الواجهة:
 * - الفور: دائماً `price`
 * - الفايف: `price_ps5` إن وُجد، وإلا ضعف `price` (ألعاب الفايف مخزنة في `price`
 *   والفايف المعدل له قيمة سعر صريحة في price_ps5)
 */
export function ps5PriceOf(game: Pick<Game, 'price' | 'price_ps5'>): number {
  if (game.price_ps5 != null && Number(game.price_ps5) > 0) return Number(game.price_ps5);
  return Number(game.price) * 2;
}

/**
 * السعر الأساسي المعروض للزبون:
 * ألعاب PS5 والفئات غير PS4 تخزّن سعرها في `price`، والبيانات القديمة قد تحفظه في `price_ps5`.
 */
export function mainPriceOf(game: Pick<Game, 'price' | 'price_ps5'> | null | undefined): number {
  if (!game) return 0;
  const p = Number(game.price) || 0;
  const p5 = game.price_ps5 != null && Number(game.price_ps5) > 0 ? Number(game.price_ps5) : null;
  if (p <= 0 && p5 != null) return p5;
  return p;
}

/** هل اللعبة تتبع فئة PS4 (التي تعرض خيارَي الفور والفايف عند الإضافة)؟ */
export function isPs4Game(game: Pick<Game, 'category_id'>, categories: Category[]): boolean {
  const ps4Cat = categories.find((c) => String(c.name ?? '').toLowerCase() === 'ps4');
  const ps4Id = ps4Cat ? Number(ps4Cat.id) : 1;
  return Number(game.category_id ?? 1) === ps4Id;
}
