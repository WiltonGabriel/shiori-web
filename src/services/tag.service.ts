import { api } from "./api";
import type {
  TagObraResponse,
  SugestaoTagResponse,
  SugerirTagRequest,
  VotoTagResponse,
  TipoVoto,
  TagResponse,
  SugestaoTagAdminResponse,
  StatusSugestaoTag,
} from "../types/tag.types";
import type { PaginatedResponse } from "../types/work.types";

export class TagService {
  /**
   * Obtém as tags comunitárias oficiais aprovadas para a obra com seus respectivos scores.
   */
  public static async getTagsByWork(obraId: number): Promise<TagObraResponse[]> {
    const response = await api.get<TagObraResponse[]>(`/api/obras/${obraId}/tags`);
    return response.data;
  }

  /**
   * Envia uma sugestão de tag comunitária para moderação da equipe curadora.
   */
  public static async suggestTag(obraId: number, data: SugerirTagRequest): Promise<SugestaoTagResponse> {
    const response = await api.post<SugestaoTagResponse>(`/api/obras/${obraId}/tags/sugestoes`, data);
    return response.data;
  }

  /**
   * Registra ou altera o voto de relevância (UPVOTE ou DOWNVOTE) na tag de uma obra.
   */
  public static async voteTag(obraId: number, tagId: number, tipoVoto: TipoVoto): Promise<VotoTagResponse> {
    const response = await api.post<VotoTagResponse>(`/api/obras/${obraId}/tags/${tagId}/votar`, { tipoVoto });
    return response.data;
  }

  /**
   * Pesquisa tags no catálogo para reutilização e autocomplete.
   */
  public static async searchTags(termo?: string, limite: number = 20): Promise<TagResponse[]> {
    const params = new URLSearchParams();
    if (termo && termo.trim()) {
      params.append("termo", termo.trim());
    }
    if (limite) {
      params.append("limite", String(limite));
    }
    const response = await api.get<TagResponse[]>("/api/tags", { params });
    return response.data;
  }

  /**
   * Fila de moderação de sugestões de tags (Acesso restrito a Curadores e Administradores).
   */
  public static async listTagSuggestions(
    status?: StatusSugestaoTag,
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<SugestaoTagAdminResponse>> {
    const params = new URLSearchParams();
    if (status) {
      params.append("status", status);
    }
    params.append("page", String(page));
    params.append("size", String(size));

    const response = await api.get<PaginatedResponse<SugestaoTagAdminResponse>>("/api/admin/tags/sugestoes", {
      params,
    });
    return response.data;
  }

  /**
   * Aprova formalmente uma sugestão de tag e a vincula à obra com upvote do autor.
   */
  public static async approveTagSuggestion(id: number): Promise<SugestaoTagAdminResponse> {
    const response = await api.post<SugestaoTagAdminResponse>(`/api/admin/tags/sugestoes/${id}/aprovar`);
    return response.data;
  }

  /**
   * Rejeita formalmente uma sugestão de tag com justificativa registrada para auditoria.
   */
  public static async rejectTagSuggestion(id: number, motivo: string): Promise<SugestaoTagAdminResponse> {
    const response = await api.post<SugestaoTagAdminResponse>(`/api/admin/tags/sugestoes/${id}/rejeitar`, { motivo });
    return response.data;
  }
}
