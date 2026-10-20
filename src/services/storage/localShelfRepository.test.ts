import { beforeEach, describe, expect, it } from "vitest";
import { LocalShelfRepository, LOCAL_SHELF_STORAGE_KEY } from "./localShelfRepository";

describe("LocalShelfRepository (Modo 100% Local / Soberania do Leitor)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("retorna lista vazia quando o LocalStorage está vazio ou não inicializado", () => {
    const items = LocalShelfRepository.getAll();
    expect(items).toEqual([]);
  });

  it("adiciona uma nova obra localmente e persiste no LocalStorage", () => {
    const novoItem = LocalShelfRepository.add({
      titulo: "Frieren: Beyond Journey's End",
      tipoObra: "MANGA",
      statusLeitura: "LENDO",
      capituloAtual: 12,
      totalCapitulos: 140,
      visibilidade: "PRIVADO",
    });

    expect(novoItem.id).toBe(1);
    expect(novoItem.obraTitulo).toBe("Frieren: Beyond Journey's End");
    expect(novoItem.progressoAtual).toBe(12);
    expect(novoItem.statusLeitura).toBe("LENDO");
    expect(novoItem.desvinculado).toBe(true);
    expect(novoItem.historicosLeitura).toHaveLength(1);
    expect(novoItem.historicosLeitura[0].capituloLido).toBe(12);

    // Conferir se foi persistido no localStorage
    const raw = localStorage.getItem(LOCAL_SHELF_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].obraTitulo).toBe("Frieren: Beyond Journey's End");
  });

  it("atualiza o progresso (+1 capítulo), status e adiciona histórico de leitura", () => {
    const item = LocalShelfRepository.add({
      titulo: "Solo Leveling",
      statusLeitura: "LENDO",
      capituloAtual: 50,
    });

    const atualizado = LocalShelfRepository.updateProgress(item.id, {
      capituloAtual: 51,
      statusLeitura: "LENDO",
      nota: 9,
      anotacao: "Excelente luta no portal vermelho!",
    });

    expect(atualizado.progressoAtual).toBe(51);
    expect(atualizado.avaliacaoPessoal).toBe(9);
    expect(atualizado.historicosLeitura).toHaveLength(2);
    expect(atualizado.historicosLeitura[0].capituloLido).toBe(51);
    expect(atualizado.historicosLeitura[0].anotacao).toBe("Excelente luta no portal vermelho!");

    // Busca novamente do repositório para confirmar persistência
    const reloaded = LocalShelfRepository.getById(item.id);
    expect(reloaded?.progressoAtual).toBe(51);
    expect(reloaded?.avaliacaoPessoal).toBe(9);
  });

  it("atualiza a visibilidade e desvincula do catálogo global", () => {
    const item = LocalShelfRepository.add({
      obraId: 999,
      titulo: "Omniscient Reader",
      statusLeitura: "LENDO",
      visibilidade: "PRIVADO",
    });

    expect(item.obraId).toBe(999);
    expect(item.desvinculado).toBe(false);

    LocalShelfRepository.updateVisibility(item.id, "RESTRITO");
    let reloaded = LocalShelfRepository.getById(item.id);
    expect(reloaded?.visibilidade).toBe("RESTRITO");

    LocalShelfRepository.unlink(item.id);
    reloaded = LocalShelfRepository.getById(item.id);
    expect(reloaded?.obraId).toBeNull();
    expect(reloaded?.desvinculado).toBe(true);
  });

  it("remove item da estante e persiste no LocalStorage", () => {
    const item1 = LocalShelfRepository.add({ titulo: "Obra 1" });
    const item2 = LocalShelfRepository.add({ titulo: "Obra 2" });

    expect(LocalShelfRepository.getAll()).toHaveLength(2);

    LocalShelfRepository.remove(item1.id);

    const remaining = LocalShelfRepository.getAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(item2.id);
  });

  it("exporta e importa backup JSON de forma íntegra", () => {
    LocalShelfRepository.add({
      titulo: "Berserk",
      statusLeitura: "LENDO",
      capituloAtual: 375,
      totalCapitulos: 380,
    });

    const exportDTO = LocalShelfRepository.exportData();
    expect(exportDTO.totalItens).toBe(1);
    expect(exportDTO.itens[0].titulo).toBe("Berserk");

    // Limpar e importar
    localStorage.clear();
    expect(LocalShelfRepository.getAll()).toHaveLength(0);

    const result = LocalShelfRepository.importData({
      itens: exportDTO.itens,
      substituirExistentes: true,
    });

    expect(result.totalImportados).toBe(1);
    const importedItems = LocalShelfRepository.getAll();
    expect(importedItems).toHaveLength(1);
    expect(importedItems[0].obraTitulo).toBe("Berserk");
    expect(importedItems[0].progressoAtual).toBe(375);
  });
});
