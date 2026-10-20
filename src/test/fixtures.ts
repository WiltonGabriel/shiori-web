import type { ItemCatalogoResponse } from "../types/catalog.types";

let nextId = 1;

/** Cria um item de estante válido; sobrescreva apenas o que o teste exige. */
export function buildShelfItem(overrides: Partial<ItemCatalogoResponse> = {}): ItemCatalogoResponse {
  const id = overrides.id ?? nextId++;
  return {
    id,
    obraId: id,
    obraTitulo: `Obra ${id}`,
    progressoAtual: 0,
    statusLeitura: "PLANEJADO",
    visibilidade: "PRIVADO",
    dataAdicao: "2026-01-01T00:00:00Z",
    ultimaAtualizacao: "2026-01-01T00:00:00Z",
    historicosLeitura: [],
    ...overrides,
  };
}
