export type TipoObra =
  | "MANGA"
  | "MANHWA"
  | "MANHUA"
  | "LIGHT_NOVEL"
  | "WEB_NOVEL"
  | "COMIC"
  | "LIVRO";

export const TIPO_OBRA_LABELS: Record<TipoObra, string> = {
  MANGA: "Mangá",
  MANHWA: "Manhwa",
  MANHUA: "Manhua",
  LIGHT_NOVEL: "Light Novel",
  WEB_NOVEL: "Web Novel",
  COMIC: "Comic / HQ",
  LIVRO: "Livro Tradicional",
};

export const TODOS_FORMATOS: TipoObra[] = [
  "MANGA",
  "MANHWA",
  "MANHUA",
  "LIGHT_NOVEL",
  "WEB_NOVEL",
  "COMIC",
  "LIVRO",
];

export type StatusCatalogo = "PRIVADO" | "COMUNITARIO" | "OFICIAL";
export type StatusPublicacao = "EM_LANCAMENTO" | "CONCLUIDO" | "EM_HIATO" | "CANCELADO" | "NAO_LANCADO";

export interface ObraResponse {
  id: number;
  tituloPrincipal: string;
  tituloOriginal?: string;
  capaUrl?: string;
  sinopse?: string;
  totalCapitulosLancados?: number;
  totalVolumes?: number;
  notaGeral?: number;
  tipoObra: TipoObra;
  statusCatalogo: StatusCatalogo;
  statusPublicacao?: StatusPublicacao;
  idiomaOriginal?: string;
  criadoPorUsuarioId?: number;
  generos: string[];
  tags: string[];
}

export interface ObraCadastroRequest {
  tituloPrincipal: string;
  tituloOriginal?: string;
  capaUrl?: string;
  sinopse?: string;
  totalCapitulosLancados?: number;
  tipoObra: TipoObra;
}

export interface ResultadoBuscaObrasResponse {
  obras: ObraResponse[];
  correspondenciasEmOutrosFormatos: boolean;
  formatosDetectadosNaoPermitidos: TipoObra[];
  mensagemContextual?: string | null;
}

export interface IntegracaoMetadadosObra {
  provedorCodigo?: string;
  idExterno: string;
  tituloPrincipal: string;
  tituloOriginal?: string;
  sinopse?: string;
  capaUrl?: string;
  totalCapitulosLancados?: number;
  totalVolumes?: number;
  tipoObra: TipoObra | string;
  generos: string[];
  tags: string[];
}

export type TriState = 0 | 1 | -1;
export type SortOption = "NOTA_DESC" | "CAPITULOS_DESC" | "TITULO_ASC" | "RECENTES";

export interface CatalogSearchFilters {
  searchQuery: string;
  selectedTypes: TipoObra[];
  selectedStatuses: StatusPublicacao[];
  selectedGenres: string[];
  minChapters: number;
  sortBy: SortOption;
}
