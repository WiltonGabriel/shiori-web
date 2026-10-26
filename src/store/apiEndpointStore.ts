import { create } from "zustand";
import {
  getApiBaseUrl,
  isApiEndpointConfigured,
  markInitialSetupDone,
  setCustomApiEndpoint,
  resetCustomApiEndpoint,
  checkEndpointHealth,
  getOperationMode,
  setOperationModeStorage,
  type OperationMode,
  type HealthCheckResult,
} from "../services/api/httpClient";
import { useAuthStore } from "./authStore";

interface ApiEndpointState {
  currentEndpoint: string;
  operationMode: OperationMode;
  isConfigured: boolean;
  isModalOpen: boolean;
  isTesting: boolean;
  lastCheckResult: HealthCheckResult | null;

  openModal: () => void;
  closeModal: () => void;
  checkInitialSetup: () => void;
  setLocalMode: () => void;
  saveEndpoint: (url: string) => void;
  resetToDefault: () => void;
  dismissModal: () => void;
  testConnection: (url: string) => Promise<HealthCheckResult>;
}

export const useApiEndpointStore = create<ApiEndpointState>((set) => ({
  currentEndpoint: getApiBaseUrl(),
  operationMode: getOperationMode(),
  isConfigured: isApiEndpointConfigured(),
  isModalOpen: false,
  isTesting: false,
  lastCheckResult: null,

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false, lastCheckResult: null }),

  checkInitialSetup: () => {
    const configured = isApiEndpointConfigured();
    set({
      isConfigured: configured,
      operationMode: getOperationMode(),
    });

    // A aplicação não insiste na conexão na home; conexão é oferecida contextualmente ou no assistente
  },

  setLocalMode: () => {
    setOperationModeStorage("local");
    markInitialSetupDone();
    useAuthStore.getState().activateLocalSession();
    set({
      operationMode: "local",
      isModalOpen: false,
      lastCheckResult: null,
    });
  },

  saveEndpoint: (url: string) => {
    setOperationModeStorage("connected");
    setCustomApiEndpoint(url);
    const updatedUrl = getApiBaseUrl();
    set({
      currentEndpoint: updatedUrl,
      operationMode: "connected",
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
