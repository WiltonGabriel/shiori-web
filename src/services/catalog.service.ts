import { api } from "./api";
import { LocalShelfRepository } from "./storage/localShelfRepository";
import type {
  ItemCatalogoResponse,
  AdicionarItemCatalogoRequest,
  RegistrarProgressoRequest,
  AtualizarVisibilidadeRequest,
  EstanteExportDTO,
  EstanteImportRequest,
  StatusLeitura,
} from "../types/catalog.types";

export class CatalogService {
  /**
   * Obtém as obras na estante do usuário diretamente da persistência soberana e local.
   */
  public static async getMyShelf(_page?: number, _size?: number): Promise<ItemCatalogoResponse[]> {
    return LocalShelfRepository.getAll();
  }

  public static async getCatalogItem(id: number): Promise<ItemCatalogoResponse> {
    const local = LocalShelfRepository.getById(id);
    if (local) {
      return local;
    }

    const response = await api.get<ItemCatalogoResponse>(`/api/catalogo/${id}`);
    return response.data;
  }

  public static async addItemToShelf(
    data: AdicionarItemCatalogoRequest
  ): Promise<ItemCatalogoResponse> {
    return LocalShelfRepository.add(data);
  }

  public static async updateProgress(
    itemId: number,
    data: RegistrarProgressoRequest
  ): Promise<ItemCatalogoResponse> {
    return LocalShelfRepository.updateProgress(itemId, data);
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
      statusLeitura?: StatusLeitura;
      avaliacaoPessoal?: number;
      urlLeitura?: string;
      anotacao?: string;
      sincronizarMetadados?: boolean;
      generos?: string[];
    }
  ): Promise<ItemCatalogoResponse> {
    return LocalShelfRepository.updateItem(itemId, data);
  }

  public static async updateVisibility(
    itemId: number,
    data: AtualizarVisibilidadeRequest
  ): Promise<void> {
    LocalShelfRepository.updateVisibility(itemId, data.visibilidade);
  }

  public static async removeItemFromShelf(itemId: number): Promise<void> {
    LocalShelfRepository.remove(itemId);
  }

  public static async desvincularObra(itemId: number): Promise<ItemCatalogoResponse> {
    return LocalShelfRepository.unlink(itemId);
  }

  public static async vincularObra(itemId: number, obraId: number, sincronizarMetadados = true): Promise<ItemCatalogoResponse> {
    const current = LocalShelfRepository.getById(itemId);
    if (!current) throw new Error("Item não encontrado");
    return LocalShelfRepository.updateItem(itemId, {
      obraId,
      desvinculado: false,
      sincronizarMetadados,
    });
  }

  public static async atualizarMetaCapitulos(itemId: number): Promise<ItemCatalogoResponse> {
    const item = LocalShelfRepository.getById(itemId);
    if (!item) throw new Error("Item não encontrado");
    return item;
  }

  public static async exportarEstante(): Promise<EstanteExportDTO> {
    return LocalShelfRepository.exportData();
  }

  public static async importarEstante(data: EstanteImportRequest): Promise<{ mensagem: string; totalImportados: number }> {
    return LocalShelfRepository.importData(data);
  }
}
