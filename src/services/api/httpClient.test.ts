import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getApiBaseUrl,
  setCustomApiEndpoint,
  resetCustomApiEndpoint,
  checkEndpointHealth,
  STORAGE_KEY_API_ENDPOINT,
} from "./httpClient";

describe("httpClient: resolução dinâmica de baseURL e healthcheck", () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.__ENV__;
  });

  afterEach(() => {
    localStorage.clear();
    delete window.__ENV__;
  });

  it("deve retornar o fallback padrão http://localhost:8080 quando nada for configurado", () => {
    expect(getApiBaseUrl()).toBe("http://localhost:8080");
  });

  it("deve priorizar o endpoint gravado no localStorage", () => {
    localStorage.setItem(STORAGE_KEY_API_ENDPOINT, "https://api.shiori.local/");
    expect(getApiBaseUrl()).toBe("https://api.shiori.local");
  });

  it("deve respeitar a injeção via window.__ENV__ quando localStorage estiver vazio", () => {
    window.__ENV__ = { VITE_API_BASE_URL: "https://hub.comunitario.org:8443/" };
    expect(getApiBaseUrl()).toBe("https://hub.comunitario.org:8443");
  });

  it("setCustomApiEndpoint deve salvar e normalizar URL sem barra final", () => {
    setCustomApiEndpoint("https://minha-api.dev///");
    expect(localStorage.getItem(STORAGE_KEY_API_ENDPOINT)).toBe("https://minha-api.dev");
    expect(getApiBaseUrl()).toBe("https://minha-api.dev");
  });

  it("resetCustomApiEndpoint deve remover configuração e voltar ao padrão", () => {
    setCustomApiEndpoint("https://temp.api.com");
    expect(getApiBaseUrl()).toBe("https://temp.api.com");
    resetCustomApiEndpoint();
    expect(getApiBaseUrl()).toBe("http://localhost:8080");
  });

  it("checkEndpointHealth deve rejeitar URLs sem protocolo http/https", async () => {
    const result = await checkEndpointHealth("ftp://meu-servidor.org");
    expect(result.ok).toBe(false);
    expect(result.message).toContain("deve começar com http:// ou https://");
  });
});
