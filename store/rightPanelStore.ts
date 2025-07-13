// stores/rightPanelStore.ts
import { create } from "zustand";

type RightPanelState = {
  showRight: boolean;
  open: () => void;
  close: () => void;
};

export const useRightPanelStore = create<RightPanelState>((set) => ({
  showRight: true,
  open: () => set({ showRight: true }),
  close: () => set({ showRight: false }),
}));
