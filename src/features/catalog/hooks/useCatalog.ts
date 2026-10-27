import { useState, useEffect, useMemo, useCallback } from "react";
import { WorkService } from "../../../services/work.service";
import { toast } from "../../../store/toastStore";
import { useDebounce } from "../../../hooks/useDebounce";
import type {
  ObraResponse,
  TipoObra,
  StatusPublicacao,
  SortOption,
} from "../../../types/work.types";
import type { FilterState } from "../AdvancedSearchFilter/types";
import { INITIAL_FILTER_STATE } from "../AdvancedSearchFilter/types";
import { isLocalMode } from "../../../services/api/httpClient";
import { FormatPreferencesRepository } from "../../../services/storage/formatPreferencesRepository";

export const PAGE_SIZE = 15;

export interface AssistedNotice {
  formatos: TipoObra[];
  mensagem?: string | null;
}

export const QUICK_TYPES: { value: TipoObra | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos os Tipos" },
  { value: "MANGA", label: "Mangá" },
  { value: "MANHWA", label: "Manhwa" },
  { value: "MANHUA", label: "Manhua" },
  { value: "LIGHT_NOVEL", label: "Light Novel" },
  { value: "WEB_NOVEL", label: "Web Novel" },
  { value: "COMIC", label: "Comic / HQ" },
  { value: "LIVRO", label: "Livro Tradicional" },
];

export const QUICK_STATUSES: { value: StatusPublicacao | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Qualquer Status" },
  { value: "EM_LANCAMENTO", label: "Em Lançamento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "EM_HIATO", label: "Em Hiato" },
  { value: "CANCELADO", label: "Cancelado" },
];

export function useCatalog() {
  const [works, setWorks] = useState<ObraResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(() => !isLocalMode());
  const [assistedNotice, setAssistedNotice] = useState<AssistedNotice | null>(null);

  // Filtros unificados (Series Finder + Quick Filters)
  const [filters, setFiltersState] = useState<FilterState>(INITIAL_FILTER_STATE);
  const debouncedSearch = useDebounce(filters.searchQuery, 300);

  const [currentPage, setCurrentPage] = useState(1);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Quick state helpers for backwards compatibility
  const selectedType: TipoObra | "TODOS" =
    filters.selectedTypes.length === 1 ? filters.selectedTypes[0] : "TODOS";

  const selectedStatus: StatusPublicacao | "TODOS" =
    filters.selectedStatuses.length === 1 ? filters.selectedStatuses[0] : "TODOS";

  const hasAdvancedFilters = useMemo(() => {
    return (
      filters.selectedTypes.length > 1 ||
      filters.selectedStatuses.length > 1 ||
      filters.minChapters !== "" ||
      filters.maxChapters !== "" ||
      filters.minRating !== "" ||
      filters.maxRating !== "" ||
      Object.values(filters.genresState).some((s) => s !== 0) ||
      Object.values(filters.tagsState).some((s) => s !== 0)
    );
  }, [filters]);

  const setFilters = useCallback((nextFilters: FilterState) => {
    setFiltersState(nextFilters);
    setCurrentPage(1);
  }, []);

  const setSearchInput = useCallback((value: string) => {
    setFiltersState((prev) => ({ ...prev, searchQuery: value }));
    setCurrentPage(1);
  }, []);

  const setSelectedType = useCallback((value: TipoObra | "TODOS") => {
    setFiltersState((prev) => ({
      ...prev,
      selectedTypes: value === "TODOS" ? [] : [value],
    }));
    setCurrentPage(1);
  }, []);

  const setSelectedStatus = useCallback((value: StatusPublicacao | "TODOS") => {
    setFiltersState((prev) => ({
      ...prev,
      selectedStatuses: value === "TODOS" ? [] : [value],
    }));
    setCurrentPage(1);
  }, []);

  const setSortBy = useCallback((value: SortOption) => {
    setFiltersState((prev) => ({ ...prev, sortBy: value }));
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFiltersState(INITIAL_FILTER_STATE);
    setCurrentPage(1);
    setAssistedNotice(null);
  }, []);

  const fetchWorks = useCallback(async () => {
    if (isLocalMode()) {
      setWorks([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      if (debouncedSearch.trim()) {
        const result = await WorkService.searchWorksAssisted(debouncedSearch.trim());
        setWorks(result.obras || []);
        if (result.correspondenciasEmOutrosFormatos && (!result.obras || result.obras.length === 0)) {
          setAssistedNotice({
            formatos: result.formatosDetectadosNaoPermitidos,
            mensagem: result.mensagemContextual,
          });
        } else {
          setAssistedNotice(null);
        }
      } else {
        setAssistedNotice(null);
        const data = await WorkService.listWorks();
        setWorks(data || []);
      }
    } catch (err: any) {
      console.error("Falha ao buscar catálogo:", err);
      toast.error(err, "Falha ao Carregar Catálogo");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    let isMounted = true;
    if (isLocalMode()) {
      return;
    }

    if (debouncedSearch.trim()) {
      WorkService.searchWorksAssisted(debouncedSearch.trim())
        .then((result) => {
          if (!isMounted) return;
          setWorks(result.obras || []);
          if (result.correspondenciasEmOutrosFormatos && (!result.obras || result.obras.length === 0)) {
            setAssistedNotice({
              formatos: result.formatosDetectadosNaoPermitidos,
              mensagem: result.mensagemContextual,
            });
          } else {
            setAssistedNotice(null);
          }
          setIsLoading(false);
        })
        .catch((err: any) => {
          if (!isMounted) return;
          console.error("Falha ao buscar catálogo:", err);
          toast.error(err, "Falha ao Carregar Catálogo");
          setIsLoading(false);
        });
    } else {
      WorkService.listWorks()
        .then((data) => {
          if (!isMounted) return;
          setAssistedNotice(null);
          setWorks(data || []);
          setIsLoading(false);
        })
        .catch((err: any) => {
          if (!isMounted) return;
          console.error("Falha ao buscar catálogo:", err);
          toast.error(err, "Falha ao Carregar Catálogo");
          setIsLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch]);

  // Filtragem e ordenação refinada no client-side
  const filteredWorks = useMemo(() => {
    const isManualSearch = Boolean(debouncedSearch.trim());

    const incGenres = Object.entries(filters.genresState)
      .filter(([, s]) => s === 1)
      .map(([g]) => g.toLowerCase());
    const excGenres = Object.entries(filters.genresState)
      .filter(([, s]) => s === -1)
      .map(([g]) => g.toLowerCase());

    const incTags = Object.entries(filters.tagsState)
      .filter(([, s]) => s === 1)
      .map(([t]) => t.toLowerCase());
    const excTags = Object.entries(filters.tagsState)
      .filter(([, s]) => s === -1)
      .map(([t]) => t.toLowerCase());

    const result = works.filter((w) => {
      // Regra de Conteúdo: Formatos indesejados (EXCLUDE) são ocultados na descoberta
      if (!isManualSearch && filters.selectedTypes.length === 0) {
        if (!FormatPreferencesRepository.shouldShowInDiscovery(w.tipoObra, false)) {
          return false;
        }
      }

      // Busca textual
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchTitle = w.tituloPrincipal?.toLowerCase().includes(q) || false;
        const matchOriginal = w.tituloOriginal?.toLowerCase().includes(q) || false;
        const matchGenre = w.generos?.some((g) => g.toLowerCase().includes(q)) || false;
        const matchTag = w.tags?.some((t) => t.toLowerCase().includes(q)) || false;
        if (!matchTitle && !matchOriginal && !matchGenre && !matchTag) return false;
      }

      // Filtro por Formatos Literários
      if (filters.selectedTypes.length > 0 && !filters.selectedTypes.includes(w.tipoObra)) {
        return false;
      }

      // Filtro por Status
      if (
        filters.selectedStatuses.length > 0 &&
        (!w.statusPublicacao || !filters.selectedStatuses.includes(w.statusPublicacao))
      ) {
        return false;
      }

      // Filtro por Capítulos
      const caps = w.totalCapitulosLancados || 0;
      if (filters.minChapters !== "" && caps < filters.minChapters) {
        return false;
      }
      if (filters.maxChapters !== "" && caps > filters.maxChapters) {
        return false;
      }

      // Filtro por Nota
      const nota = w.notaGeral || 0;
      if (filters.minRating !== "" && nota < filters.minRating) {
        return false;
      }
      if (filters.maxRating !== "" && nota > filters.maxRating) {
        return false;
      }

      // Filtro por Gêneros Excluídos (NOT)
      const workGenres = (w.generos || []).map((g) => g.toLowerCase());
      if (excGenres.length > 0 && excGenres.some((eg) => workGenres.includes(eg))) {
        return false;
      }

      // Filtro por Gêneros Incluídos (AND / OR)
      if (incGenres.length > 0) {
        if (filters.generosModo === "AND") {
          const hasAll = incGenres.every((ig) => workGenres.includes(ig));
          if (!hasAll) return false;
        } else {
          const hasAny = incGenres.some((ig) => workGenres.includes(ig));
          if (!hasAny) return false;
        }
      }

      // Filtro por Tags Excluídas (NOT)
      const workTags = (w.tags || []).map((t) => t.toLowerCase());
      if (excTags.length > 0 && excTags.some((et) => workTags.includes(et))) {
        return false;
      }

      // Filtro por Tags Incluídas (AND / OR)
      if (incTags.length > 0) {
        if (filters.tagsModo === "AND") {
          const hasAll = incTags.every((it) => workTags.includes(it));
          if (!hasAll) return false;
        } else {
          const hasAny = incTags.some((it) => workTags.includes(it));
          if (!hasAny) return false;
        }
      }

      return true;
    });

    return result.sort((a, b) => {
      if (filters.sortBy === "NOTA_DESC") {
        return (b.notaGeral || 0) - (a.notaGeral || 0);
      }
      if (filters.sortBy === "CAPITULOS_DESC") {
        return (b.totalCapitulosLancados || 0) - (a.totalCapitulosLancados || 0);
      }
      if (filters.sortBy === "TITULO_ASC") {
        return a.tituloPrincipal.localeCompare(b.tituloPrincipal);
      }
      if (filters.sortBy === "TITULO_DESC") {
        return b.tituloPrincipal.localeCompare(a.tituloPrincipal);
      }
      if (filters.sortBy === "RECENTES") {
        return b.id - a.id;
      }
      if (filters.sortBy === "ANTIGAS") {
        return a.id - b.id;
      }
      return 0;
    });
  }, [works, debouncedSearch, filters]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredWorks.length / PAGE_SIZE));
  const paginatedWorks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredWorks.slice(start, start + PAGE_SIZE);
  }, [filteredWorks, currentPage]);

  return {
    works,
    filteredWorks,
    paginatedWorks,
    isLoading,
    assistedNotice,
    filters,
    setFilters,
    hasAdvancedFilters,
    searchInput: filters.searchQuery,
    setSearchInput,
    selectedType,
    setSelectedType,
    selectedStatus,
    setSelectedStatus,
    sortBy: filters.sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    totalPages,
    isAdvancedOpen,
    setIsAdvancedOpen,
    fetchWorks,
    handleResetFilters,
  };
}
