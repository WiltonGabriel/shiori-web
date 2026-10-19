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

function humanizeErrorMessage(
  status?: number,
  detail?: string,
  fallback = "Ocorreu um erro inesperado. Tente novamente mais tarde."
): string {
  if (detail) {
    if (
      detail.includes("ConstraintViolationException") ||
      detail.includes("could not execute statement") ||
      detail.includes("duplicate key")
    ) {
      return "Não foi possível concluir a ação: registro duplicado ou restrição de integridade.";
    }
    if (detail.includes("Network Error") || detail.includes("ERR_NETWORK")) {
      return "Não foi possível conectar ao servidor Shiori. Verifique sua conexão ou se a API está online.";
    }
    if (detail.includes("JWT expired") || detail.includes("Token expired") || detail.includes("expired token")) {
      return "Sua sessão expirou por segurança. Conecte-se novamente à sua conta.";
    }
    return detail;
  }

  switch (status) {
    case 400:
      return "Requisição inválida. Verifique os dados preenchidos no formulário.";
    case 401:
      return "Você precisa estar conectado para realizar esta operação.";
    case 403:
      return "Acesso restrito. Sua conta não possui permissão para esta ação de governança.";
    case 404:
      return "O registro solicitado não foi encontrado ou não está mais disponível.";
    case 409:
      return "Conflito de dados: este registro já existe na plataforma.";
    case 422:
      return "Os dados enviados não puderam ser validados pelo servidor.";
    case 429:
      return "Limite de requisições excedido. Por favor, aguarde alguns instantes.";
    case 500:
      return "O servidor Shiori encontrou uma instabilidade temporária. Tente novamente em instantes.";
    case 502:
    case 503:
    case 504:
      return "O servidor ou provedor externo está temporariamente indisponível.";
    default:
      return fallback;
  }
}

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
      const detailMessage = humanizeErrorMessage(
        err.status,
        err.problem.detail || err.message,
        "Falha na comunicação com o servidor Shiori."
      );
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
      const status = (err as any)?.response?.status;
      const title = axiosResponse.title || fallbackTitle;
      const rawDetail = axiosResponse.detail || axiosResponse.message || (err as any)?.message;
      const detail = humanizeErrorMessage(status, rawDetail);
      useToastStore.getState().addToast({
        type: "error",
        title,
        detail,
        status,
        validationErrors: axiosResponse.errosValidacao,
      });
      return;
    }

    // 3. Objeto genérico com campo detail
    if (err && typeof err === "object" && "detail" in err && typeof (err as any).detail === "string") {
      useToastStore.getState().addToast({
        type: "error",
        title: (err as any).title || fallbackTitle,
        detail: humanizeErrorMessage(undefined, (err as any).detail),
      });
      return;
    }

    // 4. Instância de Error padrão
    if (err instanceof Error) {
      useToastStore.getState().addToast({
        type: "error",
        title: fallbackTitle,
        detail: humanizeErrorMessage(undefined, err.message),
      });
      return;
    }

    // 5. String simples
    if (typeof err === "string") {
      useToastStore.getState().addToast({
        type: "error",
        title: fallbackTitle,
        detail: humanizeErrorMessage(undefined, err),
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

