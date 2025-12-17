import { create } from 'zustand';
import { TOAST_DEFAULT_DURATION_MS } from '../constants/toast';

export type ToastType = 'success' | 'info' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// Re-export for backward compatibility, but use constant from toast.ts
export const DEFAULT_DURATION = TOAST_DEFAULT_DURATION_MS;

const generateId = () => Math.random().toString(36).slice(2, 10);

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  showToast: (toast) => {
    const id = generateId();
    const duration = toast.duration ?? DEFAULT_DURATION;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id, duration }],
    }));

    // Auto-remove after duration
    window.setTimeout(() => {
      const { removeToast } = get();
      removeToast(id);
    }, duration);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));


