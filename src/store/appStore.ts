import { create } from 'zustand';
import type { Quarter, Application } from 'shared/types';
import { api } from '@/lib/api';

interface AppState {
  activeQuarter: Quarter | null;
  quarters: Array<Omit<Quarter, 'applications' | 'results' | 'categoryStalls'> & { applicationCount: number }>;
  loading: boolean;
  error: string | null;

  fetchActiveQuarter: () => Promise<void>;
  fetchQuarters: () => Promise<void>;
  setActiveQuarter: (q: Quarter) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeQuarter: null,
  quarters: [],
  loading: false,
  error: null,

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
}));
