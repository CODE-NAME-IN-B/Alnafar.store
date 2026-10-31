import { useCartStore } from '@/stores/cart';
import type { Game, Service, StorePackage } from '@/api/types';

/**
 * إدخال عناصر السلة من الشاشات — يحصر منطق التسعير في مكان واحد.
 *   - لعبة: بسعر النسخة المختارة مع حجمها
 *   - باقة: بسعر الباقة نفسها
 *   - خدمة: بسعر الخدمة
 */
export function addGameToCart(
  game: Pick<Game, 'id' | 'title' | 'size_gb'>,
  platform: 'PS4' | 'PS5',
  price: number
): void {
  useCartStore.getState().addGame({
    id: Number(game.id),
    title: game.title,
    price,
    sizeGb: game.size_gb != null ? Number(game.size_gb) : null,
    platform,
  });
}

export function addPackageToCart(pkg: StorePackage): void {
  const pkgSize = Array.isArray(pkg.packageGames)
    ? pkg.packageGames.reduce(
        (acc, g) => acc + (Number((g as { size_gb?: number }).size_gb) || 0),
        0
      )
    : 0;
  useCartStore.getState().addPackage({
    id: Number(pkg.id),
    name: pkg.name,
    price: Number(pkg.price),
    sizeGb: pkgSize > 0 ? pkgSize : null,
    packageGames: pkg.packageGames,
  });
}

export function addServiceToCart(service: Service): void {
  useCartStore.getState().addService({
    id: Number(service.id),
    title: service.title,
    price: Number(service.price),
  });
}
