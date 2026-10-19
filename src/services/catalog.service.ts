import { api } from "./api";
import type {
  ItemCatalogoResponse,
  AdicionarItemCatalogoRequest,
  RegistrarProgressoRequest,
  AtualizarVisibilidadeRequest,
} from "../types/catalog.types";

export class CatalogService {
  /**
   * Obtém as obras na estante do usuário autenticado.
   * Suporta o formato Spring Data Page<ItemCatalogoResponse> ({ content: [...] }) e Array direto.
   */
  public static async getMyShelf(page = 0, size = 100): Promise<ItemCatalogoResponse[]> {
    const response = await api.get<any>("/api/catalogo/minha-estante", {
      params: { page, size },
    });
    if (response.data && Array.isArray(response.data.content)) {
      return response.data.content;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  public static async getCatalogItem(id: number): Promise<ItemCatalogoResponse> {
    const response = await api.get<ItemCatalogoResponse>(`/api/catalogo/${id}`);
    return response.data;
  }

  public static async addItemToShelf(
    data: AdicionarItemCatalogoRequest
  ): Promise<ItemCatalogoResponse> {
    const response = await api.post<ItemCatalogoResponse>("/api/catalogo", data);
    return response.data;
  }

  public static async updateProgress(
    itemId: number,
    data: RegistrarProgressoRequest
  ): Promise<ItemCatalogoResponse> {
    const response = await api.post<ItemCatalogoResponse>(
      `/api/catalogo/${itemId}/progresso`,
      data
    );
    return response.data;
  }

  public static async updateVisibility(
    itemId: number,
    data: AtualizarVisibilidadeRequest
  ): Promise<void> {
    await api.patch(`/api/catalogo/${itemId}/visibilidade`, data);
  }

  public static async removeItemFromShelf(itemId: number): Promise<void> {
    await api.delete(`/api/catalogo/${itemId}`);
  }
}
