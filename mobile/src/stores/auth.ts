import { create } from 'zustand';
import * as authApi from '../api/auth';
import type { AuthUser } from '../api/types';
import { showToast } from '../lib/toast';
import { jsonGet, jsonSet, secureDelete, secureGet, secureSet } from '../lib/storage';

const TOKEN_KEY = 'alsharida_token';
const USER_KEY = 'auth_user';
const GUEST_KEY = 'isGuest';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  /** وضع الضيف: تصفح كامل بلا حساب */
  guest: boolean;
  /** اكتملت قراءة التخزين عند الإقلاع */
  ready: boolean;
  hydrate: () => Promise<void>;
  loginWithPassword: (username: string, password: string) => Promise<boolean>;
  enterGuest: () => void;
  logout: () => Promise<void>;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  guest: false,
  ready: false,

  hydrate: async () => {
    const [token, user, guest] = await Promise.all([
      secureGet(TOKEN_KEY),
      jsonGet<AuthUser | null>(USER_KEY, null),
      jsonGet<boolean>(GUEST_KEY, false),
    ]);
    set({ token: token ?? null, user, guest, ready: true });
  },

  loginWithPassword: async (username, password) => {
    try {
      const token = await authApi.login(username, password);
      await secureSet(TOKEN_KEY, token);
      set({ token });
      const me = await authApi.fetchMe();
      await jsonSet(USER_KEY, me);
      await jsonSet(GUEST_KEY, false);
      set({ user: me, guest: false });
      return true;
    } catch (error) {
      showToast(
        error instanceof Error && error.message
          ? 'فشل تسجيل الدخول، تحقق من الاسم وكلمة المرور'
          : 'تعذر تسجيل الدخول',
        'error'
      );
      return false;
    }
  },

  enterGuest: () => {
    set({ guest: true });
    void jsonSet(GUEST_KEY, true);
  },

  logout: async () => {
    const user = get().user;
    await get().clearAuth();
    await jsonSet(GUEST_KEY, false);
    set({ guest: false });
    if (user) showToast('تم تسجيل الخروج');
  },

  /** مسح الحساب فقط (بدا للـ 401) */
  clearAuth: async () => {
    await secureDelete(TOKEN_KEY);
    set({ token: null, user: null });
  },
}));

/** هل المستخدم الحالي مدير فرعي رئيسي (admin + branch_id = 1)? */
export function isSuperAdmin(user: AuthUser | null): boolean {
  return !!user && user.role === 'admin' && Number(user.branch_id) === 1;
}
