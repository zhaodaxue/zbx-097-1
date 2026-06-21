import { create } from 'zustand';
import type { Quarter, Application } from 'shared/types';
import { api } from '@/lib/api';

interface AppState {
  activeQuarter: Quarter | null;
  quarters: Array<Omit<Quarter, 'applications' | 'results' | 'categoryStalls'> & { applicationCount: number }>;
  loading: boolean;
  error: string | null;

  isLoggedIn: boolean;
  adminUsername: string | null;

  fetchActiveQuarter: () => Promise<void>;
  fetchQuarters: () => Promise<void>;
  setActiveQuarter: (q: Quarter) => void;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeQuarter: null,
  quarters: [],
  loading: false,
  error: null,

  isLoggedIn: !!api.getToken(),
  adminUsername: null,

  fetchActiveQuarter: async () => {
    set({ loading: true, error: null });
    try {
      const q = await api.getActiveQuarter();
      set({ activeQuarter: q, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchQuarters: async () => {
    try {
      const list = await api.getQuarters();
      set({ quarters: list });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  setActiveQuarter: (q: Quarter) => set({ activeQuarter: q }),

  login: async (username: string, password: string) => {
    const data = await api.login(username, password);
    api.setToken(data.token);
    set({ isLoggedIn: true, adminUsername: data.username });
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    api.clearToken();
    set({ isLoggedIn: false, adminUsername: null });
  },

  checkAuth: async (): Promise<boolean> => {
    if (!api.getToken()) {
      set({ isLoggedIn: false });
      return false;
    }
    try {
      const data = await api.getMe();
      set({ isLoggedIn: true, adminUsername: data.username });
      return true;
    } catch {
      api.clearToken();
      set({ isLoggedIn: false });
      return false;
    }
  },
}));
