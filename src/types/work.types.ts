export type TipoObra = "MANGA" | "NOVEL" | "MANHWA" | "MANHUA" | "COMIC" | "LIVRO";
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
