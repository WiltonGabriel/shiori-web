import axios from "axios";

declare global {
  interface Window {
    __ENV__?: {
      VITE_API_BASE_URL?: string;
    };
  }
}

export const STORAGE_KEY_API_ENDPOINT = "shiori_api_endpoint";
export const STORAGE_KEY_ENDPOINT_SETUP_DONE = "shiori_endpoint_setup_completed";

/**
 * Retorna se o usuário ou o ambiente especificou explicitamente um endpoint para a API.
 */
export const isApiEndpointConfigured = (): boolean => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY_API_ENDPOINT)?.trim();
    if (stored) return true;
    if (window.__ENV__?.VITE_API_BASE_URL?.trim()) return true;
  }
  const buildTimeUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  return Boolean(buildTimeUrl);
};

export const isInitialSetupDismissed = (): boolean => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(STORAGE_KEY_ENDPOINT_SETUP_DONE) === "true";
  }
  return false;
};

export const markInitialSetupDone = (): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_ENDPOINT_SETUP_DONE, "true");
  }
};

/**
 * Retorna a URL base ativa da Shiori API.
 * Prioridade:
 * 1. Runtime do Usuário (localStorage: "shiori_api_endpoint")
 * 2. Runtime do Container window.__ENV__.VITE_API_BASE_URL (injetada no Nginx/Portainer)
 * 3. Vite Build-time import.meta.env.VITE_API_BASE_URL (.env local)
 * 4. Fallback padrão: http://localhost:8080
 */
export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    const userEndpoint = localStorage.getItem(STORAGE_KEY_API_ENDPOINT)?.trim();
    if (userEndpoint) {
      return userEndpoint.replace(/\/+$/, "");
    }

    if (window.__ENV__?.VITE_API_BASE_URL) {
      const runtimeUrl = window.__ENV__.VITE_API_BASE_URL.trim();
      if (runtimeUrl.length > 0) {
        return runtimeUrl.replace(/\/+$/, "");
      }
    }
  }

  const buildTimeUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (buildTimeUrl && buildTimeUrl.length > 0) {
    return buildTimeUrl.replace(/\/+$/, "");
  }

  return "http://localhost:8080";
};

export const setCustomApiEndpoint = (url: string): void => {
  if (typeof window !== "undefined") {
    const trimmed = url.trim().replace(/\/+$/, "");
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY_API_ENDPOINT, trimmed);
      markInitialSetupDone();
    }
  }
  httpClient.defaults.baseURL = getApiBaseUrl();
};

export const resetCustomApiEndpoint = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_API_ENDPOINT);
  }
  httpClient.defaults.baseURL = getApiBaseUrl();
};

export interface HealthCheckResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export const checkEndpointHealth = async (targetUrl: string): Promise<HealthCheckResult> => {
  const normalized = targetUrl.trim().replace(/\/+$/, "");
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    return { ok: false, message: "A URL deve começar com http:// ou https://" };
  }

  const start = performance.now();
  try {
    const res = await axios.get(`${normalized}/actuator/health`, {
      timeout: 5000,
      headers: { Accept: "application/json" },
    });
    const latencyMs = Math.round(performance.now() - start);
    if (res.status === 200) {
      return { ok: true, message: `Conexão estabelecida com sucesso! (${latencyMs}ms)`, latencyMs };
    }
    return { ok: true, message: `Hub respondeu com status ${res.status} (${latencyMs}ms)`, latencyMs };
  } catch (err: unknown) {
    try {
      await axios.get(`${normalized}/api/obras/autocomplete?termo=ping`, {
        timeout: 4000,
      });
      const latencyMs = Math.round(performance.now() - start);
      return { ok: true, message: `Hub respondeu com sucesso! (${latencyMs}ms)`, latencyMs };
    } catch {
      const errorMsg = axios.isAxiosError(err) && err.message ? err.message : "Servidor inacessível";
      return { ok: false, message: `Falha na conexão: ${errorMsg}` };
    }
  }
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

// Interceptor de requisição: garante que toda chamada subsequente use dinamicamente a baseURL atual
httpClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});
