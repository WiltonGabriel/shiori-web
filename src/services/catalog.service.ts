import { api } from "./api";
import { isLocalMode } from "./api/httpClient";
import { LocalShelfRepository } from "./storage/localShelfRepository";
import type {
  ItemCatalogoResponse,
  AdicionarItemCatalogoRequest,
  RegistrarProgressoRequest,
  AtualizarVisibilidadeRequest,
} from "../types/catalog.types";

export class CatalogService {
  /**
   * Obtém as obras na estante do usuário autenticado ou da persistência local (Modo 100% Local).
   */
  public static async getMyShelf(page = 0, size = 100): Promise<ItemCatalogoResponse[]> {
    if (isLocalMode()) {
      return LocalShelfRepository.getAll();
    }

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
    if (isLocalMode()) {
      const item = LocalShelfRepository.getById(id);
      if (!item) {
        throw new Error(`Obra não encontrada na estante local (ID: ${id})`);
      }
      return item;
    }

    const response = await api.get<ItemCatalogoResponse>(`/api/catalogo/${id}`);
    return response.data;
  }

  public static async addItemToShelf(
    data: AdicionarItemCatalogoRequest
  ): Promise<ItemCatalogoResponse> {
    if (isLocalMode()) {
      return LocalShelfRepository.add(data);
    }

    const response = await api.post<ItemCatalogoResponse>("/api/catalogo", data);
    return response.data;
  }

  public static async updateProgress(
    itemId: number,
    data: RegistrarProgressoRequest
  ): Promise<ItemCatalogoResponse> {
    if (isLocalMode()) {
      return LocalShelfRepository.updateProgress(itemId, data);
    }

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
    if (isLocalMode()) {
      LocalShelfRepository.updateVisibility(itemId, data.visibilidade);
      return;
    }

    await api.patch(`/api/catalogo/${itemId}/visibilidade`, data);
  }

  public static async removeItemFromShelf(itemId: number): Promise<void> {
    if (isLocalMode()) {
      LocalShelfRepository.remove(itemId);
      return;
    }

    await api.delete(`/api/catalogo/${itemId}`);
  }

  public static async desvincularObra(itemId: number): Promise<ItemCatalogoResponse> {
    if (isLocalMode()) {
      return LocalShelfRepository.unlink(itemId);
    }

    const response = await api.post<ItemCatalogoResponse>(`/api/catalogo/${itemId}/desvincular`);
    return response.data;
  }

  public static async vincularObra(itemId: number, obraId: number, sincronizarMetadados = true): Promise<ItemCatalogoResponse> {
    if (isLocalMode()) {
      const current = LocalShelfRepository.getById(itemId);
      if (!current) throw new Error("Item não encontrado");
      const updated: ItemCatalogoResponse = {
        ...current,
        obraId,
        desvinculado: false,
        sincronizarMetadados,
      };
      return updated;
    }

    const response = await api.post<ItemCatalogoResponse>(`/api/catalogo/${itemId}/vincular`, {
      obraId,
      sincronizarMetadados,
    });
    return response.data;
  }

  public static async atualizarMetaCapitulos(itemId: number): Promise<ItemCatalogoResponse> {
    if (isLocalMode()) {
      const item = LocalShelfRepository.getById(itemId);
      if (!item) throw new Error("Item não encontrado");
      return item;
    }

    const response = await api.post<ItemCatalogoResponse>(`/api/catalogo/${itemId}/atualizar-meta`);
    return response.data;
  }

  public static async exportarEstante(): Promise<import("../types/catalog.types").EstanteExportDTO> {
    if (isLocalMode()) {
      return LocalShelfRepository.exportData();
    }

    const response = await api.get<import("../types/catalog.types").EstanteExportDTO>("/api/catalogo/exportar");
    return response.data;
  }

  public static async importarEstante(data: import("../types/catalog.types").EstanteImportRequest): Promise<{ mensagem: string; totalImportados: number }> {
    if (isLocalMode()) {
      return LocalShelfRepository.importData(data);
    }

    const response = await api.post<{ mensagem: string; totalImportados: number }>("/api/catalogo/importar", data);
    return response.data;
  }
}
