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
    // 1. Instância formal de ShioriApiError (RFC 9457 ProblemDetail)
    if (err instanceof ShioriApiError) {
      const detailMessage = err.problem.detail || err.message;
      useToastStore.getState().addToast({
        type: "error",
        title: err.problem.title || fallbackTitle,
        detail: detailMessage,
        status: err.status,
        validationErrors: err.problem.errosValidacao,
      });
      return;
    }

    // 2. Erro vindo do Axios ou HTTP contendo ProblemDetail diretamente no response.data
    const axiosResponse = (err as any)?.response?.data;
    if (axiosResponse && typeof axiosResponse === "object") {
      const title = axiosResponse.title || fallbackTitle;
      const detail = axiosResponse.detail || axiosResponse.message || (err as any)?.message;
      if (detail || title) {
        useToastStore.getState().addToast({
          type: "error",
          title,
          detail: detail || "O provedor externo está temporariamente indisponível.",
          status: (err as any)?.response?.status,
        });
        return;
      }
    }

    // 3. Objeto genérico com campo detail
    if (err && typeof err === "object" && "detail" in err && typeof (err as any).detail === "string") {
      useToastStore.getState().addToast({
        type: "error",
        title: (err as any).title || fallbackTitle,
        detail: (err as any).detail,
      });
      return;
    }

    // 4. Instância de Error padrão
    if (err instanceof Error) {
      useToastStore.getState().addToast({
        type: "error",
        title: fallbackTitle,
        detail: err.message,
      });
      return;
    }

    // 5. String simples
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
