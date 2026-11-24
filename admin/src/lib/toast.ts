import { create } from "zustand";

export type ToastTone = "success" | "info" | "error";

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;
const lifetime = 4_500;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId++;
    // Keep the stack short; the newest three are enough to read.
    set({ toasts: [...get().toasts.slice(-2), { ...toast, id }] });
    window.setTimeout(() => get().dismiss(id), lifetime);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}));

export const toast = {
  success: (title: string, description?: string) => useToastStore.getState().push({ tone: "success", title, description }),
  info: (title: string, description?: string) => useToastStore.getState().push({ tone: "info", title, description }),
  error: (title: string, description?: string) => useToastStore.getState().push({ tone: "error", title, description }),
};
