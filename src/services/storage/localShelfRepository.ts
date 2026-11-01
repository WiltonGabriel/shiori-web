import type {
  ItemCatalogoResponse,
  AdicionarItemCatalogoRequest,
  RegistrarProgressoRequest,
  Visibilidade,
  EstanteExportDTO,
  EstanteImportRequest,
  HistoricoLeituraResponse,
} from "../../types/catalog.types";
import { SettingsRepository } from "./settingsRepository";
import { IndexedDbShelf } from "./indexedDbShelf";

export const LOCAL_SHELF_STORAGE_KEY = "shiori_local_shelf_v1";

/**
 * Repositório Soberano de Persistência Local da Estante (Uncle Bob - SRP).
 * Garante autonomia completa do leitor offline utilizando IndexedDB de alta capacidade
 * com sincronização imediata em cache em memória e migração transparente do LocalStorage.
 */
export class LocalShelfRepository {
  private static inMemoryCache: ItemCatalogoResponse[] | null = null;
  private static isIndexedDbInitialized = false;
  private static initPromise: Promise<ItemCatalogoResponse[]> | null = null;

  /**
   * Inicialização e migração transparente assíncrona (IndexedDB <-> LocalStorage).
   * Garante zero perda de dados para quem já possuía registros em versões anteriores.
   */
  public static async initializeAsync(): Promise<ItemCatalogoResponse[]> {
    if (this.isIndexedDbInitialized && this.inMemoryCache !== null) {
      return this.inMemoryCache;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        if (!IndexedDbShelf.isSupported()) {
          this.inMemoryCache = this.readFromLocalStorage();
          this.isIndexedDbInitialized = true;
          return this.inMemoryCache;
        }

        const count = await IndexedDbShelf.count();
        if (count > 0) {
          const idbItems = await IndexedDbShelf.getAll();
          this.inMemoryCache = idbItems;
          this.isIndexedDbInitialized = true;
          return idbItems;
        }

        // Se o IndexedDB estiver vazio, checa e migra do LocalStorage automaticamente
        const lsItems = this.readFromLocalStorage();
        if (lsItems.length > 0) {
          await IndexedDbShelf.putBatch(lsItems);
          this.inMemoryCache = lsItems;
          this.isIndexedDbInitialized = true;
          return lsItems;
        }

        this.inMemoryCache = [];
        this.isIndexedDbInitialized = true;
        return [];
      } catch (err) {
        console.warn("Falha ao inicializar IndexedDB, operando com LocalStorage:", err);
        this.inMemoryCache = this.readFromLocalStorage();
        this.isIndexedDbInitialized = true;
        return this.inMemoryCache;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  private static readFromLocalStorage(): ItemCatalogoResponse[] {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }
    try {
      const data = localStorage.getItem(LOCAL_SHELF_STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Falha ao recuperar estante local do LocalStorage:", err);
      return [];
    }
  }

  private static getRawItems(): ItemCatalogoResponse[] {
    if (!IndexedDbShelf.isSupported()) {
      return this.readFromLocalStorage();
    }

    if (this.inMemoryCache !== null) {
      return this.inMemoryCache;
    }

    // Leitura síncrona inicial de segurança enquanto o IndexedDB carrega
    const items = this.readFromLocalStorage();
    this.inMemoryCache = items;

    // Dispara inicialização do IndexedDB em background
    if (!this.isIndexedDbInitialized) {
      void this.initializeAsync();
    }

    return items;
  }

  private static saveRawItems(items: ItemCatalogoResponse[]): void {
    this.inMemoryCache = items;

    // 1. Gravação resiliente no IndexedDB (sem limite de 5MB)
    if (IndexedDbShelf.isSupported()) {
      IndexedDbShelf.clear()
        .then(() => IndexedDbShelf.putBatch(items))
        .catch((err) => {
          console.error("Falha ao gravar estante no IndexedDB:", err);
        });
    }

    // 2. Gravação de compatibilidade no LocalStorage (ignora QuotaExceeded de imagens grandes)
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem(LOCAL_SHELF_STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Se exceder a cota do LocalStorage (5MB), a persistência continua garantida pelo IndexedDB
      }
    }
  }

  /**
   * Redefine o cache em memória (utilizado em testes e logout).
   */
  public static resetForTest(): void {
    this.inMemoryCache = null;
    this.isIndexedDbInitialized = false;
    this.initPromise = null;
  }

  public static getAll(): ItemCatalogoResponse[] {
    const items = this.getRawItems();
    return items.sort(
      (a, b) =>
        new Date(b.ultimaAtualizacao).getTime() - new Date(a.ultimaAtualizacao).getTime()
    );
  }

  public static getById(id: number): ItemCatalogoResponse | null {
    const items = this.getRawItems();
    return items.find((i) => i.id === id) || null;
  }

  public static add(req: AdicionarItemCatalogoRequest): ItemCatalogoResponse {
    const items = this.getRawItems();
    const nextId = items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const now = new Date().toISOString();

    const titulo =
      req.tituloPersonalizado?.trim() ||
      req.titulo?.trim() ||
      "Obra sem título";

    const progressoInicial = req.capituloAtual || req.capituloInicial || 0;
    const statusInicial = req.statusLeitura || "PLANEJADO";
    const dataInicio =
      req.dataInicioLeitura?.trim() ||
      (progressoInicial > 0 || statusInicial === "LENDO" || statusInicial === "TERMINOU"
        ? now
        : undefined);
    const ultimaLida =
      req.ultimaDataLida?.trim() ||
      (progressoInicial > 0 ? now : undefined);
    const dataConclusao =
      req.dataConclusaoLeitura?.trim() ||
      (statusInicial === "TERMINOU" ? now : undefined);

    const newItem: ItemCatalogoResponse = {
      id: nextId,
      obraId: req.obraId || null,
      obraTitulo: titulo,
      titulo,
      tituloOriginal: req.tituloOriginal?.trim() || undefined,
      sinopse: req.sinopse?.trim() || undefined,
      obraCapaUrl: req.capaPersonalizada || req.capaUrl || undefined,
      capaUrl: req.capaPersonalizada || req.capaUrl || undefined,
      bannerUrl: req.bannerUrl || undefined,
      obraTotalCapitulos: req.totalCapitulos || req.totalCapitulosEsperados || undefined,
      totalCapitulos: req.totalCapitulos || req.totalCapitulosEsperados || undefined,
      obraTotalVolumes: req.totalVolumes || req.totalVolumesEsperados || undefined,
      totalVolumes: req.totalVolumes || req.totalVolumesEsperados || undefined,
      progressoAtual: progressoInicial,
      volumeAtual: req.volumeAtual || req.volumeInicial || undefined,
      statusLeitura: statusInicial,
      visibilidade: req.visibilidade || "PRIVADO",
      urlLeitura: req.urlLeitura?.trim() || undefined,
      tipoObra: req.tipoObra || "MANGA",
      dataAdicao: now,
      ultimaAtualizacao: now,
      desvinculado: !req.obraId,
      sincronizarMetadados:
        req.sincronizarMetadados !== undefined
          ? Boolean(req.sincronizarMetadados)
          : SettingsRepository.getDefaultSyncMetadata(),
      generos: req.generos && req.generos.length > 0 ? req.generos : undefined,
      tags: req.tags && req.tags.length > 0 ? req.tags : undefined,
      marcadorOndeParou: req.marcadorOndeParou?.trim() || undefined,
      dataInicioLeitura: dataInicio,
      ultimaDataLida: ultimaLida,
      dataConclusaoLeitura: dataConclusao,
      historicosLeitura: [],
    };

    if (newItem.progressoAtual > 0) {
      newItem.historicosLeitura.push({
        id: 1,
        capituloLido: newItem.progressoAtual,
        volumeLido: newItem.volumeAtual,
        dataLeitura: now,
      });
    }

    items.unshift(newItem);
    this.saveRawItems(items);
    return newItem;
  }

  public static updateProgress(
    id: number,
    req: RegistrarProgressoRequest
  ): ItemCatalogoResponse {
    const items = this.getRawItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) {
      throw new Error(`Item da estante local com ID ${id} não foi encontrado.`);
    }

    const current = items[idx];
    const now = new Date().toISOString();

    const novoCapitulo =
      req.capituloAtual !== undefined ? req.capituloAtual : current.progressoAtual;
    const novoVolume =
      req.volumeAtual !== undefined ? req.volumeAtual : current.volumeAtual;
    let novoStatus = req.statusLeitura || current.statusLeitura;
    const novaNota =
      req.nota !== undefined ? req.nota : current.avaliacaoPessoal;

    // Conclusão consistente ao atingir total de capítulos
    const totalCaps = current.totalCapitulos || current.obraTotalCapitulos;
    if (totalCaps && totalCaps > 0 && novoCapitulo >= totalCaps && novoStatus === "LENDO") {
      novoStatus = "TERMINOU";
    }

    const existingHistoricos = [...(current.historicosLeitura || [])];
    const latest = existingHistoricos[0];

    // Prevenção de duplicações: não gera novo ciclo idêntico se progresso não mudou
    const isExactDuplicate =
      latest &&
      latest.capituloLido === novoCapitulo &&
      (latest.volumeLido || undefined) === (novoVolume || undefined) &&
      (latest.notaMomento || undefined) === (novaNota || undefined) &&
      (!req.anotacao || latest.anotacao === req.anotacao) &&
      current.statusLeitura === novoStatus &&
      current.progressoAtual === novoCapitulo;

    let historicosAtualizados = existingHistoricos;

    if (!isExactDuplicate) {
      if (
        latest &&
        latest.capituloLido === novoCapitulo &&
        (latest.volumeLido || undefined) === (novoVolume || undefined) &&
        (req.anotacao || req.nota !== undefined)
      ) {
        // Atualiza nota ou reflexão do mesmo capítulo/volume
        historicosAtualizados[0] = {
          ...latest,
          notaMomento: novaNota !== undefined ? novaNota : latest.notaMomento,
          anotacao: req.anotacao !== undefined ? req.anotacao : latest.anotacao,
          dataLeitura: now,
        };
      } else {
        // Registro de avanço ou correção de progresso
        let anotacaoRegistro = req.anotacao;
        if (!anotacaoRegistro && novoCapitulo < current.progressoAtual) {
          anotacaoRegistro = `Correção de progresso: capítulo ${current.progressoAtual} para ${novoCapitulo}`;
        } else if (!anotacaoRegistro && novoStatus === "TERMINOU" && current.statusLeitura !== "TERMINOU") {
          anotacaoRegistro = "Leitura concluída (Ciclo finalizado)";
        }

        const novoHistorico: HistoricoLeituraResponse = {
          id: (current.historicosLeitura?.length || 0) + 1,
          capituloLido: novoCapitulo,
          volumeLido: novoVolume,
          notaMomento: novaNota,
          anotacao: anotacaoRegistro,
          dataLeitura: now,
        };
        historicosAtualizados = [novoHistorico, ...existingHistoricos];
      }
    }

    const dataInicio =
      current.dataInicioLeitura ||
      (novoCapitulo > 0 || novoStatus === "LENDO" || novoStatus === "TERMINOU" ? now : undefined);
    const ultimaLida =
      req.ultimaDataLida ||
      (novoCapitulo !== current.progressoAtual || novoVolume !== current.volumeAtual ? now : current.ultimaDataLida || now);
    const dataConclusao =
      novoStatus === "TERMINOU"
        ? current.dataConclusaoLeitura || now
        : current.dataConclusaoLeitura;

    const updated: ItemCatalogoResponse = {
      ...current,
      progressoAtual: novoCapitulo,
      volumeAtual: novoVolume,
      statusLeitura: novoStatus,
      avaliacaoPessoal: novaNota,
      marcadorOndeParou:
        req.marcadorOndeParou !== undefined
          ? req.marcadorOndeParou.trim() || undefined
          : current.marcadorOndeParou,
      dataInicioLeitura: dataInicio,
      ultimaDataLida: ultimaLida,
      dataConclusaoLeitura: dataConclusao,
      ultimaAtualizacao: now,
      historicosLeitura: historicosAtualizados,
    };

    items[idx] = updated;
    this.saveRawItems(items);
    return updated;
  }

  public static updateItem(
    id: number,
    patch: Partial<ItemCatalogoResponse> & { anotacao?: string }
  ): ItemCatalogoResponse {
    const items = this.getRawItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) {
      throw new Error(`Item da estante local com ID ${id} não foi encontrado.`);
    }

    const current = items[idx];
    const now = new Date().toISOString();

    const novoCapitulo =
      patch.progressoAtual !== undefined ? patch.progressoAtual : current.progressoAtual;
    const novoVolume =
      patch.volumeAtual !== undefined ? patch.volumeAtual : current.volumeAtual;
    let novoStatus = patch.statusLeitura || current.statusLeitura;
    const novaNota =
      patch.avaliacaoPessoal !== undefined ? patch.avaliacaoPessoal : current.avaliacaoPessoal;

    const totalCaps = patch.totalCapitulos !== undefined ? patch.totalCapitulos : (current.totalCapitulos || current.obraTotalCapitulos);
    if (totalCaps && totalCaps > 0 && novoCapitulo >= totalCaps && novoStatus === "LENDO") {
      novoStatus = "TERMINOU";
    }

    const historicos = [...(current.historicosLeitura || [])];
    const latest = historicos[0];
    const isExactDuplicate =
      latest &&
      latest.capituloLido === novoCapitulo &&
      (latest.volumeLido || undefined) === (novoVolume || undefined) &&
      (latest.notaMomento || undefined) === (novaNota || undefined) &&
      (!patch.anotacao || latest.anotacao === patch.anotacao) &&
      current.statusLeitura === novoStatus &&
      current.progressoAtual === novoCapitulo;

    if (!isExactDuplicate) {
      const isProgressChange =
        (patch.progressoAtual !== undefined && patch.progressoAtual !== current.progressoAtual) ||
        (patch.volumeAtual !== undefined && patch.volumeAtual !== current.volumeAtual) ||
        (patch.statusLeitura !== undefined && patch.statusLeitura !== current.statusLeitura) ||
        (patch.avaliacaoPessoal !== undefined && patch.avaliacaoPessoal !== current.avaliacaoPessoal) ||
        Boolean(patch.anotacao);

      if (isProgressChange) {
        if (
          latest &&
          latest.capituloLido === novoCapitulo &&
          (latest.volumeLido || undefined) === (novoVolume || undefined) &&
          (patch.anotacao || patch.avaliacaoPessoal !== undefined)
        ) {
          historicos[0] = {
            ...latest,
            notaMomento: novaNota !== undefined ? novaNota : latest.notaMomento,
            anotacao: patch.anotacao !== undefined ? patch.anotacao : latest.anotacao,
            dataLeitura: now,
          };
        } else {
          let anotacaoRegistro = patch.anotacao;
          if (!anotacaoRegistro && patch.progressoAtual !== undefined && patch.progressoAtual < current.progressoAtual) {
            anotacaoRegistro = `Correção de progresso: capítulo ${current.progressoAtual} para ${novoCapitulo}`;
          } else if (!anotacaoRegistro && novoStatus === "TERMINOU" && current.statusLeitura !== "TERMINOU") {
            anotacaoRegistro = "Leitura concluída (Ciclo finalizado)";
          }

          historicos.unshift({
            id: historicos.length + 1,
            capituloLido: novoCapitulo,
            volumeLido: novoVolume,
            notaMomento: novaNota,
            anotacao: anotacaoRegistro,
            dataLeitura: now,
          });
        }
      }
    }

    const dataInicio =
      patch.dataInicioLeitura !== undefined
        ? patch.dataInicioLeitura || undefined
        : current.dataInicioLeitura ||
          (novoCapitulo > 0 || novoStatus === "LENDO" || novoStatus === "TERMINOU" ? now : undefined);
    const ultimaLida =
      patch.ultimaDataLida !== undefined
        ? patch.ultimaDataLida || undefined
        : novoCapitulo !== current.progressoAtual || novoVolume !== current.volumeAtual
          ? now
          : current.ultimaDataLida;
    const dataConclusao =
      patch.dataConclusaoLeitura !== undefined
        ? patch.dataConclusaoLeitura || undefined
        : novoStatus === "TERMINOU"
          ? current.dataConclusaoLeitura || now
          : current.dataConclusaoLeitura;

    const updated: ItemCatalogoResponse = {
      ...current,
      ...patch,
      obraTitulo: patch.titulo !== undefined ? (patch.titulo.trim() || current.obraTitulo) : current.obraTitulo,
      titulo: patch.titulo !== undefined ? (patch.titulo.trim() || current.titulo) : current.titulo,
      tituloOriginal:
        patch.tituloOriginal !== undefined
          ? patch.tituloOriginal.trim() || undefined
          : current.tituloOriginal,
      sinopse:
        patch.sinopse !== undefined
          ? patch.sinopse.trim() || undefined
          : current.sinopse,
      obraCapaUrl: patch.capaUrl !== undefined ? patch.capaUrl : current.obraCapaUrl,
      capaUrl: patch.capaUrl !== undefined ? patch.capaUrl : current.capaUrl,
      bannerUrl: patch.bannerUrl !== undefined ? patch.bannerUrl : current.bannerUrl,
      obraTotalCapitulos: patch.totalCapitulos !== undefined ? patch.totalCapitulos : current.obraTotalCapitulos,
      totalCapitulos: patch.totalCapitulos !== undefined ? patch.totalCapitulos : current.totalCapitulos,
      obraTotalVolumes: patch.totalVolumes !== undefined ? patch.totalVolumes : current.obraTotalVolumes,
      totalVolumes: patch.totalVolumes !== undefined ? patch.totalVolumes : current.totalVolumes,
      progressoAtual: novoCapitulo,
      volumeAtual: novoVolume,
      statusLeitura: novoStatus,
      avaliacaoPessoal: novaNota,
      urlLeitura: patch.urlLeitura !== undefined ? patch.urlLeitura.trim() : current.urlLeitura,
      sincronizarMetadados:
        patch.sincronizarMetadados !== undefined
          ? patch.sincronizarMetadados
          : current.sincronizarMetadados,
      generos: patch.generos !== undefined ? patch.generos : current.generos,
      tags: patch.tags !== undefined ? patch.tags : current.tags,
      marcadorOndeParou:
        patch.marcadorOndeParou !== undefined
          ? patch.marcadorOndeParou.trim() || undefined
          : current.marcadorOndeParou,
      dataInicioLeitura: dataInicio,
      ultimaDataLida: ultimaLida,
      dataConclusaoLeitura: dataConclusao,
      tipoObra: patch.tipoObra || current.tipoObra,
      ultimaAtualizacao: now,
      historicosLeitura: historicos,
    };

    items[idx] = updated;
    this.saveRawItems(items);
    return updated;
  }

  public static updateVisibility(id: number, visibilidade: Visibilidade): void {
    const items = this.getRawItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) {
      throw new Error(`Item da estante local com ID ${id} não foi encontrado.`);
    }
    items[idx] = {
      ...items[idx],
      visibilidade,
      ultimaAtualizacao: new Date().toISOString(),
    };
    this.saveRawItems(items);
  }

  public static unlink(id: number): ItemCatalogoResponse {
    const items = this.getRawItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) {
      throw new Error(`Item da estante local com ID ${id} não foi encontrado.`);
    }
    const updated: ItemCatalogoResponse = {
      ...items[idx],
      obraId: null,
      desvinculado: true,
      sincronizarMetadados: false,
      ultimaAtualizacao: new Date().toISOString(),
    };
    items[idx] = updated;
    this.saveRawItems(items);
    return updated;
  }

  public static remove(id: number): void {
    const items = this.getRawItems();
    const filtered = items.filter((i) => i.id !== id);
    this.saveRawItems(filtered);
  }

  public static getAllTags(): string[] {
    const items = this.getRawItems();
    const tagSet = new Set<string>();
    items.forEach((item) => {
      (item.tags || []).forEach((t) => {
        const cleaned = t.trim();
        if (cleaned) tagSet.add(cleaned);
      });
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }

  private static mapItemToExportDTO(i: ItemCatalogoResponse) {
    return {
      titulo: i.titulo || i.obraTitulo,
      tituloOriginal: i.tituloOriginal,
      sinopse: i.sinopse,
      capaUrl: i.capaUrl || i.obraCapaUrl,
      bannerUrl: i.bannerUrl,
      tipoObra: i.tipoObra,
      progressoAtual: i.progressoAtual,
      volumeAtual: i.volumeAtual,
      totalCapitulos: i.totalCapitulos || i.obraTotalCapitulos,
      totalVolumes: i.totalVolumes || i.obraTotalVolumes,
      statusLeitura: i.statusLeitura,
      visibilidade: i.visibilidade,
      nota: i.avaliacaoPessoal,
      urlLeitura: i.urlLeitura,
      desvinculado: i.desvinculado,
      generos: i.generos,
      tags: i.tags,
      marcadorOndeParou: i.marcadorOndeParou,
      dataInicioLeitura: i.dataInicioLeitura,
      ultimaDataLida: i.ultimaDataLida,
      dataConclusaoLeitura: i.dataConclusaoLeitura,
      historicosLeitura: i.historicosLeitura,
    };
  }

  public static exportData(): EstanteExportDTO {
    const items = this.getAll();
    return {
      versao: "1.1",
      exportadoEm: new Date().toISOString(),
      usuarioApelido: "Leitor Local",
      totalItens: items.length,
      itens: items.map((i) => this.mapItemToExportDTO(i)),
    };
  }

  public static exportItemsByIds(ids?: number[]): EstanteExportDTO {
    const allItems = this.getAll();
    const filtered =
      ids && ids.length > 0 ? allItems.filter((i) => ids.includes(i.id)) : allItems;
    return {
      versao: "1.1",
      exportadoEm: new Date().toISOString(),
      usuarioApelido: "Leitor Local",
      totalItens: filtered.length,
      itens: filtered.map((i) => this.mapItemToExportDTO(i)),
    };
  }

  public static importData(req: EstanteImportRequest): {
    mensagem: string;
    totalImportados: number;
  } {
    if (!Array.isArray(req.itens) || req.itens.length === 0) {
      return { mensagem: "Nenhum item válido para importação.", totalImportados: 0 };
    }

    const currentItems = req.sobrescrever || req.substituirExistentes ? [] : this.getRawItems();
    let count = 0;

    for (const itemDTO of req.itens) {
      if (!itemDTO.titulo) continue;
      const nextId = currentItems.reduce((max, it) => Math.max(max, it.id), 0) + 1;
      const now = new Date().toISOString();

      const imported: ItemCatalogoResponse = {
        id: nextId,
        obraId: itemDTO.obraGlobalId || null,
        obraTitulo: itemDTO.titulo,
        titulo: itemDTO.titulo,
        tituloOriginal: itemDTO.tituloOriginal,
        sinopse: itemDTO.sinopse,
        obraCapaUrl: itemDTO.capaUrl,
        capaUrl: itemDTO.capaUrl,
        bannerUrl: itemDTO.bannerUrl,
        tipoObra: itemDTO.tipoObra || "MANGA",
        progressoAtual: itemDTO.progressoAtual || 0,
        volumeAtual: itemDTO.volumeAtual,
        obraTotalCapitulos: itemDTO.totalCapitulos,
        totalCapitulos: itemDTO.totalCapitulos,
        obraTotalVolumes: itemDTO.totalVolumes,
        totalVolumes: itemDTO.totalVolumes,
        statusLeitura: itemDTO.statusLeitura || "PLANEJADO",
        visibilidade: itemDTO.visibilidade || "PRIVADO",
        avaliacaoPessoal: itemDTO.nota,
        urlLeitura: itemDTO.urlLeitura,
        generos: itemDTO.generos,
        tags: itemDTO.tags,
        marcadorOndeParou: itemDTO.marcadorOndeParou,
        dataInicioLeitura: itemDTO.dataInicioLeitura,
        ultimaDataLida: itemDTO.ultimaDataLida,
        dataConclusaoLeitura: itemDTO.dataConclusaoLeitura,
        dataAdicao: now,
        ultimaAtualizacao: itemDTO.ultimaDataLida || now,
        desvinculado: Boolean(itemDTO.desvinculado || !itemDTO.obraGlobalId),
        historicosLeitura: Array.isArray(itemDTO.historicosLeitura)
          ? itemDTO.historicosLeitura
          : [],
      };

      currentItems.push(imported);
      count++;
    }

    this.saveRawItems(currentItems);
    return {
      mensagem: `${count} itens importados com sucesso para a estante local.`,
      totalImportados: count,
    };
  }
}
