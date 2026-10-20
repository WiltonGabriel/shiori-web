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

    try {
      const response = await api.get<any>("/api/catalogo/minha-estante", {
        params: { page, size },
      });
      const remoteItems: ItemCatalogoResponse[] =
        response.data && Array.isArray(response.data.content)
          ? response.data.content
          : Array.isArray(response.data)
          ? response.data
          : [];

      const localItems = LocalShelfRepository.getAll();
      const remoteIds = new Set(remoteItems.map((i) => i.id));
      const purelyLocal = localItems.filter((i) => !remoteIds.has(i.id));

      return [...remoteItems, ...purelyLocal];
    } catch {
      return LocalShelfRepository.getAll();
    }
  }

  public static async getCatalogItem(id: number): Promise<ItemCatalogoResponse> {
    if (isLocalMode()) {
      const item = LocalShelfRepository.getById(id);
      if (!item) {
        throw new Error(`Obra não encontrada na estante local (ID: ${id})`);
      }
      return item;
    }

    try {
      const response = await api.get<ItemCatalogoResponse>(`/api/catalogo/${id}`);
      return response.data;
    } catch (err: any) {
      const local = LocalShelfRepository.getById(id);
      if (local) {
        return local;
      }
      throw err;
    }
  }

  public static async addItemToShelf(
    data: AdicionarItemCatalogoRequest
  ): Promise<ItemCatalogoResponse> {
    if (isLocalMode()) {
      return LocalShelfRepository.add(data);
    }

    try {
      const response = await api.post<ItemCatalogoResponse>("/api/catalogo", data);
      try {
        LocalShelfRepository.add({
          ...data,
          id: response.data.id,
        } as any);
      } catch {
        // ignora se já existir
      }
      return response.data;
    } catch {
      return LocalShelfRepository.add(data);
    }
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

  public static async updatePersonalWork(
    itemId: number,
    data: {
      titulo?: string;
      capaUrl?: string;
      tipoObra?: string;
      totalCapitulos?: number;
      totalVolumes?: number;
      progressoAtual?: number;
      volumeAtual?: number;
      statusLeitura?: import("../types/catalog.types").StatusLeitura;
      avaliacaoPessoal?: number;
      urlLeitura?: string;
      anotacao?: string;
      sincronizarMetadados?: boolean;
    }
  ): Promise<ItemCatalogoResponse> {
    if (isLocalMode()) {
      return LocalShelfRepository.updateItem(itemId, data);
    }

    const response = await api.post<ItemCatalogoResponse>(
      `/api/catalogo/${itemId}/progresso`,
      {
        capituloAtual: data.progressoAtual !== undefined ? data.progressoAtual : 0,
        volumeAtual: data.volumeAtual,
        nota: data.avaliacaoPessoal,
        anotacao: data.anotacao,
        statusLeitura: data.statusLeitura,
      }
    );

    try {
      LocalShelfRepository.updateItem(itemId, {
        ...response.data,
        ...data,
      });
    } catch {
      // item pode não existir no storage local em modo puramente remoto
    }

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
    const isLocal = isLocalMode();
    const itemInLocal = LocalShelfRepository.getById(itemId);

    // 1. Remove sempre do repositório local se existir
    if (itemInLocal) {
      LocalShelfRepository.remove(itemId);
    }

    // 2. Se estiver em modo local puro, a exclusão local conclui a operação
    if (isLocal) {
      return;
    }

    // 3. Em modo conectado, tenta sincronizar a exclusão com a API remota
    try {
      await api.delete(`/api/catalogo/${itemId}`);
    } catch (err: any) {
      const is404 = err?.status === 404 || err?.response?.status === 404;
      const isNetworkOrOffline =
        !err?.response ||
        err?.code === "ERR_NETWORK" ||
        err?.message?.includes("Network") ||
        err?.status === 500 ||
        err?.response?.status === 500;

      // Se o item existia localmente ou a API retornou 404/offline, não impede a exclusão da estante do leitor
      if (itemInLocal || is404 || isNetworkOrOffline) {
        console.warn("Item removido localmente; API não processou a exclusão:", err);
        return;
      }
      throw err;
    }
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
