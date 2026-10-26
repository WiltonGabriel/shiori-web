import type { ItemCatalogoResponse, StatusLeitura } from "../../../types/catalog.types";

export type FilterTab = "TODOS" | "LENDO" | "ENGAVETADO" | "TERMINOU" | "PLANEJADO" | "ABDICOU";

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
