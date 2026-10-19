import { api } from "./api";
import type {
  PareamentoResponse,
  SubmissaoObraAnonimaRequest,
} from "../types/catalog.types";
import type { ObraResponse } from "../types/work.types";

const STORAGE_KEY_UUID = "shiori_instance_uuid";
const STORAGE_KEY_HUB_URL = "shiori_hub_primary_url";
const STORAGE_KEY_FALLBACK_URLS = "shiori_hub_fallback_urls";

export interface HubConfig {
  primaryUrl: string;
  fallbackUrls: string[];
  instanceUuid: string;
}

export class HubService {
  /**
   * Obtém ou inicializa o UUID exclusivo desta instância cliente.
   * Garante a pseudonimização sem expor identidade real do leitor.
   */
  public static getInstanceUuid(): string {
    let uuid = localStorage.getItem(STORAGE_KEY_UUID);
    if (!uuid) {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        uuid = crypto.randomUUID();
      } else {
        uuid = "inst-" + Math.random().toString(36).substring(2, 15) + "-" + Date.now();
      }
      localStorage.setItem(STORAGE_KEY_UUID, uuid);
    }
    return uuid;
  }

  public static getHubConfig(): HubConfig {
    const defaultUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;
    const primaryUrl = localStorage.getItem(STORAGE_KEY_HUB_URL) || defaultUrl;
    let fallbackUrls: string[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FALLBACK_URLS);
      if (stored) {
        fallbackUrls = JSON.parse(stored);
      }
    } catch {
      fallbackUrls = [];
    }

    return {
      primaryUrl,
      fallbackUrls,
      instanceUuid: this.getInstanceUuid(),
    };
  }

  public static saveHubConfig(primaryUrl: string, fallbackUrls: string[]): void {
    if (primaryUrl) {
      localStorage.setItem(STORAGE_KEY_HUB_URL, primaryUrl.trim());
    }
    localStorage.setItem(STORAGE_KEY_FALLBACK_URLS, JSON.stringify(fallbackUrls.filter(Boolean)));
  }

  /**
   * Envia handshake de pareamento para o Hub shiori-api ativo.
   */
  public static async solicitarPareamento(apelidoPublico: string): Promise<PareamentoResponse> {
    const instanceUuid = this.getInstanceUuid();
    const response = await api.post<PareamentoResponse>("/api/hub/pareamento/solicitar", {
      instanceUuid,
      apelidoPublico: apelidoPublico.trim(),
    });
    return response.data;
  }

  /**
   * Consulta o status da autorização da instância no Hub.
   */
  public static async consultarStatus(): Promise<PareamentoResponse> {
    const instanceUuid = this.getInstanceUuid();
    const response = await api.get<PareamentoResponse>(`/api/hub/pareamento/status/${instanceUuid}`);
    return response.data;
  }

  /**
   * Submete metadados de uma obra de forma 100% anônima para a enciclopédia comunitária global.
   */
  public static async submeterObraAnonima(
    dadosObra: Omit<SubmissaoObraAnonimaRequest, "instanceUuid" | "apelidoPublico">,
    apelidoPublico: string
  ): Promise<ObraResponse> {
    const instanceUuid = this.getInstanceUuid();
    const payload: SubmissaoObraAnonimaRequest = {
      ...dadosObra,
      instanceUuid,
      apelidoPublico: apelidoPublico.trim(),
    };

    const response = await api.post<ObraResponse>("/api/hub/pareamento/submeter-obra", payload);
    return response.data;
  }
}
