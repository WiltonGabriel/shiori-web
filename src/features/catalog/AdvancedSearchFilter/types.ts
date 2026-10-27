import type { TipoObra, StatusPublicacao, TriState, SortOption, ModoFiltroColecao } from "../../../types/work.types";

export interface FilterState {
  searchQuery: string;
  selectedTypes: TipoObra[];
  selectedStatuses: StatusPublicacao[];
  minChapters: number | "";
  maxChapters: number | "";
  minRating: number | "";
  maxRating: number | "";
  genresState: Record<string, TriState>;
  generosModo: ModoFiltroColecao;
  tagsState: Record<string, TriState>;
  tagsModo: ModoFiltroColecao;
  sortBy: SortOption;
}

export const INITIAL_FILTER_STATE: FilterState = {
  searchQuery: "",
  selectedTypes: [],
  selectedStatuses: [],
  minChapters: "",
  maxChapters: "",
  minRating: "",
  maxRating: "",
  genresState: {},
  generosModo: "AND",
  tagsState: {},
  tagsModo: "AND",
  sortBy: "NOTA_DESC",
};
