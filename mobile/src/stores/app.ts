import { create } from 'zustand';
import { jsonGet, jsonSet } from '../lib/storage';

const BRANCH_KEY = 'selectedBranchId';
const CATEGORY_KEY = 'activeCategory';

/** حالة المتجر العامة: الفرع المختار، الفئة النشطة، ونطاق الفرع في لوحة الإدارة */
interface AppState {
  selectedBranchId: number | null;
  activeCategoryId: number | null;
  /** نطاق الفرع للأدمن الرئيسي في لوحة الإدارة ('all' أو معرف فرع) */
  adminScopeBranchId: number | 'all';
  ready: boolean;
  hydrate: () => Promise<void>;
  selectBranch: (id: number) => void;
  clearBranch: () => void;
  setActiveCategory: (id: number | null) => void;
  setAdminScopeBranch: (branchId: number | 'all') => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedBranchId: null,
  activeCategoryId: null,
  adminScopeBranchId: 'all',
  ready: false,

  hydrate: async () => {
    const [branchId, categoryId] = await Promise.all([
      jsonGet<number | null>(BRANCH_KEY, null),
      jsonGet<number | null>(CATEGORY_KEY, null),
    ]);
    set({ selectedBranchId: branchId, activeCategoryId: categoryId, ready: true });
  },

  selectBranch: (id) => {
    void jsonSet(BRANCH_KEY, id);
    set({ selectedBranchId: id });
  },

  clearBranch: () => {
    void jsonSet(BRANCH_KEY, null);
    set({ selectedBranchId: null });
  },

  setActiveCategory: (id) => {
    void jsonSet(CATEGORY_KEY, id);
    set({ activeCategoryId: id });
  },

  setAdminScopeBranch: (branchId) => set({ adminScopeBranchId: branchId }),
}));
