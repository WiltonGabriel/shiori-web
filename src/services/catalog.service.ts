import { api } from "./api";
import { AuthService } from "./auth.service";
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

function isRemoteAuthenticated(): boolean {
  const user = AuthService.getStoredUser();
  return Boolean(user && user.id > 0 && user.token && user.token !== "shiori-local-session");
}

export class CatalogService {
  /**
   * Obtém as obras na estante do usuário sincronizando com o servidor quando autenticado.
   */
  public static async getMyShelf(_page?: number, _size?: number): Promise<ItemCatalogoResponse[]> {
    await LocalShelfRepository.initializeAsync();
    const localItems = LocalShelfRepository.getAll();
    if (!isRemoteAuthenticated()) {
      return localItems;
    }

    try {
      const response = await api.get<{ content?: ItemCatalogoResponse[] } | ItemCatalogoResponse[]>(
        "/api/catalogo/minha-estante",
        { params: { page: 0, size: 100 } }
      );
      const remoteItems = Array.isArray(response.data)
        ? response.data
        : response.data?.content || [];

      if (remoteItems.length === 0 && localItems.length > 0) {
        return localItems;
      }

      // Mescla anotações, avaliação pessoal e URL de leitura salvas localmente com os itens do servidor
      return remoteItems.map((remote) => {
        const localMatch = localItems.find(
          (l) => l.id === remote.id || (remote.obraId && l.obraId === remote.obraId)
        );
        return localMatch
          ? {
              ...remote,
              urlLeitura: remote.urlLeitura || localMatch.urlLeitura,
              avaliacaoPessoal: remote.avaliacaoPessoal ?? localMatch.avaliacaoPessoal,
            }
          : remote;
      });
    } catch {
      return localItems;
    }
  }

  public static async getCatalogItem(id: number): Promise<ItemCatalogoResponse> {
    const local = LocalShelfRepository.getById(id);
    if (!isRemoteAuthenticated() && local) {
      return local;
    }

    try {
      const response = await api.get<ItemCatalogoResponse>(`/api/catalogo/${id}`);
      if (local) {
        return {
          ...response.data,
          urlLeitura: response.data.urlLeitura || local.urlLeitura,
          avaliacaoPessoal: response.data.avaliacaoPessoal ?? local.avaliacaoPessoal,
        };
      }
      return response.data;
    } catch {
      if (local) return local;
      throw new Error("Item não encontrado na estante");
    }
  }

  public static async addItemToShelf(
    data: AdicionarItemCatalogoRequest
  ): Promise<ItemCatalogoResponse> {
    const localItem = LocalShelfRepository.add(data);
    if (!isRemoteAuthenticated()) {
      return localItem;
    }

    try {
      const response = await api.post<ItemCatalogoResponse>("/api/catalogo", {
        obraId: data.obraId || null,
        tituloPersonalizado: data.tituloPersonalizado || data.titulo || localItem.titulo,
        tituloOriginal: data.tituloOriginal || localItem.tituloOriginal,
        sinopse: data.sinopse || localItem.sinopse,
        capaPersonalizada: data.capaPersonalizada || data.capaUrl || localItem.capaUrl,
        bannerUrl: data.bannerUrl || localItem.bannerUrl,
        tipoObra: data.tipoObra || localItem.tipoObra,
        capituloInicial: data.capituloInicial || data.capituloAtual || localItem.progressoAtual,
        volumeInicial: data.volumeInicial || data.volumeAtual || localItem.volumeAtual,
        totalCapitulosEsperados: data.totalCapitulosEsperados || data.totalCapitulos || localItem.totalCapitulos,
        totalVolumesEsperados: data.totalVolumesEsperados || data.totalVolumes || localItem.totalVolumes,
        visibilidade: data.visibilidade || localItem.visibilidade || "PRIVADO",
        statusLeitura: data.statusLeitura || localItem.statusLeitura || "LENDO",
        urlLeitura: data.urlLeitura || localItem.urlLeitura || null,
        sincronizarMetadados: data.sincronizarMetadados ?? localItem.sincronizarMetadados,
        marcadorOndeParou: data.marcadorOndeParou || localItem.marcadorOndeParou,
        tags: data.tags || localItem.tags,
        dataInicioLeitura: data.dataInicioLeitura || localItem.dataInicioLeitura,
        ultimaDataLida: data.ultimaDataLida || localItem.ultimaDataLida,
        dataConclusaoLeitura: data.dataConclusaoLeitura || localItem.dataConclusaoLeitura,
      });
      return {
        ...localItem,
        ...response.data,
        urlLeitura: response.data.urlLeitura || localItem.urlLeitura,
      };
    } catch {
      return localItem;
    }
  }

  public static async updateProgress(
    itemId: number,
    data: RegistrarProgressoRequest
  ): Promise<ItemCatalogoResponse> {
    const localUpdated = LocalShelfRepository.updateProgress(itemId, data);
    if (!isRemoteAuthenticated()) {
      return localUpdated;
    }

    try {
      const response = await api.post<ItemCatalogoResponse>(`/api/catalogo/${itemId}/progresso`, data);
      return {
        ...localUpdated,
        ...response.data,
      };
    } catch {
      return localUpdated;
    }
  }

  public static async updatePersonalWork(
    itemId: number,
    data: {
      titulo?: string;
      tituloOriginal?: string;
      sinopse?: string;
      capaUrl?: string;
      bannerUrl?: string;
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
      tags?: string[];
      marcadorOndeParou?: string;
      dataInicioLeitura?: string;
      ultimaDataLida?: string;
      dataConclusaoLeitura?: string;
    }
  ): Promise<ItemCatalogoResponse> {
    const local = LocalShelfRepository.updateItem(itemId, data);
    if (isRemoteAuthenticated()) {
      try {
        await api.patch(`/api/catalogo/${itemId}`, data);
      } catch {
        // Persistência local soberana mantida
      }
    }
    return local;
  }

  public static async updateVisibility(
    itemId: number,
    data: AtualizarVisibilidadeRequest
  ): Promise<void> {
    LocalShelfRepository.updateVisibility(itemId, data.visibilidade);
    if (isRemoteAuthenticated()) {
      try {
        await api.patch(`/api/catalogo/${itemId}/visibilidade`, data);
      } catch {
        // Mantém atualização local caso o item seja exclusivamente local
      }
    }
  }

  public static async removeItemFromShelf(itemId: number): Promise<void> {
    LocalShelfRepository.remove(itemId);
    if (isRemoteAuthenticated()) {
      try {
        await api.delete(`/api/catalogo/${itemId}`);
      } catch {
        // Ignora se já removido ou apenas local
      }
    }
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

  public static async exportarItensSelecionados(ids?: number[]): Promise<EstanteExportDTO> {
    return LocalShelfRepository.exportItemsByIds(ids);
  }

  public static async exportarObraUnica(itemId: number): Promise<EstanteExportDTO> {
    return LocalShelfRepository.exportItemsByIds([itemId]);
  }

  public static getAllShelfTags(): string[] {
    return LocalShelfRepository.getAllTags();
  }

  public static async importarEstante(data: EstanteImportRequest): Promise<{ mensagem: string; totalImportados: number }> {
    const localRes = LocalShelfRepository.importData(data);
    if (isRemoteAuthenticated()) {
      await CatalogService.syncLocalShelfToRemote();
    }
    return localRes;
  }

  public static async syncLocalShelfToRemote(): Promise<number> {
    if (!isRemoteAuthenticated()) return 0;
    try {
      const localItems = LocalShelfRepository.getAll();
      if (localItems.length === 0) return 0;

      const remoteResp = await api.get<{ content?: ItemCatalogoResponse[] } | ItemCatalogoResponse[]>(
        "/api/catalogo?page=0&size=200"
      );
      const remoteItems = Array.isArray(remoteResp.data)
        ? remoteResp.data
        : remoteResp.data?.content || [];

      let syncedCount = 0;
      for (const local of localItems) {
        const alreadyExists = remoteItems.some(
          (r) =>
            (local.obraId && r.obraId === local.obraId) ||
            (r.obraTitulo || r.titulo || "").toLowerCase() ===
              (local.obraTitulo || local.titulo || "").toLowerCase()
        );
        if (!alreadyExists) {
          try {
            await api.post("/api/catalogo", {
              obraId: local.obraId || undefined,
              tituloPersonalizado: local.titulo || local.obraTitulo,
              capaPersonalizada: local.capaUrl || local.obraCapaUrl,
              tipoObra: local.tipoObra || "MANGA",
              capituloInicial: local.progressoAtual || 0,
              volumeInicial: local.volumeAtual || 0,
              totalCapitulosEsperados: local.totalCapitulos || local.obraTotalCapitulos,
              totalVolumesEsperados: local.totalVolumes || local.obraTotalVolumes,
              visibilidade: local.visibilidade || "PRIVADO",
              statusLeitura: local.statusLeitura || "LENDO",
              urlLeitura: local.urlLeitura,
              sincronizarMetadados: local.sincronizarMetadados ?? Boolean(local.obraId),
            });
            syncedCount++;
          } catch {
            //Continua sincronizando os demais itens
          }
        }
      }
      return syncedCount;
    } catch {
      return 0;
    }
  }
}
