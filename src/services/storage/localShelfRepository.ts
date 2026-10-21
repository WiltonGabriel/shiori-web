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

export const LOCAL_SHELF_STORAGE_KEY = "shiori_local_shelf_v1";

/**
 * Repositório Soberano de Persistência Local da Estante (Uncle Bob - SRP).
 * Garante autonomia completa do leitor offline utilizando o LocalStorage do navegador.
 */
export class LocalShelfRepository {
  private static getRawItems(): ItemCatalogoResponse[] {
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

  private static saveRawItems(items: ItemCatalogoResponse[]): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    localStorage.setItem(LOCAL_SHELF_STORAGE_KEY, JSON.stringify(items));
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

    const newItem: ItemCatalogoResponse = {
      id: nextId,
      obraId: req.obraId || null,
      obraTitulo: titulo,
      titulo,
      obraCapaUrl: req.capaPersonalizada || req.capaUrl || undefined,
      capaUrl: req.capaPersonalizada || req.capaUrl || undefined,
      obraTotalCapitulos: req.totalCapitulos || req.totalCapitulosEsperados || undefined,
      totalCapitulos: req.totalCapitulos || req.totalCapitulosEsperados || undefined,
      obraTotalVolumes: req.totalVolumes || req.totalVolumesEsperados || undefined,
      totalVolumes: req.totalVolumes || req.totalVolumesEsperados || undefined,
      progressoAtual: req.capituloAtual || req.capituloInicial || 0,
      volumeAtual: req.volumeAtual || req.volumeInicial || undefined,
      statusLeitura: req.statusLeitura || "PLANEJADO",
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
      (latest.anotacao || undefined) === (req.anotacao || undefined) &&
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

    const updated: ItemCatalogoResponse = {
      ...current,
      progressoAtual: novoCapitulo,
      volumeAtual: novoVolume,
      statusLeitura: novoStatus,
      avaliacaoPessoal: novaNota,
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
    const isProgressChange =
      (patch.progressoAtual !== undefined && patch.progressoAtual !== current.progressoAtual) ||
      (patch.volumeAtual !== undefined && patch.volumeAtual !== current.volumeAtual) ||
      (patch.statusLeitura !== undefined && patch.statusLeitura !== current.statusLeitura) ||
      (patch.avaliacaoPessoal !== undefined && patch.avaliacaoPessoal !== current.avaliacaoPessoal) ||
      Boolean(patch.anotacao);

    if (isProgressChange) {
      let anotacaoRegistro = patch.anotacao;
      if (!anotacaoRegistro && patch.progressoAtual !== undefined && patch.progressoAtual < current.progressoAtual) {
        anotacaoRegistro = `Correção de progresso: capítulo ${current.progressoAtual} para ${novoCapitulo}`;
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

    const updated: ItemCatalogoResponse = {
      ...current,
      ...patch,
      obraTitulo: patch.titulo !== undefined ? (patch.titulo.trim() || current.obraTitulo) : current.obraTitulo,
      titulo: patch.titulo !== undefined ? (patch.titulo.trim() || current.titulo) : current.titulo,
      obraCapaUrl: patch.capaUrl !== undefined ? patch.capaUrl : current.obraCapaUrl,
      capaUrl: patch.capaUrl !== undefined ? patch.capaUrl : current.capaUrl,
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

  public static exportData(): EstanteExportDTO {
    const items = this.getAll();
    return {
      versao: "1.0",
      exportadoEm: new Date().toISOString(),
      usuarioApelido: "Leitor Local",
      totalItens: items.length,
      itens: items.map((i) => ({
        titulo: i.titulo || i.obraTitulo,
        capaUrl: i.capaUrl || i.obraCapaUrl,
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
      })),
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
        obraCapaUrl: itemDTO.capaUrl,
        capaUrl: itemDTO.capaUrl,
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
        dataAdicao: now,
        ultimaAtualizacao: now,
        desvinculado: Boolean(itemDTO.desvinculado || !itemDTO.obraGlobalId),
        historicosLeitura: [],
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
