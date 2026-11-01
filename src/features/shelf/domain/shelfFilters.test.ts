import { describe, expect, it } from "vitest";
import { buildShelfItem } from "../../../test/fixtures";
import { applyAdvancedShelfFilters, countByTab, filterByTab } from "./shelfFilters";

describe("shelfFilters", () => {
  const items = [
    buildShelfItem({ statusLeitura: "LENDO" }),
    buildShelfItem({ statusLeitura: "LENDO" }),
    buildShelfItem({ statusLeitura: "PLANEJADO" }),
    buildShelfItem({ statusLeitura: "ENGAVETADO" }),
    buildShelfItem({ statusLeitura: "TERMINOU" }),
    buildShelfItem({ statusLeitura: "ABDICOU" }),
    buildShelfItem({ statusLeitura: "DROPOU" }),
    buildShelfItem({ statusLeitura: "PAUSADO" }),
  ];

  describe("filterByTab", () => {
    it("retorna todos os itens na aba TODOS, inclusive status fora das abas", () => {
      expect(filterByTab(items, "TODOS")).toHaveLength(items.length);
    });

    it("filtra por status exato", () => {
      expect(filterByTab(items, "LENDO")).toHaveLength(2);
      expect(filterByTab(items, "TERMINOU")).toHaveLength(1);
    });

    it("agrupa ABDICOU e o legado DROPOU na aba ABDICOU", () => {
      const result = filterByTab(items, "ABDICOU");
      expect(result.map((i) => i.statusLeitura).sort()).toEqual(["ABDICOU", "DROPOU"]);
    });

    it("não perde itens quando a lista está vazia", () => {
      expect(filterByTab([], "LENDO")).toEqual([]);
    });
  });

  describe("countByTab", () => {
    it("conta por aba e soma DROPOU em ABDICOU", () => {
      expect(countByTab(items)).toEqual({
        TODOS: 8,
        LENDO: 2,
        PLANEJADO: 1,
        ENGAVETADO: 1,
        TERMINOU: 1,
        ABDICOU: 2,
      });
    });

    it("regressão: PAUSADO conta apenas em TODOS e nunca em outra aba", () => {
      const counts = countByTab([buildShelfItem({ statusLeitura: "PAUSADO" })]);
      expect(counts.TODOS).toBe(1);
      expect(counts.LENDO + counts.PLANEJADO + counts.ENGAVETADO + counts.TERMINOU + counts.ABDICOU).toBe(0);
    });

    it("retorna zeros para estante vazia", () => {
      expect(countByTab([]).TODOS).toBe(0);
    });
  });

  describe("applyAdvancedShelfFilters", () => {
    const richItems = [
      buildShelfItem({
        id: 1,
        titulo: "Solo Leveling",
        tituloOriginal: "Na Honjaman Level Up",
        tipoObra: "MANHWA",
        statusLeitura: "LENDO",
        progressoAtual: 110,
        avaliacaoPessoal: 9,
        generos: ["Ação", "Fantasia"],
        tags: ["Protagonista OP", "Dungeon"],
        marcadorOndeParou: "Pág. 42 - Ilha Jeju",
        ultimaDataLida: new Date().toISOString(),
      }),
      buildShelfItem({
        id: 2,
        titulo: "O Senhor dos Anéis",
        tipoObra: "LIVRO",
        statusLeitura: "LENDO",
        progressoAtual: 15,
        avaliacaoPessoal: 10,
        generos: ["Fantasia", "Aventura"],
        tags: ["Clássico"],
        marcadorOndeParou: "Pág. 318 - Valfenda",
        ultimaDataLida: "2024-01-15T12:00:00.000Z",
      }),
    ];

    it("filtra por busca textual em título original, tag ou marcador de onde parou", () => {
      expect(
        applyAdvancedShelfFilters(richItems, { tab: "TODOS", searchQuery: "Honjaman" })
      ).toHaveLength(1);
      expect(
        applyAdvancedShelfFilters(richItems, { tab: "TODOS", searchQuery: "Valfenda" })
      ).toHaveLength(1);
      expect(
        applyAdvancedShelfFilters(richItems, { tab: "TODOS", searchQuery: "Protagonista OP" })
      ).toHaveLength(1);
    });

    it("filtra por categoria, gênero/tag e data de leitura (TODAY)", () => {
      expect(
        applyAdvancedShelfFilters(richItems, { tab: "TODOS", category: "LIVRO" })
      ).toHaveLength(1);
      expect(
        applyAdvancedShelfFilters(richItems, { tab: "TODOS", genreOrTag: "Dungeon" })
      ).toHaveLength(1);
      expect(
        applyAdvancedShelfFilters(richItems, { tab: "TODOS", dateFilter: "TODAY" })
      ).toHaveLength(1);
    });
  });
});
