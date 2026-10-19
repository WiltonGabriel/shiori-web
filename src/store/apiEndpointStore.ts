import { create } from "zustand";
import {
  getApiBaseUrl,
  isApiEndpointConfigured,
  isInitialSetupDismissed,
  markInitialSetupDone,
  setCustomApiEndpoint,
  resetCustomApiEndpoint,
  checkEndpointHealth,
  type HealthCheckResult,
} from "../services/api/httpClient";

interface ApiEndpointState {
  currentEndpoint: string;
  isConfigured: boolean;
  isModalOpen: boolean;
  isTesting: boolean;
  lastCheckResult: HealthCheckResult | null;

  openModal: () => void;
  closeModal: () => void;
  checkInitialSetup: () => void;
  saveEndpoint: (url: string) => void;
  resetToDefault: () => void;
  dismissModal: () => void;
  testConnection: (url: string) => Promise<HealthCheckResult>;
}

export const useApiEndpointStore = create<ApiEndpointState>((set) => ({
  currentEndpoint: getApiBaseUrl(),
  isConfigured: isApiEndpointConfigured(),
  isModalOpen: false,
  isTesting: false,
  lastCheckResult: null,

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false, lastCheckResult: null }),

  checkInitialSetup: () => {
    const configured = isApiEndpointConfigured();
    const dismissed = isInitialSetupDismissed();
    set({ isConfigured: configured });

    // Se o cliente não tem endpoint explicitamente configurado e nunca foi descartado, abre o setup inicial
    if (!configured && !dismissed) {
      set({ isModalOpen: true });
    }
  },

  saveEndpoint: (url: string) => {
    setCustomApiEndpoint(url);
    const updatedUrl = getApiBaseUrl();
    set({
      currentEndpoint: updatedUrl,
      isConfigured: true,
      isModalOpen: false,
      lastCheckResult: null,
    });
  },

  resetToDefault: () => {
    resetCustomApiEndpoint();
    set({
      currentEndpoint: getApiBaseUrl(),
      isConfigured: isApiEndpointConfigured(),
      lastCheckResult: null,
    });
  },

  dismissModal: () => {
    markInitialSetupDone();
    set({ isModalOpen: false, lastCheckResult: null });
  },

  testConnection: async (url: string) => {
    set({ isTesting: true, lastCheckResult: null });
    try {
      const result = await checkEndpointHealth(url);
      set({ isTesting: false, lastCheckResult: result });
      return result;
    } catch {
      const fallbackResult: HealthCheckResult = {
        ok: false,
        message: "Erro inesperado ao tentar validar o endpoint",
      };
      set({ isTesting: false, lastCheckResult: fallbackResult });
      return fallbackResult;
    }
  },
}));
