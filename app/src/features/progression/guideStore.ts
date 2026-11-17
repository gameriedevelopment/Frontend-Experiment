import { create } from "zustand";

interface GpGuideState {
  open: boolean;
  openGuide: () => void;
  closeGuide: () => void;
}

/** One GP guide for the whole app, opened from Home, the profile and the account menus. */
export const useGpGuide = create<GpGuideState>((set) => ({
  open: false,
  openGuide: () => set({ open: true }),
  closeGuide: () => set({ open: false }),
}));
