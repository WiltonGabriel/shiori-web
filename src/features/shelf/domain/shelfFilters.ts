import type { ItemCatalogoResponse, StatusLeitura } from "../../../types/catalog.types";

export type FilterTab = "TODOS" | "LENDO" | "ENGAVETADO" | "TERMINOU" | "PLANEJADO" | "ABDICOU";
export type ReadingDateFilter = "ALL" | "TODAY" | "LAST_7_DAYS" | "THIS_MONTH" | "THIS_YEAR" | "SPECIFIC_DATE";
export type ShelfSortOption = "LAST_READ" | "RATING_DESC" | "TITLE_ASC" | "PROGRESS_DESC";

export interface AdvancedShelfFilters {
  tab: FilterTab;
  searchQuery?: string;
  category?: string;
  genreOrTag?: string;
  dateFilter?: ReadingDateFilter;
  specificDate?: string; // YYYY-MM-DD
  sortBy?: ShelfSortOption;
}

/**
 * A API normaliza DROPOU para ABDICOU na entrada, mas registros antigos
 * ainda podem chegar com DROPOU. Ambos pertencem à aba ABDICOU.
 */
const STATUS_ABANDONADO: readonly StatusLeitura[] = ["ABDICOU", "DROPOU"];

function pertenceAbaAbdicou(status: StatusLeitura): boolean {
  return STATUS_ABANDONADO.includes(status);
}

export function filterByTab(items: ItemCatalogoResponse[], tab: FilterTab): ItemCatalogoResponse[] {
  if (tab === "TODOS") return items;
  if (tab === "ABDICOU") return items.filter((item) => pertenceAbaAbdicou(item.statusLeitura));
  return items.filter((item) => item.statusLeitura === tab);
}

function getEffectiveReadingDate(item: ItemCatalogoResponse): Date | null {
  const raw =
    item.ultimaDataLida ||
    item.historicosLeitura?.[0]?.dataLeitura ||
    item.dataInicioLeitura ||
    item.ultimaAtualizacao;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export function applyAdvancedShelfFilters(
  items: ItemCatalogoResponse[],
  filters: AdvancedShelfFilters
): ItemCatalogoResponse[] {
  let result = filterByTab(items, filters.tab);

  // 1. Busca textual (Título, Título Original, Marcador de Onde Parou, Gênero ou Tag)
  const q = filters.searchQuery?.trim().toLowerCase();
  if (q) {
    result = result.filter((item) => {
      const title = (item.titulo || item.obraTitulo || "").toLowerCase();
      const orig = (item.tituloOriginal || "").toLowerCase();
      const bookmark = (item.marcadorOndeParou || "").toLowerCase();
      const hasTag = (item.tags || []).some((t) => t.toLowerCase().includes(q));
      const hasGenre = (item.generos || []).some((g) => g.toLowerCase().includes(q));
      return (
        title.includes(q) ||
        orig.includes(q) ||
        bookmark.includes(q) ||
        hasTag ||
        hasGenre
      );
    });
  }

  // 2. Filtro por Categoria / Formato
  if (filters.category && filters.category !== "ALL") {
    result = result.filter(
      (item) => (item.tipoObra || "MANGA").toUpperCase() === filters.category!.toUpperCase()
    );
  }

  // 3. Filtro por Gênero Oficial ou Tag Personalizada
  if (filters.genreOrTag && filters.genreOrTag !== "ALL") {
    const target = filters.genreOrTag.toLowerCase();
    result = result.filter((item) => {
      const inGenre = (item.generos || []).some((g) => g.toLowerCase() === target);
      const inTag = (item.tags || []).some((t) => t.toLowerCase() === target);
      return inGenre || inTag;
    });
  }

  // 4. Filtro por Data em que Leu
  if (filters.dateFilter && filters.dateFilter !== "ALL") {
    const now = new Date();
    result = result.filter((item) => {
      const d = getEffectiveReadingDate(item);
      if (!d) return false;

      if (filters.dateFilter === "TODAY") {
        return d.toDateString() === now.toDateString();
      }
      if (filters.dateFilter === "LAST_7_DAYS") {
        const diffMs = now.getTime() - d.getTime();
        return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
      }
      if (filters.dateFilter === "THIS_MONTH") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (filters.dateFilter === "THIS_YEAR") {
        return d.getFullYear() === now.getFullYear();
      }
      if (filters.dateFilter === "SPECIFIC_DATE" && filters.specificDate) {
        const itemDateStr = d.toISOString().split("T")[0];
        return itemDateStr === filters.specificDate;
      }
      return true;
    });
  }

  // 5. Ordenação
  const sortBy = filters.sortBy || "LAST_READ";
  result = [...result].sort((a, b) => {
    if (sortBy === "RATING_DESC") {
      return (b.avaliacaoPessoal || 0) - (a.avaliacaoPessoal || 0);
    }
    if (sortBy === "TITLE_ASC") {
      return (a.titulo || a.obraTitulo || "").localeCompare(b.titulo || b.obraTitulo || "");
    }
    if (sortBy === "PROGRESS_DESC") {
      return (b.progressoAtual || 0) - (a.progressoAtual || 0);
    }
    // Default: LAST_READ
    const da = getEffectiveReadingDate(a)?.getTime() || 0;
    const db = getEffectiveReadingDate(b)?.getTime() || 0;
    return db - da;
  });

  return result;
}

export function countByTab(items: ItemCatalogoResponse[]): Record<FilterTab, number> {
  const counts: Record<FilterTab, number> = {
    TODOS: items.length,
    LENDO: 0,
    ENGAVETADO: 0,
    TERMINOU: 0,
    PLANEJADO: 0,
    ABDICOU: 0,
  };

  items.forEach(({ statusLeitura }) => {
    if (pertenceAbaAbdicou(statusLeitura)) counts.ABDICOU++;
    else if (statusLeitura in counts) counts[statusLeitura as FilterTab]++;
  });

  return counts;
}
