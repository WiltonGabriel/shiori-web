import type { TipoObra } from "./work.types";

export type TriState = 0 | 1 | -1; // 0: Neutro, 1: Incluir (+), -1: Excluir (-)

export type SortOption = "NOTA_DESC" | "CAPITULOS_DESC" | "RECENTES" | "TITULO_ASC";

export interface SearchFiltersState {
  searchQuery: string;
  selectedTypes: TipoObra[];
  genresState: Record<string, TriState>;
  tagsState: Record<string, TriState>;
  minChapters: number;
  sortBy: SortOption;
}

export const DEFAULT_FILTERS: SearchFiltersState = {
  searchQuery: "",
  selectedTypes: [],
  genresState: {},
  tagsState: {},
  minChapters: 0,
  sortBy: "NOTA_DESC",
};

export const COMMON_GENRES = [
  "Ação",
  "Aventura",
  "Fantasia",
  "Isekai",
  "Romance",
  "Ficção Científica",
  "Mistério",
  "Sobrenatural",
  "Slice of Life",
  "Comédia",
  "Drama",
  "Psicológico",
  "Terror",
  "Artes Marciais",
  "Histórico",
];

export const COMMON_TAGS = [
  "Reencarnação",
  "Protagonista Forte",
  "Sistema de Jogo",
  "Dungeons",
  "Magia",
  "Cultivação",
  "Viagem no Tempo",
  "Vilã",
  "Monstros",
  "Vingança",
  "Construção de Reino",
];
