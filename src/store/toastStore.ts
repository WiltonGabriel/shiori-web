import { create } from "zustand";
import { ShioriApiError } from "../types/error.types";

export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  detail?: string;
  status?: number;
  validationErrors?: Record<string, string>;
  durationMs: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id" | "durationMs"> & { durationMs?: number }) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const durationMs = toast.durationMs ?? (toast.type === "error" ? 6000 : 4000);
    const newToast: ToastItem = { ...toast, id, durationMs };

    set((state) => ({
      toasts: [...state.toasts.slice(-4), newToast], // mantém no máximo 5 toasts ativos
    }));

    if (durationMs > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, durationMs);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));

/**
 * Utilitário global para disparo de avisos na interface integrado à RFC 9457 do Spring Boot
 */
export const toast = {
  success: (message: string, title = "Sucesso") => {
    useToastStore.getState().addToast({
      type: "success",
      title,
      detail: message,
    });
  },

  error: (err: unknown, fallbackTitle = "Erro na Operação") => {
    if (err instanceof ShioriApiError) {
      useToastStore.getState().addToast({
        type: "error",
        title: err.problem.title || fallbackTitle,
        detail: err.problem.detail || err.message,
        status: err.status,
        validationErrors: err.problem.errosValidacao,
      });
      return;
    }

    if (err instanceof Error) {
      useToastStore.getState().addToast({
        type: "error",
        title: fallbackTitle,
        detail: err.message,
      });
      return;
    }

    if (typeof err === "string") {
      useToastStore.getState().addToast({
        type: "error",
        title: fallbackTitle,
        detail: err,
      });
      return;
    }

    useToastStore.getState().addToast({
      type: "error",
      title: fallbackTitle,
      detail: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
    });
  },

  warning: (message: string, title = "Atenção") => {
    useToastStore.getState().addToast({
      type: "warning",
      title,
      detail: message,
    });
  },

  info: (message: string, title = "Informação") => {
    useToastStore.getState().addToast({
      type: "info",
      title,
      detail: message,
    });
  },
};
