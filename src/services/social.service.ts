import { api } from "./api";
import type { AtividadeFeedResponse, ConexaoResponse } from "../types/social.types";

export class SocialService {
  public static async getFeed(): Promise<AtividadeFeedResponse[]> {
    const response = await api.get<AtividadeFeedResponse[]>("/api/feed");
    return response.data;
  }

  public static async listConnections(): Promise<ConexaoResponse[]> {
    const response = await api.get<ConexaoResponse[]>("/api/conexoes");
    return response.data;
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
