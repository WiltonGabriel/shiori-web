import { api } from "./api";
import type { AtividadeFeedResponse, ConexaoResponse } from "../types/social.types";

export class SocialService {
  public static async getFeed(): Promise<AtividadeFeedResponse[]> {
    const response = await api.get<any>("/api/feed");
    if (response.data && Array.isArray(response.data.content)) {
      return response.data.content;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  public static async listConnections(): Promise<ConexaoResponse[]> {
    const response = await api.get<any>("/api/conexoes");
    if (response.data && Array.isArray(response.data.content)) {
      return response.data.content;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  public static async requestConnection(usuarioId: number): Promise<ConexaoResponse> {
    const response = await api.post<ConexaoResponse>(`/api/conexoes/solicitar/${usuarioId}`);
    return response.data;
  }

  public static async acceptConnection(conexaoId: number): Promise<ConexaoResponse> {
    const response = await api.put<ConexaoResponse>(`/api/conexoes/${conexaoId}/aceitar`);
    return response.data;
  }
}
