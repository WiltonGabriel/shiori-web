import axios from "axios";

declare global {
  interface Window {
    __ENV__?: {
      VITE_API_BASE_URL?: string;
    };
  }
}

/**
 * Retorna a URL base da Shiori API.
 * Prioridade:
 * 1. Runtime window.__ENV__.VITE_API_BASE_URL (injetada no container Portainer/Docker)
 * 2. Vite Build-time import.meta.env.VITE_API_BASE_URL (.env local)
 * 3. Fallback: http://localhost:8080
 */
export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined" && window.__ENV__?.VITE_API_BASE_URL) {
    const runtimeUrl = window.__ENV__.VITE_API_BASE_URL.trim();
    if (runtimeUrl.length > 0) {
      return runtimeUrl;
    }
  }

  const buildTimeUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (buildTimeUrl && buildTimeUrl.length > 0) {
    return buildTimeUrl;
  }

  return "http://localhost:8080";
};

/**
 * Instância HTTP base do Axios para o Shiori Web.
 */
export const httpClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor de requisição para garantir baseURL dinâmica
httpClient.interceptors.request.use((config) => {
  const currentBaseUrl = getApiBaseUrl();
  if (config.baseURL !== currentBaseUrl && (!config.baseURL || config.baseURL === "http://localhost:8080")) {
    config.baseURL = currentBaseUrl;
  }
  return config;
});
