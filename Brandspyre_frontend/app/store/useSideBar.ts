import { create } from "zustand";

interface SideBarState {
  isOpen: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  close: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  openMobile: () => void;
}

const getFromLocal = () => {
  if (typeof window !== "undefined") {
    return JSON.parse(localStorage.getItem("sidebar") || "false");
  }
  return false;
};

export const useSideBar = create<SideBarState>((set) => ({
  isOpen: getFromLocal(),
  isMobileOpen: false,
  toggle: () => {
    set((state) => {
      const newState = !state.isOpen;
      localStorage.setItem("sidebar", JSON.stringify(newState));
      return { isOpen: newState };
    });
  },
  close: () => {
    set(() => {
      localStorage.setItem("sidebar", "false");
      return { isOpen: false };
    });
  },
  toggleMobile: () => {
    set((state) => ({ isMobileOpen: !state.isMobileOpen }));
  },
  closeMobile: () => {
    set({ isMobileOpen: false });
  },
  openMobile: () => {
    set({ isMobileOpen: true });
  },
}));