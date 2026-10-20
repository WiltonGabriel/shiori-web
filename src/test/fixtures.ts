import type { ItemCatalogoResponse } from "../types/catalog.types";
import type { ObraResponse } from "../types/work.types";

let nextId = 1;
let nextWorkId = 1000;

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

/** Cria uma obra do catálogo global válida. */
export function buildWork(overrides: Partial<ObraResponse> = {}): ObraResponse {
  const id = overrides.id ?? nextWorkId++;
  return {
    id,
    tituloPrincipal: `Obra Global ${id}`,
    tipoObra: "MANGA",
    statusCatalogo: "OFICIAL",
    generos: [],
    tags: [],
    ...overrides,
  };
}
