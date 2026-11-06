import { create } from 'zustand';
import type { PackageGame } from '@/api/types';

export type CartItem = {
  /** مفاتيح ثابتة: g:gameId:platform أو svc:id أو pkg:id */
  key: string;
  type: 'game' | 'service' | 'package';
  /** معرّف العنصر الأصلي */
  refId: number;
  title: string;
  /** سعر الوحدة بالدينار */
  price: number;
  sizeGb?: number | null;
  quantity: number;
  /** منصة نسخة اللعبة إن كانت لعبة */
  platform?: 'PS4' | 'PS5';
  /** ألعاب الباقة إن كان العنصر باقة */
  packageGames?: PackageGame[];
};

export interface EditingInvoiceDraft {
  id: number;
  invoice_number: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  notes?: string | null;
  discount?: number | null;
  paid_amount?: number | null;
  status?: string | null;
}

interface CartState {
  items: CartItem[];
  editingInvoice: EditingInvoiceDraft | null;
  addGame: (game: {
    id: number;
    title: string;
    price: number;
    sizeGb?: number | null;
    platform: 'PS4' | 'PS5';
  }) => void;
  addService: (service: { id: number; title: string; price: number }) => void;
  addPackage: (pkg: {
    id: number;
    name: string;
    price: number;
    sizeGb?: number | null;
    packageGames?: PackageGame[];
  }) => void;
  removeItem: (key: string) => void;
  decrement: (key: string) => void;
  clear: () => void;
  startEditingInvoice: (draft: EditingInvoiceDraft, items: CartItem[]) => void;
  cancelEditingInvoice: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  editingInvoice: null,

  addGame: (game) =>
    set((state) => {
      const key = `g:${game.id}:${game.platform}`;
      const existing = state.items.find((i) => i.key === key);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      const item: CartItem = {
        key,
        type: 'game',
        refId: game.id,
        title: game.title,
        price: game.price,
        sizeGb: game.sizeGb ?? null,
        quantity: 1,
        platform: game.platform,
      };
      return { items: [...state.items, item] };
    }),

  addService: (service) =>
    set((state) => {
      const key = `svc:${service.id}`;
      const existing = state.items.find((i) => i.key === key);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      const item: CartItem = {
        key,
        type: 'service',
        refId: service.id,
        title: service.title,
        price: service.price,
        quantity: 1,
      };
      return { items: [...state.items, item] };
    }),

  addPackage: (pkg) =>
    set((state) => {
      const key = `pkg:${pkg.id}`;
      const existing = state.items.find((i) => i.key === key);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      const item: CartItem = {
        key,
        type: 'package',
        refId: pkg.id,
        title: pkg.name,
        price: pkg.price,
        sizeGb: pkg.sizeGb ?? null,
        packageGames: pkg.packageGames,
        quantity: 1,
      };
      return { items: [...state.items, item] };
    }),

  removeItem: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

  decrement: (key) =>
    set((state) => ({
      items: state.items
        .map((i) => (i.key === key ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    })),

  clear: () => set({ items: [], editingInvoice: null }),

  startEditingInvoice: (draft, items) => set({ editingInvoice: draft, items }),

  cancelEditingInvoice: () => set({ editingInvoice: null, items: [] }),
}));

/* --- مُنتقيات (Selectors) --- */

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function cartTotalSizeGb(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + (i.sizeGb ?? 0) * i.quantity, 0);
}
