import { create } from 'zustand';

interface ComparisonState {
  productIds: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  canAdd: boolean;
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  productIds: [],
  canAdd: true,

  add: (id) => {
    const { productIds } = get();
    if (productIds.includes(id) || productIds.length >= 4) return;
    const next = [...productIds, id];
    set({ productIds: next, canAdd: next.length < 4 });
  },

  remove: (id) => {
    const next = get().productIds.filter((p) => p !== id);
    set({ productIds: next, canAdd: next.length < 4 });
  },

  clear: () => set({ productIds: [], canAdd: true }),
}));
